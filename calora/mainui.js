// MainUIScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSequence, withDelay } from 'react-native-reanimated';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import ProfileScreen from './profile'; // تأكد من أن هذا الملف موجود
import HealthService from './healthservice'; // استيراد الخدمة

// --- المكونات المساعدة والثوابت ---
const LeafAnimation = ({ trigger }) => { const opacity = useSharedValue(0); const translateY = useSharedValue(-20); const rotate = useSharedValue(0); useEffect(() => { opacity.value = 0; translateY.value = -20; rotate.value = Math.random() > 0.5 ? -10 : 10; opacity.value = withSequence(withTiming(0.7, { duration: 400 }), withDelay(800, withTiming(0, { duration: 600 }))); translateY.value = withTiming(70, { duration: 2200 }); rotate.value = withTiming(rotate.value > 0 ? 25 : -25, { duration: 2200 }); }, [trigger]); const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }, { rotateZ: `${rotate.value}deg` }], })); return ( <Animated.View style={[styles.leafAnimationContainer, animatedStyle]}><Image source={require('./assets/leafbar.png')} style={styles.leafImage}/></Animated.View> ); };
const APP_COLORS = { primary: '#388E3C', background: '#E8F5E9', card: '#FFFFFF', textPrimary: '#212121', textSecondary: '#757575', progressUnfilled: '#D6EAD7', disabled: '#BDBDBD', carbs: '#007BFF', protein: '#FF7043', fat: '#FFC107' };
const TAB_BAR_COLORS = { background: '#FFFFFF', indicator: '#4CAF50', icon: '#222327' };
const calculateMacroGoals = (totalCalories) => { const caloriesPerGram = { protein: 4, carbs: 4, fat: 9 }; const macroSplit = { protein: 0.30, carbs: 0.40, fat: 0.30 }; return { protein: Math.round((totalCalories * macroSplit.protein) / caloriesPerGram.protein), carbs: Math.round((totalCalories * macroSplit.carbs) / caloriesPerGram.carbs), fat: Math.round((totalCalories * macroSplit.fat) / caloriesPerGram.fat), }; };
const MOCK_DATA = { goal: 2000, food: 1756, exercise: 0, protein: { consumed: 120 }, carbs: { consumed: 180 }, fat: { consumed: 55 }, breakfast: [ { name: 'فول بالزيت والليمون', quantity: 'طبق متوسط', calories: 250, p: 15, c: 30, f: 8 }, { name: '2 بيضة مسلوقة', quantity: 'عدد 2', calories: 156, p: 12, c: 1, f: 10 } ], lunch: [ { name: 'كشري', quantity: 'طبق متوسط', calories: 550, p: 20, c: 90, f: 10 }, { name: 'سلطة خضراء', quantity: 'طبق صغير', calories: 100, p: 2, c: 15, f: 3 } ], dinner: [ { name: 'صدر دجاج مشوي', quantity: '150 جم', calories: 250, p: 45, c: 0, f: 7 }, { name: 'زبادي يوناني', quantity: '170 جم', calories: 150, p: 18, c: 8, f: 5 } ], snacks: [ { name: 'تفاحة', quantity: 'واحدة متوسطة', calories: 100, p: 0, c: 25, f: 0 }, { name: 'مكسرات', quantity: 'حفنة يد', calories: 200, p: 6, c: 7, f: 18 } ] };
const EMPTY_DAY_DATA = { food: 0, exercise: 0, breakfast: [], lunch: [], dinner: [], snacks: [] };
const DateNavigator = ({ selectedDate, onDateSelect, referenceToday }) => { const handlePrevWeek = () => { const newDate = new Date(selectedDate); newDate.setDate(selectedDate.getDate() - 7); onDateSelect(newDate); }; const handleNextWeek = () => { const newDate = new Date(selectedDate); newDate.setDate(selectedDate.getDate() + 7); onDateSelect(newDate); }; const weekDays = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']; const dates = []; const dayIndex = selectedDate.getDay(); const startDate = new Date(selectedDate); startDate.setDate(selectedDate.getDate() - dayIndex); startDate.setHours(0, 0, 0, 0); for (let i = 0; i < 7; i++) { const date = new Date(startDate); date.setDate(startDate.getDate() + i); dates.push(date); } const isSelected = (date) => date.toDateString() === selectedDate.toDateString(); const monthYearString = selectedDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }); const todayWeekStart = new Date(referenceToday); todayWeekStart.setDate(referenceToday.getDate() - referenceToday.getDay()); todayWeekStart.setHours(0, 0, 0, 0); const isNextDisabled = startDate.getTime() >= todayWeekStart.getTime(); return ( <View style={styles.dateNavContainer}><View style={styles.dateNavHeader}><TouchableOpacity onPress={handlePrevWeek} style={styles.arrowButton}><Ionicons name="chevron-back-outline" size={24} color={APP_COLORS.primary} /></TouchableOpacity><Text style={styles.dateNavMonthText}>{monthYearString}</Text><TouchableOpacity onPress={handleNextWeek} style={styles.arrowButton} disabled={isNextDisabled}><Ionicons name="chevron-forward-outline" size={24} color={isNextDisabled ? APP_COLORS.disabled : APP_COLORS.primary} /></TouchableOpacity></View><View style={styles.weekContainer}>{weekDays.map((day, index) => <Text key={index} style={styles.weekDayText}>{day}</Text>)}</View><View style={styles.datesContainer}>{dates.map((date, index) => { const normalizedDate = new Date(date); normalizedDate.setHours(0, 0, 0, 0); const isFutureDate = normalizedDate > referenceToday; return ( <TouchableOpacity key={index} onPress={() => onDateSelect(date)} disabled={isFutureDate}><View style={[styles.dateCircle, isSelected(date) && styles.activeCircle]}><Text style={[styles.dateText, isSelected(date) && styles.activeText, isFutureDate && styles.disabledDateText]}>{date.getDate()}</Text></View></TouchableOpacity> ); })}</View></View> ); };
const SummaryCard = ({ data, dailyGoal }) => { const remaining = Math.round(dailyGoal - data.food + (data.exercise || 0)); const progress = dailyGoal > 0 ? data.food / dailyGoal : 0; return ( <View style={styles.card}><View style={styles.summaryCircleContainer}><Progress.Circle size={Dimensions.get('window').width * 0.45} progress={progress} color={APP_COLORS.primary} unfilledColor={APP_COLORS.progressUnfilled} thickness={12} borderWidth={0} showsText={false} /><View style={styles.summaryTextContainer}><Text style={styles.remainingCaloriesText}>{remaining}</Text><Text style={styles.remainingLabel}>سعر حراري متبقي</Text></View></View></View> ); };
const MacroProgressBar = ({ label, consumed, goal, color }) => ( <View style={styles.macroItem}><View style={styles.macroLabelContainer}><Text style={styles.macroLabel}>{label}</Text><Text style={styles.macroValue}>{Math.round(consumed)} / {goal} جم</Text></View><Progress.Bar progress={goal > 0 ? consumed / goal : 0} width={null} color={color} unfilledColor={`${color}30`} borderWidth={0} height={8} borderRadius={4} /></View> );
const MacrosCard = ({ data }) => ( <View style={styles.card}><MacroProgressBar label="بروتين" consumed={data.protein.consumed} goal={data.protein.goal} color={APP_COLORS.protein} /><MacroProgressBar label="كربوهيدرات" consumed={data.carbs.consumed} goal={data.carbs.goal} color={APP_COLORS.carbs} /><MacroProgressBar label="دهون" consumed={data.fat.consumed} goal={data.fat.goal} color={APP_COLORS.fat} /></View> );
const MealLoggingSection = ({ title, iconName, items, onAddItem, mealKey }) => { const totalCalories = items.reduce((sum, item) => sum + item.calories, 0); const totalMacros = items.reduce((totals, item) => { totals.p += item.p || 0; totals.c += item.c || 0; totals.f += item.f || 0; return totals; }, { p: 0, c: 0, f: 0 }); const handleSmartAddPress = () => { const sampleFood = { name: 'عنصر جديد', quantity: '1 وحدة', calories: 150, p: 5, c: 20, f: 5 }; onAddItem(mealKey, sampleFood); }; return ( <View style={styles.card}><View style={styles.mealSectionHeader}><View style={styles.mealSectionHeaderLeft}><Ionicons name={iconName} size={24} color={APP_COLORS.primary} style={styles.mealIcon} /><Text style={styles.mealSectionTitle}>{title}</Text></View><Text style={styles.mealSectionTotalCalories}>{totalCalories} سعر حراري</Text></View>{items && items.length > 0 && items.map((item, index) => ( <View key={index} style={styles.foodListItem}><View><Text style={styles.foodName}>{item.name}</Text><Text style={styles.foodQuantity}>{item.quantity}</Text></View><Text style={styles.foodCalories}>{item.calories}</Text></View> ))}{items && items.length > 0 && ( <View style={styles.mealMacrosContainer}><View style={styles.macroSummaryItem}><Text style={styles.macroSummaryText}>دهون: {totalMacros.f} جم</Text></View><View style={styles.macroSummaryItem}><Text style={styles.macroSummaryText}>كربوهيدرات: {totalMacros.c} جم</Text></View><View style={styles.macroSummaryItem}><Text style={styles.macroSummaryText}>بروتين: {totalMacros.p} جم</Text></View></View> )}<TouchableOpacity style={styles.smartAddButton} onPress={handleSmartAddPress}><Text style={styles.smartAddButtonText}>+ أضف إلى {title}</Text></TouchableOpacity></View> ); };

// --- مكونات الشاشات ---
function DiaryScreen() { 
    const referenceToday = new Date(); 
    referenceToday.setHours(0, 0, 0, 0); 
    const [selectedDate, setSelectedDate] = useState(referenceToday); 
    const [dailyData, setDailyData] = useState(EMPTY_DAY_DATA); 
    const [dailyGoal, setDailyGoal] = useState(2000); 
    const [macroGoals, setMacroGoals] = useState({ protein: 0, carbs: 0, fat: 0 }); 
    const [calculatedTotals, setCalculatedTotals] = useState({ food: 0, protein: 0, carbs: 0, fat: 0 });
    const [exerciseCalories, setExerciseCalories] = useState(0);

    const formatDateKey = (date) => date.toISOString().slice(0, 10); 

    useFocusEffect( 
        useCallback(() => { 
            const loadLatestData = async () => { 
                try { 
                    const jsonValue = await AsyncStorage.getItem('userProfile'); 
                    if (jsonValue != null) { 
                        const savedProfile = JSON.parse(jsonValue); 
                        if (savedProfile.dailyGoal) { 
                            setDailyGoal(savedProfile.dailyGoal); 
                        } 
                    } 
                } catch (e) { console.error("Failed to load daily goal on focus:", e); } 

                const calories = await HealthService.getDailyCaloriesBurned();
                setExerciseCalories(calories);
            }; 
            loadLatestData(); 
        }, []) 
    ); 

    const handleAddItem = async (mealKey, foodItem) => { const updatedMealArray = [...(dailyData[mealKey] || []), foodItem]; const updatedData = { ...dailyData, [mealKey]: updatedMealArray }; setDailyData(updatedData); try { const dateKey = formatDateKey(selectedDate); await AsyncStorage.setItem(dateKey, JSON.stringify(updatedData)); } catch (e) { console.error("Failed to save data after add:", e); } }; 
    useEffect(() => { if (dailyGoal > 0) { setMacroGoals(calculateMacroGoals(dailyGoal)); } }, [dailyGoal]); 
    useEffect(() => { const setupInitialData = async () => { const mockDateKey = '2025-09-04'; try { const existingData = await AsyncStorage.getItem(mockDateKey); if (!existingData) { await AsyncStorage.setItem(mockDateKey, JSON.stringify(MOCK_DATA)); } } catch (e) { console.error("Failed to seed mock data:", e); } }; setupInitialData(); }, []); 
    useEffect(() => { const loadDataForDate = async (date) => { const dateKey = formatDateKey(date); try { const jsonValue = await AsyncStorage.getItem(dateKey); setDailyData(jsonValue != null ? JSON.parse(jsonValue) : EMPTY_DAY_DATA); } catch (e) { console.error("Failed to load data:", e); setDailyData(EMPTY_DAY_DATA); } }; loadDataForDate(selectedDate); }, [selectedDate]); 
    useEffect(() => { if (!dailyData) return; const allFoodItems = [ ...(dailyData.breakfast || []), ...(dailyData.lunch || []), ...(dailyData.dinner || []), ...(dailyData.snacks || []), ]; const totals = allFoodItems.reduce((acc, item) => { acc.food += item.calories || 0; acc.protein += item.p || 0; acc.carbs += item.c || 0; acc.fat += item.f || 0; return acc; }, { food: 0, protein: 0, carbs: 0, fat: 0 }); setCalculatedTotals(totals); }, [dailyData]); 

    return ( 
        <SafeAreaView style={styles.rootContainer}>
            <ScrollView contentContainerStyle={styles.container}>
                <DateNavigator selectedDate={selectedDate} onDateSelect={setSelectedDate} referenceToday={referenceToday} />
                <SummaryCard data={{ food: calculatedTotals.food, exercise: exerciseCalories }} dailyGoal={dailyGoal} />
                <MacrosCard data={{ protein: { consumed: calculatedTotals.protein, goal: macroGoals.protein }, carbs: { consumed: calculatedTotals.carbs, goal: macroGoals.carbs }, fat: { consumed: calculatedTotals.fat, goal: macroGoals.fat }, }} />
                <View style={styles.sectionHeaderContainer}><Text style={styles.sectionTitle}>أقسام الوجبات</Text><Text style={styles.sectionDescription}>هذا هو السجل التفصيلي لليوم.</Text></View>
                <MealLoggingSection title="الفطور" iconName="sunny-outline" items={dailyData.breakfast || []} onAddItem={handleAddItem} mealKey="breakfast" />
                <MealLoggingSection title="الغداء" iconName="partly-sunny-outline" items={dailyData.lunch || []} onAddItem={handleAddItem} mealKey="lunch" />
                <MealLoggingSection title="العشاء" iconName="moon-outline" items={dailyData.dinner || []} onAddItem={handleAddItem} mealKey="dinner" />
                <MealLoggingSection title="وجبات خفيفة" iconName="nutrition-outline" items={dailyData.snacks || []} onAddItem={handleAddItem} mealKey="snacks" />
            </ScrollView>
        </SafeAreaView> 
    ); 
}
function ReportsScreen() { return (<SafeAreaView style={styles.rootContainer}><View style={styles.placeholderContainer}><Ionicons name="stats-chart-outline" size={80} color={APP_COLORS.primary} /><Text style={styles.placeholderText}>صفحة التقارير</Text></View></SafeAreaView>); }
function CameraScreen() { return (<SafeAreaView style={styles.rootContainer}><View style={styles.placeholderContainer}><Ionicons name="camera-outline" size={80} color={APP_COLORS.primary} /><Text style={styles.placeholderText}>صفحة الكاميرا</Text></View></SafeAreaView>); }

const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_COUNT = 4;
const TAB_WIDTH = SCREEN_WIDTH / TAB_COUNT;
const INDICATOR_DIAMETER = 70;

const MagicLineTabBar = ({ state, descriptors, navigation }) => {
  const translateX = useSharedValue(0);
  const [profileImage, setProfileImage] = useState(null);
  useEffect(() => { translateX.value = withTiming(state.index * TAB_WIDTH, { duration: 500 }); }, [state.index]);
  useFocusEffect( useCallback(() => { const loadProfileImage = async () => { try { const jsonValue = await AsyncStorage.getItem('userProfile'); if (jsonValue != null) { const data = JSON.parse(jsonValue); setProfileImage(data.profileImage || null); } else { setProfileImage(null); } } catch (e) { console.error("Failed to load profile image for tab bar:", e); } }; loadProfileImage(); }, []) );
  const indicatorAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.animationWrapper}><LeafAnimation trigger={state.index} /></View>
      <Animated.View style={[styles.indicatorContainer, indicatorAnimatedStyle]}>
        <View style={styles.indicator}>
          <View style={[styles.cutout, styles.cutoutLeft]} />
          <View style={[styles.cutout, styles.cutoutRight]} />
        </View>
      </Animated.View>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const onPress = () => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!isFocused && !event.defaultPrevented) { navigation.navigate(route.name); } };
        const iconAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: withTiming(isFocused ? -32 : 0, { duration: 500 }) }] }));
        const textAnimatedStyle = useAnimatedStyle(() => ({ opacity: withTiming(isFocused ? 1 : 0, { duration: 500 }), transform: [{ translateY: withTiming(isFocused ? 10 : 20, { duration: 500 }) }] }));
        const isProfileTab = route.name === 'Profile';
        return (
          <TouchableOpacity key={route.key} style={styles.tabItem} onPress={onPress}>
            <Animated.View style={iconAnimatedStyle}>
              {isProfileTab ? ( <Image source={profileImage ? { uri: profileImage } : require('./assets/profile.png')} style={styles.profileTabIcon} /> ) : ( <Ionicons name={options.tabBarIconName || 'alert-circle-outline'} size={28} color={TAB_BAR_COLORS.icon} /> )}
            </Animated.View>
            <Animated.Text style={[styles.tabText, textAnimatedStyle]}>{options.tabBarLabel}</Animated.Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

function MainUIScreen() {
  return (
    <Tab.Navigator 
        tabBar={(props) => <MagicLineTabBar {...props} />} 
        screenOptions={{ headerShown: false }} 
    >
        <Tab.Screen name="Diary" component={DiaryScreen} options={{ tabBarLabel: 'يومياتي', tabBarIconName: 'journal-outline' }} />
        <Tab.Screen name="Reports" component={ReportsScreen} options={{ tabBarLabel: 'تقارير', tabBarIconName: 'stats-chart-outline' }} />
        <Tab.Screen name="Camera" component={CameraScreen} options={{ tabBarLabel: 'كاميرا', tabBarIconName: 'camera-outline' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'حسابي' }} />
    </Tab.Navigator>
  );
}

//--- الأنماط (Styles) ---//
const styles = StyleSheet.create({
    animationWrapper: { position: 'absolute', top: 0, left: 0, right: 0, height: 70, overflow: 'hidden', },
    leafAnimationContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', pointerEvents: 'none', },
    leafImage: { width: '100%', height: 50, resizeMode: 'cover', },
    rootContainer: { flex: 1, backgroundColor: APP_COLORS.background },
    container: { paddingHorizontal: 20, paddingBottom: 80 },
    placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { color: APP_COLORS.primary, fontSize: 22, fontWeight: 'bold', marginTop: 15 },
    card: { backgroundColor: APP_COLORS.card, borderRadius: 20, padding: 20, marginBottom: 15 },
    dateNavContainer: { marginVertical: 10, backgroundColor: APP_COLORS.card, borderRadius: 20, paddingVertical: 15, paddingHorizontal: 10 },
    dateNavHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
    arrowButton: { padding: 5 },
    dateNavMonthText: { fontSize: 18, fontWeight: 'bold', color: APP_COLORS.textPrimary },
    weekContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
    weekDayText: { fontSize: 14, color: APP_COLORS.textSecondary, fontWeight: '500' },
    datesContainer: { flexDirection: 'row', justifyContent: 'space-around' },
    dateCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    activeCircle: { backgroundColor: APP_COLORS.primary },
    dateText: { fontSize: 16, color: APP_COLORS.textPrimary, fontWeight: '600' },
    activeText: { color: '#FFFFFF' },
    disabledDateText: { color: APP_COLORS.disabled },
    summaryCircleContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
    summaryTextContainer: { position: 'absolute', alignItems: 'center' },
    remainingCaloriesText: { fontSize: 42, fontWeight: 'bold', color: APP_COLORS.textPrimary },
    remainingLabel: { fontSize: 14, color: APP_COLORS.textSecondary },
    macroItem: { marginBottom: 15 },
    macroLabelContainer: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 },
    macroLabel: { fontSize: 14, color: APP_COLORS.textPrimary, fontWeight: '500' },
    macroValue: { fontSize: 14, color: APP_COLORS.textSecondary },
    sectionHeaderContainer: { marginTop: 15, marginBottom: 10, },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', color: APP_COLORS.textPrimary, textAlign: 'right', marginBottom: 4, },
    sectionDescription: { fontSize: 14, color: APP_COLORS.textSecondary, textAlign: 'right', },
    mealSectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, },
    mealSectionHeaderLeft: { flexDirection: 'row-reverse', alignItems: 'center' },
    mealIcon: { marginLeft: 10 },
    mealSectionTitle: { fontSize: 22, fontWeight: 'bold', color: APP_COLORS.textPrimary },
    mealSectionTotalCalories: { fontSize: 16, color: APP_COLORS.textSecondary, fontWeight: '600' },
    foodListItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, },
    foodName: { fontSize: 16, color: APP_COLORS.textPrimary, textAlign: 'right' },
    foodQuantity: { fontSize: 13, color: APP_COLORS.textSecondary, textAlign: 'right', marginTop: 2 },
    foodCalories: { fontSize: 16, color: APP_COLORS.textSecondary, fontWeight: '500' },
    mealMacrosContainer: { flexDirection: 'row-reverse', justifyContent: 'flex-start', alignItems: 'center', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: APP_COLORS.background, },
    macroSummaryItem: { marginLeft: 20, },
    macroSummaryText: { fontSize: 13, color: APP_COLORS.textSecondary, fontWeight: '600', },
    smartAddButton: { marginTop: 15, paddingVertical: 15, borderRadius: 15, backgroundColor: APP_COLORS.primary, alignItems: 'center', justifyContent: 'center', width: '100%', },
    smartAddButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', },
    tabBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, flexDirection: 'row', backgroundColor: TAB_BAR_COLORS.background },
    tabItem: { width: TAB_WIDTH, height: 70, justifyContent: 'center', alignItems: 'center' },
    tabText: { position: 'absolute', color: TAB_BAR_COLORS.icon, fontSize: 12, fontWeight: '400' },
    indicatorContainer: { position: 'absolute', top: -35, left: 0, width: TAB_WIDTH, height: INDICATOR_DIAMETER, alignItems: 'center' },
    indicator: { width: INDICATOR_DIAMETER, height: INDICATOR_DIAMETER, backgroundColor: TAB_BAR_COLORS.indicator, borderRadius: INDICATOR_DIAMETER / 2, borderWidth: 6, borderColor: APP_COLORS.background },
    cutout: { position: 'absolute', top: '50%', width: 20, height: 20, backgroundColor: 'transparent', shadowOpacity: 1, shadowRadius: 0 },
    cutoutLeft: { left: -22, borderTopRightRadius: 20, shadowColor: APP_COLORS.background, shadowOffset: { width: 1, height: -10 } },
    cutoutRight: { right: -22, borderTopLeftRadius: 20, shadowColor: APP_COLORS.background, shadowOffset: { width: -1, height: -10 } },
    profileTabIcon: { width: 32, height: 32, borderRadius: 16 },
});

export default MainUIScreen;
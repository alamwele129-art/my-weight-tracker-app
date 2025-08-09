// weighttracker.js (النسخة النهائية مع إضافة إعلان البانر)
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions,
    Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Image, ActivityIndicator
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tips from './tips';

// ---===[ بداية الإضافة (1/4): استيراد مكونات الإعلان) ]===---
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
// ---===[ نهاية الإضافة (1/4) ]===---

// --- استيراد الأيقونات والمكونات ---
const weightNavIcon = require('./assets/balance.png');
const foodNavIcon = require('./assets/restaurant.png');
const waterNavIcon = require('./assets/water.png');
const stepsNavIcon = require('./assets/footprints.png');
const reportsNavIcon = require('./assets/reports.png');
const moreIcon = require('./assets/more.png');

// --- استيراد الشاشات ---
import FoodLogScreen from './food';
import WaterTrackingScreen from './water';
import StepsScreen from './steps';
import ReportsScreen from './reports';
import DistanceScreen from './Distance';
import CaloriesScreen from './Calories';
import ActiveTimeScreen from './ActiveTime';

// ---===[ بداية الإضافة (2/4): تعريف معرّف الوحدة الإعلانية ]===---
// هام: استخدم معرّف الاختبار أثناء التطوير لتجنب انتهاك سياسات AdMob
// سيتم استخدام المعرّف الحقيقي تلقائياً عند بناء النسخة النهائية (الإنتاج)
const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-8833281523608204/2123368284';
// ---===[ نهاية الإضافة (2/4) ]===---


// --- بيانات وترجمات ---
const initialWeightHistory = [
  { date: '2024-05-22', weight: 85.0 }, { date: '2024-05-18', weight: 85.2 },
  { date: '2024-05-15', weight: 85.8 }, { date: '2024-05-10', weight: 85.5 },
  { date: '2024-05-05', weight: 86.1 }, { date: '2024-05-01', weight: 86.0 },
  { date: '2024-04-20', weight: 87.5 }, { date: '2024-04-10', weight: 87.8 },
  { date: '2024-03-15', weight: 88.5 }, { date: '2024-02-20', weight: 89.2 },
  { date: '2024-01-10', weight: 90.0 },
];

const translations = {
  en: {
    weightTracker: 'Weight Tracker', currentStatus: 'Current Status', lastUpdate: 'Last update:', starting: 'Starting', goal: 'Goal', bmi: 'BMI', progressChart: 'Progress Chart', last7Entries: 'Last 7 Entries', history: 'History', logYourWeight: 'Log Your Weight', weightPlaceholder: 'e.g., 85.5', cancel: 'Cancel', save: 'Save', invalidInputTitle: 'Invalid Input', invalidInputMessage: 'Please enter a valid number for your weight.', unrealisticValueTitle: 'Unrealistic Value', unrealisticValueMessage: 'Please enter a weight between 20 and 400 kg.', alreadyLoggedTitle: 'Already Logged', alreadyLoggedMessage: 'You have already logged your weight for today. Would you like to update it?', update: 'Update', kg: 'kg', dailyTip: 'Daily Tip',
    weightNavLabel: 'Weight', foodNavLabel: 'Food', waterNavLabel: 'Water', stepsNavLabel: 'Steps', reportsNavLabel: 'Reports',
  },
  ar: {
    weightTracker: 'متتبع الوزن', currentStatus: 'الحالة الحالية', lastUpdate: 'آخر تحديث:', starting: 'البداية', goal: 'الهدف', bmi: 'مؤشر كتلة الجسم', progressChart: 'مخطط التقدم', last7Entries: 'آخر 7 تسجيلات', history: 'السجل', logYourWeight: 'سجل وزنك', weightPlaceholder: 'مثال: 85.5', cancel: 'إلغاء', save: 'حفظ', invalidInputTitle: 'إدخال غير صالح', invalidInputMessage: 'الرجاء إدخال رقم صحيح لوزنك.', unrealisticValueTitle: 'قيمة غير واقعية', unrealisticValueMessage: 'الرجاء إدخال وزن بين 20 و 400 كجم.', alreadyLoggedTitle: 'تم التسجيل مسبقاً', alreadyLoggedMessage: 'لقد سجلت وزنك لهذا اليوم بالفعل. هل ترغب في تحديثه؟', update: 'تحديث', kg: 'كجم', dailyTip: 'نصيحة يومية',
    weightNavLabel: 'الوزن', foodNavLabel: 'الطعام', waterNavLabel: 'الماء', stepsNavLabel: 'الخطوات', reportsNavLabel: 'التقارير',
  },
};

const getLocalDateString = (date) => { const year = date.getFullYear(); const month = (date.getMonth() + 1).toString().padStart(2, '0'); const day = date.getDate().toString().padStart(2, '0'); return `${year}-${month}-${day}`; };
const formatDisplayDate = (dateString, lang) => { const date = new Date(dateString); const utcDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000); return utcDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', day: '2-digit', year: 'numeric' }); };

const WeightTracker = ({ navigation, language, darkMode }) => {
  const [currentScreen, setCurrentScreen] = useState('weight');
  const [history, setHistory] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [tooltip, setTooltip] = useState(null);
  const [dailyTip, setDailyTip] = useState('');
  const [goalWeight, setGoalWeight] = useState(75.0);
  const [userHeight, setUserHeight] = useState(1.78);
  const [isLoading, setIsLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState('1W');
  const [liveStepsForAchievements, setLiveStepsForAchievements] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem('@WeightTracker:history');
        const parsedHistory = storedHistory ? JSON.parse(storedHistory) : null;
        setHistory(parsedHistory && parsedHistory.length > 0 ? parsedHistory : initialWeightHistory);
        const settingsString = await AsyncStorage.getItem('@Settings:generalSettings');
        if (settingsString) {
          const settings = JSON.parse(settingsString);
          if (settings.weightGoal) setGoalWeight(parseFloat(settings.weightGoal));
          if (settings.height) setUserHeight(parseFloat(settings.height) / 100);
        }
      } catch (e) {
        console.error("Failed to load data.", e); setHistory(initialWeightHistory);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('@WeightTracker:history', JSON.stringify(history));
    }
  }, [history, isLoading]);
  
  useEffect(() => {
    const updateDailyTip = (currentLang) => {
      if (tips[currentLang] && tips[currentLang].length > 0) {
        const today = new Date(); const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const tipIndex = (dayOfYear > 0 ? dayOfYear - 1 : 0) % tips[currentLang].length;
        setDailyTip(tips[currentLang][tipIndex]);
      } else {
        setDailyTip(tips['en']?.[0] || 'Stay hydrated and active!');
      }
    };
    updateDailyTip(language);
  }, [language]);
  
  const hideTooltip = () => setTooltip(null);
  
  const handleAddWeight = () => {
    const t = (key) => translations[language][key] || key;
    if (!newWeight || isNaN(parseFloat(newWeight))) { Alert.alert(t('invalidInputTitle'), t('invalidInputMessage')); return; }
    const weightValue = parseFloat(newWeight);
    if (weightValue <= 20 || weightValue >= 400) { Alert.alert(t('unrealisticValueTitle'), t('unrealisticValueMessage')); return; }
    const today = new Date(); const formattedDate = getLocalDateString(today); const isDateAlreadyAdded = history.some(entry => entry.date === formattedDate);
    if (isDateAlreadyAdded) {
      Alert.alert(t('alreadyLoggedTitle'), t('alreadyLoggedMessage'), [
        { text: t('cancel'), style: "cancel" },
        { text: t('update'), onPress: () => {
          const updatedHistory = history.map(entry => entry.date === formattedDate ? { ...entry, weight: weightValue } : entry);
          setHistory(updatedHistory); setModalVisible(false); setNewWeight('');
        }}
      ]); return;
    }
    const newEntry = { date: formattedDate, weight: weightValue }; const updatedHistory = [...history, newEntry].sort((a, b) => new Date(b.date) - new Date(a.date));
    setHistory(updatedHistory); setModalVisible(false); setNewWeight('');
  };
  
  const handleProfilePress = () => {
    navigation.navigate('profile');
  };

  const renderWeightTrackerScreen = () => {
    const isRTL = language === 'ar';
    const t = (key) => translations[language][key] || key;
    const styles = createStyles(darkMode, isRTL);
    
    if (isLoading) { return (<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 400 }}><ActivityIndicator size="large" color={darkMode ? '#4CAF50' : '#388e3c'} /></View>); }
    if (history.length === 0) { return (<View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}><Text style={styles.loadingText}>No weight history yet.</Text><Text style={styles.loadingText}>Tap the '+' button to add your first weight!</Text></View>); }
    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date)); 
    const currentEntry = sortedHistory[0]; 
    const startingEntry = sortedHistory[sortedHistory.length - 1]; 
    const totalChange = currentEntry.weight - startingEntry.weight; 
    const bmi = userHeight > 0 ? (currentEntry.weight / (userHeight * userHeight)).toFixed(1) : "N/A";
    const getFilteredChartHistory = () => { const sortedForChart = [...history].sort((a, b) => new Date(a.date) - new Date(b.date)); if (sortedForChart.length === 0) return []; switch (chartFilter) { case '1M': { const oneMonthAgo = new Date(); oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1); oneMonthAgo.setHours(0, 0, 0, 0); return sortedForChart.filter(entry => new Date(entry.date) >= oneMonthAgo); } case '3M': { const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3); threeMonthsAgo.setHours(0, 0, 0, 0); return sortedForChart.filter(entry => new Date(entry.date) >= threeMonthsAgo); } case 'All': return sortedForChart; case '1W': default: return sortedForChart.length > 7 ? sortedForChart.slice(-7) : sortedForChart; } };
    const chartHistory = getFilteredChartHistory();
    const chartData = { labels: chartHistory.map(entry => `${new Date(entry.date).getDate()}/${new Date(entry.date).getMonth() + 1}`), datasets: [{ data: chartHistory.map(entry => entry.weight), color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, strokeWidth: 2, }], };
    const getChartConfig = (isDark) => ({ backgroundColor: isDark ? '#1e1e1e' : '#ffffff', backgroundGradientFrom: isDark ? '#1e1e1e' : '#ffffff', backgroundGradientTo: isDark ? '#1e1e1e' : '#ffffff', decimalPlaces: 1, color: (opacity = 1) => isDark ? `rgba(230, 230, 230, ${opacity})` : `rgba(0, 0, 0, ${opacity})`, labelColor: (opacity = 1) => isDark ? `rgba(200, 200, 200, ${opacity})` : `rgba(100, 100, 100, ${opacity})`, style: { borderRadius: 16 }, propsForDots: { r: '6', strokeWidth: '2', stroke: '#4CAF50' }, });
    const chartConfig = getChartConfig(darkMode);
    const dynamicStyles = { textAlign: { textAlign: isRTL ? 'right' : 'left' }, row: { flexDirection: isRTL ? 'row-reverse' : 'row' }, rtlText: { writingDirection: isRTL ? 'rtl' : 'ltr' } };
    
    let tooltipStyle = {}; 
    if (tooltip) { 
        const horizontalOffset = 35; 
        const verticalOffset = tooltip.y - 42; 
        tooltipStyle = { left: tooltip.x - horizontalOffset, top: verticalOffset, };
    }
    
    return ( <View> <View style={[styles.header, dynamicStyles.row]}> <Text style={styles.screenTitle}>{t('weightTracker')}</Text> <TouchableOpacity onPress={handleProfilePress} style={styles.headerIcon}> <Image source={moreIcon} style={{ width: 55, height: 55 }} /> </TouchableOpacity> </View> <TouchableOpacity activeOpacity={1} onPress={hideTooltip}> <View style={styles.card}> <Text style={[styles.cardTitle, dynamicStyles.textAlign, dynamicStyles.rtlText]}>{t('currentStatus')}</Text> <View style={[styles.currentWeightContainer, dynamicStyles.row]}> <Text style={styles.currentWeight}>{currentEntry.weight.toFixed(1)} {t('kg')}</Text> <View style={[styles.changeBadge, { backgroundColor: totalChange <= 0 ? '#4CAF50' : '#F44336' }]}> <Icon name={totalChange <= 0 ? 'arrow-down-bold' : 'arrow-up-bold'} size={14} color="#fff" /> <Text style={styles.changeText}>{Math.abs(totalChange).toFixed(1)} {t('kg')}</Text> </View> </View> <Text style={[styles.lastUpdatedText, dynamicStyles.textAlign, dynamicStyles.rtlText]}>{t('lastUpdate')} {formatDisplayDate(currentEntry.date, language)}</Text> <View style={[styles.statsRow, dynamicStyles.row]}> <View style={styles.statItem}><Text style={styles.statLabel}>{t('starting')}</Text><Text style={styles.statValue}>{startingEntry.weight.toFixed(1)} {t('kg')}</Text></View> <View style={styles.statItem}><Text style={styles.statLabel}>{t('goal')}</Text><Text style={styles.statValue}>{goalWeight.toFixed(1)} {t('kg')}</Text></View> <View style={styles.statItem}><Text style={styles.statLabel}>{t('bmi')}</Text><Text style={styles.statValue}>{bmi}</Text></View> </View> </View> </TouchableOpacity> <View style={styles.card}> <Text style={[styles.cardTitle, dynamicStyles.textAlign, dynamicStyles.rtlText]}>{t('progressChart')}</Text> <View style={styles.filterContainer}> {['1W', '1M', '3M', 'All'].map(filter => ( <TouchableOpacity key={filter} style={[styles.filterButton, chartFilter === filter && styles.activeFilterButton]} onPress={() => setChartFilter(filter)}> <Text style={[styles.filterButtonText, chartFilter === filter && styles.activeFilterButtonText]}>{filter}</Text> </TouchableOpacity> ))} </View> <View style={styles.chartContainer}> { chartHistory.length > 1 ? ( <LineChart data={chartData} width={Dimensions.get('window').width - 64} height={220} chartConfig={chartConfig} bezier withShadow style={{ marginVertical: 8, borderRadius: 16 }} segments={5} onDataPointClick={({ value, x, y, index }) => { if (tooltip && tooltip.index === index) { hideTooltip(); } else { setTooltip({ x, y, value, index }); } }} /> ) : ( <View style={{height: 220, justifyContent: 'center', alignItems: 'center'}}> <Text style={{color: darkMode ? '#999' : '#777'}}>Not enough data to draw a chart for this period.</Text> </View> )} 
        {tooltip && ( <View style={[styles.tooltipWrapper, tooltipStyle]}> <View style={styles.tooltipContainer}><Text style={styles.tooltipValueText}>{tooltip.value.toFixed(1)}</Text><Text style={styles.tooltipUnitText}>{t('kg')}</Text></View> <View style={styles.tooltipArrow} /> </View> )} 
        </View> </View> <TouchableOpacity activeOpacity={1} onPress={hideTooltip}> <View style={styles.card}> <Text style={[styles.cardTitle, dynamicStyles.textAlign, dynamicStyles.rtlText]}>{t('history')}</Text> {sortedHistory.map((entry, index) => { const prev = sortedHistory[index + 1]; const change = prev ? entry.weight - prev.weight : 0; return ( <View key={entry.date} style={[styles.historyItem, dynamicStyles.row, index === sortedHistory.length - 1 && { borderBottomWidth: 0 }]}><View style={{flex: 1}}><Text style={[styles.historyDate, dynamicStyles.textAlign, dynamicStyles.rtlText]}>{formatDisplayDate(entry.date, language)}</Text><Text style={[styles.historyWeight, dynamicStyles.textAlign]}>{entry.weight.toFixed(1)} {t('kg')}</Text></View>{prev && <Text style={{color: change <= 0 ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>{change > 0 ? '+' : ''}{change.toFixed(1)} {t('kg')}</Text>}</View> ); })} </View> </TouchableOpacity> <View style={styles.tipCard}> <Text style={[styles.tipLabel, dynamicStyles.rtlText]}>{t('dailyTip')}</Text> <Text style={[styles.tipText, dynamicStyles.rtlText]}>{dailyTip}</Text> </View> </View> );
  };
  
    const handleNavigationRequest = (screenName, params = {}) => {
        const activityScreens = ['steps', 'distance', 'calories', 'activeTime'];
        if (activityScreens.includes(screenName)) { setCurrentScreen(screenName); } else { navigation.navigate(screenName, params); }
    };
    
    const handleNavigateToAchievements = (pedometerSteps) => {
        setLiveStepsForAchievements(pedometerSteps); navigation.navigate('Achievements');
    };
    
    const renderFoodScreen = () => <FoodLogScreen navigation={navigation} language={language} darkMode={darkMode} />;
    const renderWaterScreen = () => <WaterTrackingScreen navigation={navigation} language={language} isDarkMode={darkMode} />;
    const renderReportsScreen = () => <ReportsScreen navigation={navigation} language={language} isDarkMode={darkMode} />;
    const renderDistanceScreen = () => <DistanceScreen navigation={navigation} onNavigate={handleNavigationRequest} currentScreenName={currentScreen} language={language} isDarkMode={darkMode} onNavigateToAchievements={handleNavigateToAchievements}/>;
    const renderCaloriesScreen = () => <CaloriesScreen navigation={navigation} onNavigate={handleNavigationRequest} currentScreenName={currentScreen} language={language} isDarkMode={darkMode} onNavigateToAchievements={handleNavigateToAchievements}/>;
    const renderActiveTimeScreen = () => <ActiveTimeScreen navigation={navigation} onNavigate={handleNavigationRequest} currentScreenName={currentScreen} language={language} isDarkMode={darkMode} onNavigateToAchievements={handleNavigateToAchievements}/>;
    const renderStepsScreen = () => <StepsScreen navigation={navigation} onNavigate={handleNavigationRequest} currentScreenName={currentScreen} language={language} isDarkMode={darkMode} onNavigateToAchievements={handleNavigateToAchievements}/>;

    const renderCurrentScreenComponent = () => {
        switch (currentScreen) {
            case 'weight': return renderWeightTrackerScreen();
            case 'food': return renderFoodScreen();
            case 'water': return renderWaterScreen();
            case 'steps': return renderStepsScreen();
            case 'reports': return renderReportsScreen();
            case 'distance': return renderDistanceScreen();
            case 'calories': return renderCaloriesScreen();
            case 'activeTime': return renderActiveTimeScreen();
            default: return renderWeightTrackerScreen();
        }
    };
    
    const renderNavBar = () => {
        const t = (key) => translations[language][key] || key;
        const styles = createStyles(darkMode, language === 'ar');
        const navItems = [
            { key: 'weight', iconSource: weightNavIcon, label: t('weightNavLabel') },
            { key: 'food', iconSource: foodNavIcon, label: t('foodNavLabel') },
            { key: 'water', iconSource: waterNavIcon, label: t('waterNavLabel') },
            { key: 'steps', iconSource: stepsNavIcon, label: t('stepsNavLabel') },
            { key: 'reports', iconSource: reportsNavIcon, label: t('reportsNavLabel') },
        ];
        const stepsRelatedScreens = ['steps', 'distance', 'calories', 'activeTime'];
        return (
            <View style={styles.navBar}>
                {navItems.map((item) => {
                    const isActive = item.key === 'steps' ? stepsRelatedScreens.includes(currentScreen) : currentScreen === item.key;
                    const iconTintColor = isActive ? (darkMode ? '#00afa0' : '#388e3c') : (darkMode ? '#777' : '#adb5bd');
                    const targetScreen = item.key === 'steps' ? 'steps' : item.key;
                    return (
                        <TouchableOpacity key={item.key} style={styles.navItem} onPress={() => setCurrentScreen(targetScreen)}>
                            <Image source={item.iconSource} style={[styles.navIconImage, { tintColor: iconTintColor }]} resizeMode="contain" />
                            <Text style={[styles.navText, isActive && styles.activeNavText]}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const renderScreenContent = () => {
        const isRTL = language === 'ar';
        const t = (key) => translations[language][key] || key;
        const styles = createStyles(darkMode, isRTL);
        const greenBackgroundScreens = ['food', 'water', 'steps', 'reports', 'distance', 'calories', 'activeTime'];
        const safeAreaStyle = [ styles.safeArea, greenBackgroundScreens.includes(currentScreen) && { backgroundColor: darkMode ? '#141914' : '#f0f8f0' } ];

        return (
            <SafeAreaView style={safeAreaStyle}>
                <ScrollView 
                  contentContainerStyle={styles.container} 
                  onScrollBeginDrag={hideTooltip} 
                  keyboardShouldPersistTaps="handled"
                  key={darkMode ? 'dark' : 'light'}
                >
                    {renderCurrentScreenComponent()}
                </ScrollView>

                {currentScreen === 'weight' && (
                    <TouchableOpacity style={[styles.fab, isRTL ? { left: 20 } : { right: 20 }]} onPress={() => setModalVisible(true)}>
                        <Icon name="plus" size={30} color="#fff" />
                    </TouchableOpacity>
                )}

                <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalCenteredView}>
                        <View style={styles.modalView}>
                            <Text style={[styles.modalTitle, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('logYourWeight')}</Text>
                            <TextInput style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]} onChangeText={setNewWeight} value={newWeight} placeholder={t('weightPlaceholder')} keyboardType="decimal-pad" autoFocus={true} placeholderTextColor={darkMode ? '#999' : '#ccc'} />
                            <View style={[styles.modalButtons, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}><Text style={styles.buttonText}>{t('cancel')}</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleAddWeight}><Text style={styles.buttonText}>{t('save')}</Text></TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
                
                {/* ---===[ بداية الإضافة (3/4): وضع مكون البانر الإعلاني هنا ]===--- */}
                <View style={styles.adBannerContainer}>
                    <BannerAd
                        unitId={adUnitId}
                        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                        requestOptions={{
                            requestNonPersonalizedAdsOnly: true, // مهم للالتزام بسياسات الخصوصية
                        }}
                        onAdFailedToLoad={(error) => {
                            console.error('AdMob Banner Ad failed to load: ', error);
                        }}
                    />
                </View>
                {/* ---===[ نهاية الإضافة (3/4) ]===--- */}
                
                {renderNavBar()}
            </SafeAreaView>
        );
    };

  return renderScreenContent();
};

const createStyles = (isDark, isRTL) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#121212' : '#f4f6f8' },
    container: { padding: 16, paddingBottom: 100 }, // الـ paddingBottom يمنع المحتوى من الاختفاء خلف الإعلان وشريط التنقل
    header: { alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative' },
    screenTitle: { textAlign: 'center', fontSize: 28, fontWeight: 'bold', color: isDark ? '#e0e0e0' : '#2c3e50' },
    headerIcon: { position: 'absolute', [isRTL ? 'left' : 'right']: 0, padding: 5, },
    iconColor: { color: isDark ? '#e0e0e0' : '#2c3e50' },
    loadingText: { fontSize: 16, color: isDark ? '#aaa' : '#555', textAlign: 'center', lineHeight: 24, marginBottom: 8 },
    card: { backgroundColor: isDark ? '#1e1e1e' : '#fff', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 3, shadowColor: isDark ? '#000' : '#555', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.7 : 0.1, shadowRadius: 4 },
    cardTitle: { fontSize: 18, fontWeight: '600', color: isDark ? '#f0f0f0' : '#34495e', marginBottom: 15 },
    currentWeightContainer: { alignItems: 'flex-end', marginBottom: 4, justifyContent: 'space-between', flexDirection: 'row' },
    currentWeight: { fontSize: 48, fontWeight: 'bold', color: '#4CAF50', lineHeight: 50 },
    changeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginBottom: 5 },
    changeText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginLeft: 4, marginRight: 4 },
    lastUpdatedText: { fontSize: 13, color: isDark ? '#95a5a6' : '#7f8c8d', marginBottom: 20 },
    statsRow: { justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: isDark ? '#333' : '#ecf0f1', paddingTop: 15, flexDirection: 'row' },
    statItem: { alignItems: 'center', flex:1 },
    statLabel: { fontSize: 14, color: isDark ? '#b0b0b0' : '#95a5a6' },
    statValue: { fontSize: 16, fontWeight: 'bold', color: isDark ? '#e0e0e0' : '#2c3e50', marginTop: 4 },
    historyItem: { justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#f0f0f0', flexDirection: 'row'},
    historyDate: { fontSize: 15, color: isDark ? '#f0f0f0' : '#34495e' },
    historyWeight: { fontSize: 16, fontWeight: 'bold', color: isDark ? '#e0e0e0' : '#2c3e50', marginTop: 2 },
    fab: { position: 'absolute', bottom: 100, width: 60, height: 60, borderRadius: 30, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', elevation: 8 },
    modalCenteredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalView: { width: '85%', margin: 20, backgroundColor: isDark ? '#2c3e50' : 'white', borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: isDark ? '#ffffff' : '#333' },
    input: { height: 50, borderColor: isDark ? '#4a6572' : '#bdc3c7', borderWidth: 1, borderRadius: 10, marginBottom: 25, width: '100%', paddingHorizontal: 15, fontSize: 18, color: isDark ? '#ffffff' : '#000', backgroundColor: isDark ? '#1e2a33' : '#fff' },
    modalButtons: { justifyContent: 'space-between', width: '100%', flexDirection: 'row' },
    button: { flex: 1, paddingVertical: 12, borderRadius: 10, marginHorizontal: 5, alignItems: 'center' },
    cancelButton: { backgroundColor: '#95a5a6' },
    saveButton: { backgroundColor: '#4CAF50' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    tipCard: { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.08)', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)' },
    tipLabel: { fontSize: 18, fontWeight: '600', color: isDark ? '#a5d6a7' : '#2e7d32', marginBottom: 8 },
    tipText: { fontSize: 15, fontStyle: 'italic', textAlign: 'center', lineHeight: 22, color: isDark ? '#cfd8dc' : '#37474f' },
    chartContainer: { position: 'relative' },
    tooltipWrapper: { position: 'absolute', alignItems: 'center', zIndex: 10 },
    tooltipContainer: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: 'black', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, elevation: 5 },
    tooltipValueText: { color: 'white', fontWeight: 'bold', fontSize: 15, },
    tooltipUnitText: { color: 'white', fontWeight: 'normal', fontSize: 14, marginLeft: 4, },
    tooltipArrow: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: 'black' },
    navBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 80, paddingBottom: Platform.OS === 'ios' ? 34 : 10, borderTopWidth: 1, elevation: 12, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, backgroundColor: isDark ? '#1e1e1e' : '#ffffff', borderTopColor: isDark ? '#2c2c2c' : '#e9ecef', shadowColor: isDark ? '#000' : '#b0b0b0', },
    navItem: { alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%', paddingTop: 5, },
    navIconImage: { width: 70, height: 70, marginBottom: -10, },
    navText: { fontSize: 11, fontWeight: '500', textAlign: 'center', color: isDark ? '#777' : '#adb5bd', },
    activeNavText: { fontWeight: 'bold', color: isDark ? '#00afa0' : '#388e3c', },
    filterContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10, backgroundColor: isDark ? '#2c3e50' : '#ecf0f1', borderRadius: 8, padding: 4, },
    filterButton: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginHorizontal: 2, },
    activeFilterButton: { backgroundColor: isDark ? '#4CAF50' : '#ffffff', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, },
    filterButtonText: { fontWeight: 'bold', color: isDark ? '#bdc3c7' : '#7f8c8d', fontSize: 14, },
    activeFilterButtonText: { color: isDark ? '#ffffff' : '#4CAF50', },

    // ---===[ بداية الإضافة (4/4): إضافة الأنماط الخاصة بحاوية الإعلان ]===---
    adBannerContainer: {
        position: 'absolute',
        bottom: 80, // ارتفاع شريط التنقل للسماح بظهوره أسفل الإعلان
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10, // للتأكد من أنه فوق المحتوى
    },
    // ---===[ نهاية الإضافة (4/4) ]===---

});

export default WeightTracker;
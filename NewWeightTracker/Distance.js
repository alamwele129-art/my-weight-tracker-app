import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Modal, I18nManager, AppState, Pressable, Animated, ActivityIndicator, useColorScheme, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Svg, Circle, Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Picker from 'react-native-wheel-picker-expo';
import { Pedometer } from 'expo-sensors';

// --- استيراد مكونات الأسبوع والشهر من ملفاتها الخاصة ---
import WeeklyDistance from './WeeklyDistance'; 
import MonthlyDistance from './monthlydistance';


// --- الثوابت ---
const { width } = Dimensions.get('window');
const circleSize = width * 0.7;
const strokeWidth = 25;
const radius = (circleSize - strokeWidth) / 2;
const MENU_VERTICAL_OFFSET = 5;
const CHALLENGE_DURATIONS = [7, 14, 30];
const INITIAL_CHALLENGE_DURATION = CHALLENGE_DURATIONS[0];
const BADGE_CONTAINER_SIZE = 60; const BADGE_SVG_SIZE = BADGE_CONTAINER_SIZE; const BADGE_CIRCLE_BORDER_WIDTH = 5; const BADGE_PATH_RADIUS = (BADGE_SVG_SIZE / 2) - (BADGE_CIRCLE_BORDER_WIDTH / 2); const BADGE_CENTER_X = BADGE_SVG_SIZE / 2; const BADGE_CENTER_Y = BADGE_SVG_SIZE / 2;
const CHART_HEIGHT = 200; const ICON_SIZE = 20; const CALORIES_PER_STEP = 0.04; const STEP_LENGTH_METERS = 0.762; const STEPS_PER_MINUTE = 100;

// --- مفاتيح AsyncStorage ---
const LAST_PARTICIPATION_DATE_KEY = '@StepsChallenge:lastParticipationDate';
const REMAINING_CHALLENGE_DAYS_KEY = '@StepsChallenge:remainingDays';
const CURRENT_CHALLENGE_DURATION_KEY = '@StepsChallenge:currentDuration';
const DAILY_DISTANCE_HISTORY_KEY = '@DistanceScreen:DailyHistory';
const APP_LANGUAGE_KEY = '@App:language';
const APP_DARK_MODE_KEY = '@App:darkMode';

// --- كائن الترجمة ---
const translations = {
    ar: {
        headerTitle: 'المسافة', today: 'اليوم', week: 'أسبوع', month: 'الشهر', yesterday: 'أمس', goalPrefix: 'الهدف', kmUnit: 'كم', miUnit: 'ميل',
        caloriesLabel: 'كيلوكالوري', timeLabel: 'ساعات', stepsLabel: 'خطوة',
        challengePrefix: 'أيام تحدي', challengeCompleted: 'اكتمل التحدي!', challengeRemainingSingular: 'يوم متبقي', challengeRemainingPlural: 'أيام متبقية', challengeDaySuffix: 'ي',
        goalModalTitle: 'هدف المسافه', save: 'حفظ', cancel: 'إلغاء',
        weeklyChartTitle: 'إحصائيات الأسبوع (كم)', testButton: 'اختبار (+0.5 كم)', resetButton: 'إعادة',
        menuSteps: 'الخطوات', menuDistance: 'المسافة', menuCalories: 'السعرات', menuActiveTime: 'الوقت النشط',
        dayNamesShort: ['س', 'أ', 'ن', 'ث', 'ر', 'خ', 'ج'],
    },
    en: {
        headerTitle: 'Distance', today: 'Today', week: 'Week', month: 'Month', yesterday: 'Yesterday', goalPrefix: 'Goal', kmUnit: 'km', miUnit: 'mi',
        caloriesLabel: 'Kcal', timeLabel: 'Hours', stepsLabel: 'Steps',
        challengePrefix: 'Day Challenge', challengeCompleted: 'Challenge Completed!', challengeRemainingSingular: 'day remaining', challengeRemainingPlural: 'days remaining', challengeDaySuffix: 'd',
        goalModalTitle: 'Distance Goal', save: 'Save', cancel: 'Cancel',
        weeklyChartTitle: 'Weekly Stats (km)', testButton: 'Test (+0.5 km)', resetButton: 'Reset',
        menuSteps: 'Steps', menuDistance: 'Distance', menuCalories: 'Calories', menuActiveTime: 'Active Time',
        dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    }
};

// --- الدوال المساعدة ---
const describeArc = (x, y, r, startAngleDeg, endAngleDeg) => { const clampedEndAngle = Math.min(endAngleDeg, 359.999); const startAngleRad = ((startAngleDeg - 90) * Math.PI) / 180.0; const endAngleRad = ((clampedEndAngle - 90) * Math.PI) / 180.0; const startX = x + r * Math.cos(startAngleRad); const startY = y + r * Math.sin(startAngleRad); const endX = x + r * Math.cos(endAngleRad); const endY = y + r * Math.sin(endAngleRad); const largeArcFlag = clampedEndAngle - startAngleDeg <= 180 ? '0' : '1'; const sweepFlag = '1'; const d = [ 'M', startX, startY, 'A', r, r, 0, largeArcFlag, sweepFlag, endX, endY ].join(' '); return d; };
const getDateString = (date) => { if (!date || !(date instanceof Date)) return null; return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10); };
const calculateIconPositionOnPath = (angleDegrees) => { const angleRad = (angleDegrees - 90) * (Math.PI / 180); const iconRadius = radius; const xOffset = iconRadius * Math.cos(angleRad); const yOffset = iconRadius * Math.sin(angleRad); const iconCenterX = (circleSize / 2) + xOffset; const iconCenterY = (circleSize / 2) + yOffset; const top = iconCenterY - (ICON_SIZE / 2); const left = iconCenterX - (ICON_SIZE / 2); return { position: 'absolute', top, left }; };
const isToday = (someDate) => { const today = new Date(); return someDate.getUTCFullYear() === today.getUTCFullYear() && someDate.getUTCMonth() === today.getUTCMonth() && someDate.getUTCDate() === today.getUTCDate(); };
const isYesterday = (someDate) => { const today = new Date(); const yesterday = new Date(today); yesterday.setUTCDate(yesterday.getUTCDate() - 1); return someDate.getUTCFullYear() === yesterday.getUTCFullYear() && someDate.getUTCMonth() === yesterday.getUTCMonth() && someDate.getUTCDate() === yesterday.getUTCDate(); };
const getStartOfWeek = (date, startOfWeekDay) => { const d = new Date(date); d.setUTCHours(0, 0, 0, 0); const currentUTCDate = d.getUTCDate(); const currentUTCDay = d.getUTCDay(); let diff = currentUTCDay - startOfWeekDay; if (diff < 0) diff += 7; d.setUTCDate(currentUTCDate - diff); return d; };
const getEndOfWeek = (date, startOfWeekDay) => { const start = getStartOfWeek(date, startOfWeekDay); const end = new Date(start); end.setUTCDate(start.getUTCDate() + 6); end.setUTCHours(23, 59, 59, 999); return end; };
const addDays = (date, days) => { const result = new Date(date); result.setUTCDate(result.getUTCDate() + days); return result; };
const isSameWeek = (date1, date2, startOfWeekDay) => { if (!date1 || !date2) return false; const start1 = getStartOfWeek(date1, startOfWeekDay); const start2 = getStartOfWeek(date2, startOfWeekDay); return start1.getTime() === start2.getTime(); };
const getStartOfMonth = (date) => { const d = new Date(date); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(1); return d; };
const addMonths = (date, months) => { const d = new Date(date); d.setUTCMonth(d.getUTCMonth() + months); return d; };
const formatDateRange = (startDate, endDate, lang) => { const locale = lang === 'ar' ? 'ar-EG-u-ca-gregory-nu-arab' : 'en-US-u-ca-gregory'; const optionsDayMonth = { day: 'numeric', month: 'long', timeZone: 'UTC' }; const optionsDay = { day: 'numeric', timeZone: 'UTC' }; if (startDate.getUTCMonth() === endDate.getUTCMonth()) { const monthName = endDate.toLocaleDateString(locale, { month: 'long', timeZone: 'UTC' }); return `${startDate.toLocaleDateString(locale, optionsDay)} - ${endDate.toLocaleDateString(locale, optionsDay)} ${monthName}`; } else { return `${startDate.toLocaleDateString(locale, optionsDayMonth)} - ${endDate.toLocaleDateString(locale, optionsDayMonth)}`; } };
const getDaysInMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
// --- نهاية الدوال المساعدة ---

// --- المكونات الفرعية ---
const GoalModal = ({ visible, onClose, onSave, currentValue, currentUnit, translation, styles }) => { const [tempValue, setTempValue] = useState(currentValue); const [tempUnit, setTempUnit] = useState(currentUnit); const distanceValues = Array.from({ length: 120 }, (_, i) => ((i + 1) * 0.5).toFixed(1)); const unitValues = [translation.kmUnit, translation.miUnit]; useEffect(() => { if (visible) { setTempValue(currentValue); setTempUnit(currentUnit); } }, [visible, currentValue, currentUnit]); const handleSave = () => { onSave(tempValue, tempUnit); }; return ( <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}><View style={styles.modalOverlay}><View style={styles.modalCard}><Text style={styles.modalTitle}>{translation.goalModalTitle}</Text><View style={styles.pickersContainer}><Picker height={180} initialSelectedIndex={distanceValues.indexOf(tempValue.toFixed(1))} items={distanceValues.map(val => ({ label: val, value: val }))} onChange={({ item }) => setTempValue(parseFloat(item.value))} renderItem={(item, i, isSelected) => ( <Text style={isSelected ? styles.selectedPickerItemText : styles.pickerItemText}>{item.label}</Text> )} haptics /><Picker height={180} width={120} initialSelectedIndex={unitValues.indexOf(tempUnit)} items={unitValues.map(val => ({ label: val, value: val }))} onChange={({ item }) => setTempUnit(item.value)} renderItem={(item, i, isSelected) => ( <Text style={isSelected ? styles.selectedPickerItemText : styles.pickerItemText}>{item.label}</Text> )} haptics /></View><View style={styles.buttonRow}><TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={onClose}><Text style={styles.cancelButtonText}>{translation.cancel}</Text></TouchableOpacity><TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}><Text style={styles.saveButtonText}>{translation.save}</Text></TouchableOpacity></View></View></View></Modal> ); };
const AnimatedStatCard = ({ iconName, value, label, formatter, styles }) => { const animatedValue = useRef(new Animated.Value(value || 0)).current; const [displayValue, setDisplayValue] = useState(() => formatter(value || 0)); useEffect(() => { Animated.timing(animatedValue, { toValue: value || 0, duration: 750, useNativeDriver: false }).start(); }, [value]); useEffect(() => { const listenerId = animatedValue.addListener((v) => { setDisplayValue(formatter(v.value)); }); return () => { animatedValue.removeListener(listenerId); }; }, [formatter, animatedValue]); return ( <View style={styles.statCard}><View style={styles.iconContainer}><Icon name={iconName} size={24} color={styles.animatedStatIcon.color} /></View><Text style={styles.statValue}>{displayValue}</Text><Text style={styles.statLabel}>{label}</Text></View> ); };
const ChallengeCard = ({ onPress, currentChallengeDuration, remainingDays, translation, styles }) => { const daysCompleted = currentChallengeDuration - remainingDays; const badgeProgressAngle = remainingDays <= 0 || currentChallengeDuration <= 0 ? 359.999 : remainingDays >= currentChallengeDuration ? 0 : (daysCompleted / currentChallengeDuration) * 360; const badgeProgressPathD = describeArc(BADGE_CENTER_X, BADGE_CENTER_Y, BADGE_PATH_RADIUS, 0.01, badgeProgressAngle); const subText = remainingDays > 0 ? `${remainingDays.toLocaleString(I18nManager.isRTL ? 'ar-EG' : 'en-US')} ${remainingDays === 1 ? translation.challengeRemainingSingular : translation.challengeRemainingPlural}` : translation.challengeCompleted; const mainText = `${currentChallengeDuration.toLocaleString(I18nManager.isRTL ? 'ar-EG' : 'en-US')} ${translation.challengePrefix}`; return ( <TouchableOpacity style={styles.challengeCardWrapper} onPress={onPress} activeOpacity={0.8}><View style={styles.summaryCard}><View style={styles.badgeContainer}><Svg height={BADGE_SVG_SIZE} width={BADGE_SVG_SIZE} viewBox={`0 0 ${BADGE_SVG_SIZE} ${BADGE_SVG_SIZE}`}><Circle cx={BADGE_CENTER_X} cy={BADGE_CENTER_Y} r={BADGE_PATH_RADIUS} stroke={styles.badgeBackgroundCircle.stroke} strokeWidth={BADGE_CIRCLE_BORDER_WIDTH} fill="none" /><Path d={badgeProgressPathD} stroke={styles.badgeProgressCircle.stroke} strokeWidth={BADGE_CIRCLE_BORDER_WIDTH} fill="none" strokeLinecap="round" /></Svg><View style={styles.badgeTextContainer}><Text style={styles.badgeText}>{remainingDays > 0 ? `${remainingDays.toLocaleString(I18nManager.isRTL ? 'ar-EG' : 'en-US')}${translation.challengeDaySuffix}` : '✓'}</Text></View></View><View style={styles.summaryTextContainer}><Text style={styles.summaryMainText}>{mainText}</Text><Text style={styles.summarySubText}>{subText}</Text></View><Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={24} color={styles.summaryChevron.color} /></View></TouchableOpacity> ); };
const DistanceWeeklyChart = ({ weeklyDistanceData, goalDistance, onTestIncrement, onResetData, translation, styles, language }) => { const [tooltipVisible, setTooltipVisible] = useState(false); const [selectedBarIndex, setSelectedBarIndex] = useState(null); const [selectedBarValue, setSelectedBarValue] = useState(null); const days = translation.dayNamesShort; const today = new Date(); const startOfWeekDay = language === 'ar' ? 6 : 0; const jsDayIndex = today.getDay(); const displayDayIndex = (jsDayIndex - startOfWeekDay + 7) % 7; const { yAxisMax, yAxisLabels } = useMemo(() => { const dataMax = Math.max(...weeklyDistanceData, goalDistance, 1); const roundedMax = Math.ceil(dataMax); const labels = [0, roundedMax * 0.25, roundedMax * 0.5, roundedMax * 0.75, roundedMax].map(v => parseFloat(v.toFixed(1))); return { yAxisMax: roundedMax, yAxisLabels: [...new Set(labels)].sort((a,b) => b-a) }; }, [weeklyDistanceData, goalDistance]); const handleBarPress = useCallback((index, value) => { const numericValue = value || 0; if (tooltipVisible && selectedBarIndex === index) { setTooltipVisible(false); } else if (numericValue > 0) { setTooltipVisible(true); setSelectedBarIndex(index); setSelectedBarValue(numericValue); } else { setTooltipVisible(false); } }, [tooltipVisible, selectedBarIndex]); const handleOutsidePress = useCallback(() => { if (tooltipVisible) { setTooltipVisible(false); } }, [tooltipVisible]); return ( <Pressable style={styles.card} onPress={handleOutsidePress}><View style={styles.chartHeader}><Text style={styles.chartTitle}>{translation.weeklyChartTitle}</Text></View><View style={styles.testButtonsContainer}><TouchableOpacity onPress={onTestIncrement} style={styles.testButton}><Text style={styles.testButtonText}>{translation.testButton}</Text></TouchableOpacity><TouchableOpacity onPress={onResetData} style={styles.testButton}><Text style={styles.testButtonText}>{translation.resetButton}</Text></TouchableOpacity></View><View style={styles.chartAreaContainer}><View style={styles.yAxisLabels}>{yAxisLabels.map(label => <Text key={label} style={styles.axisLabelY}>{label}</Text>)}</View><View style={styles.chartContent}><View style={styles.barsAndLabelsContainer}>{days.map((dayName, index) => { const value = weeklyDistanceData[index] || 0; const barHeight = yAxisMax > 0 ? Math.min(CHART_HEIGHT, (value / yAxisMax) * CHART_HEIGHT) : 0; const isCurrentDay = index === displayDayIndex; const isSelected = selectedBarIndex === index; return ( <View key={index} style={styles.barColumn}>{tooltipVisible && isSelected && selectedBarValue !== null && ( <View style={[styles.tooltipPositioner, { bottom: barHeight + 30 }]}><View style={styles.tooltipBox}><Text style={styles.tooltipText}>{selectedBarValue.toFixed(1)} {translation.kmUnit}</Text></View><View style={styles.tooltipArrow} /></View> )}<Pressable onPress={(e) => { e.stopPropagation(); handleBarPress(index, value); }} hitSlop={10}><View style={[styles.bar, { height: barHeight }, isCurrentDay && styles.barToday, isSelected && value > 0 && styles.selectedBar, value >= goalDistance && styles.barGoalAchieved ]} /></Pressable><Text style={[styles.axisLabelX, isCurrentDay && styles.activeDayLabel]}>{dayName}</Text></View> );})}</View></View></View></Pressable> ); };
// --- نهاية المكونات الفرعية ---

// --- الشاشة الرئيسية ---
const DistanceScreen = (props) => {
  const { onNavigate, currentScreenName, onNavigateToAchievements, language: initialLanguage, isDarkMode: initialIsDarkMode } = props;
  
  const systemColorScheme = useColorScheme();
  const [language, setLanguage] = useState(initialLanguage || (I18nManager.isRTL ? 'ar' : 'en'));
  const [isDarkMode, setIsDarkMode] = useState(initialIsDarkMode === undefined ? systemColorScheme === 'dark' : initialIsDarkMode);
  
  const translation = useMemo(() => translations[language] || translations.ar, [language]);
  const currentStyles = useMemo(() => isDarkMode ? darkStyles : lightStyles, [isDarkMode]);
  const startOfWeekDay = useMemo(() => language === 'ar' ? 6 : 0, [language]);

  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const periods = useMemo(() => [translation.today, translation.week, translation.month], [translation]);
  
  const [actualDistance, setActualDistance] = useState(0.00);
  const [isModalVisible, setModalVisible] = useState(false);
  const [goalDistance, setGoalDistance] = useState(3.0);
  const [goalUnit, setGoalUnit] = useState(translation.kmUnit);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const animatedAngle = useRef(new Animated.Value(0)).current;
  const [dynamicIconStyle, setDynamicIconStyle] = useState(() => calculateIconPositionOnPath(0));
  const [progressPathD, setProgressPathD] = useState('');
  const pedometerSubscription = useRef(null);
  const animatedDistance = useRef(new Animated.Value(0)).current;
  const [displayDistanceText, setDisplayDistanceText] = useState(language === 'ar' ? '٠٫٠٠' : '0.00');
  const [dailyChartData, setDailyChartData] = useState(Array(7).fill(0));
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getStartOfWeek(new Date(), startOfWeekDay));
  const [weeklyData, setWeeklyData] = useState(Array(7).fill(0));
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);
  const [isCurrentWeek, setIsCurrentWeek] = useState(true);
  const [selectedMonthStart, setSelectedMonthStart] = useState(() => getStartOfMonth(new Date()));
  const [monthlyData, setMonthlyData] = useState([]);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);
  const [isTitleMenuVisible, setIsTitleMenuVisible] = useState(false);
  const [titleMenuPosition, setTitleMenuPosition] = useState({ top: 0, left: undefined, right: undefined });
  const titleMenuTriggerRef = useRef(null);
  const [currentChallengeDuration, setCurrentChallengeDuration] = useState(INITIAL_CHALLENGE_DURATION);
  const [remainingDays, setRemainingDays] = useState(INITIAL_CHALLENGE_DURATION);
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => { const loadAppPreferences = async () => { /* ... */ }; if (initialLanguage === undefined || initialIsDarkMode === undefined) { loadAppPreferences(); } }, []);

  const saveDistanceForDate = useCallback(async (date, distance) => { const dateString = getDateString(date); if (!dateString) return; try { const storedHistory = await AsyncStorage.getItem(DAILY_DISTANCE_HISTORY_KEY); let history = storedHistory ? JSON.parse(storedHistory) : {}; history[dateString] = Math.max(0, distance); await AsyncStorage.setItem(DAILY_DISTANCE_HISTORY_KEY, JSON.stringify(history)); } catch (e) { console.error("Failed to save distance to history:", e); } }, []);
  const getStoredDistanceHistory = useCallback(async () => { try { const storedHistory = await AsyncStorage.getItem(DAILY_DISTANCE_HISTORY_KEY); return storedHistory ? JSON.parse(storedHistory) : {}; } catch (e) { console.error("Failed to get distance history:", e); return {}; } }, []);
  const updateChallengeStatus = useCallback(async () => { const todayString = getDateString(new Date()); if (!todayString) return; try { const [storedRemainingDaysStr, storedLastParticipationDate, storedChallengeDurationStr] = await Promise.all([AsyncStorage.getItem(REMAINING_CHALLENGE_DAYS_KEY), AsyncStorage.getItem(LAST_PARTICIPATION_DATE_KEY), AsyncStorage.getItem(CURRENT_CHALLENGE_DURATION_KEY)]); let loadedDuration = INITIAL_CHALLENGE_DURATION; if (storedChallengeDurationStr !== null) { const parsedDuration = parseInt(storedChallengeDurationStr, 10); if (!isNaN(parsedDuration) && CHALLENGE_DURATIONS.includes(parsedDuration)) loadedDuration = parsedDuration; } setCurrentChallengeDuration(loadedDuration); let currentRemainingDays = loadedDuration; if (storedRemainingDaysStr !== null) { const parsedDays = parseInt(storedRemainingDaysStr, 10); if (!isNaN(parsedDays) && parsedDays >= 0 && parsedDays <= loadedDuration) currentRemainingDays = parsedDays; } setRemainingDays(currentRemainingDays); if (todayString !== storedLastParticipationDate && currentRemainingDays > 0) { const newRemainingDays = currentRemainingDays - 1; if (newRemainingDays <= 0) { const currentDurationIndex = CHALLENGE_DURATIONS.indexOf(loadedDuration); const nextDurationIndex = currentDurationIndex + 1; if (nextDurationIndex < CHALLENGE_DURATIONS.length) { const nextChallengeDuration = CHALLENGE_DURATIONS[nextDurationIndex]; setRemainingDays(nextChallengeDuration); setCurrentChallengeDuration(nextChallengeDuration); await AsyncStorage.multiSet([[REMAINING_CHALLENGE_DAYS_KEY, String(nextChallengeDuration)], [LAST_PARTICIPATION_DATE_KEY, todayString], [CURRENT_CHALLENGE_DURATION_KEY, String(nextChallengeDuration)]]); } else { setRemainingDays(0); await AsyncStorage.multiSet([[REMAINING_CHALLENGE_DAYS_KEY, '0'], [LAST_PARTICIPATION_DATE_KEY, todayString]]); } } else { setRemainingDays(newRemainingDays); await AsyncStorage.multiSet([[REMAINING_CHALLENGE_DAYS_KEY, String(newRemainingDays)], [LAST_PARTICIPATION_DATE_KEY, todayString]]); } } else if (currentRemainingDays <= 0 && remainingDays !== 0) { setRemainingDays(0); } } catch (error) { console.error("Challenge update fail:", error); } }, []);
  useEffect(() => { const loadInitialData = async () => { if (selectedPeriod === 'day') { if (isToday(currentDate)) { const history = await getStoredDistanceHistory(); const todayStr = getDateString(new Date()); const savedTodayDistance = history[todayStr] || 0; setActualDistance(savedTodayDistance); } else { const history = await getStoredDistanceHistory(); const dateStr = getDateString(currentDate); setActualDistance(history[dateStr] || 0); } } }; loadInitialData(); }, [currentDate, selectedPeriod, getStoredDistanceHistory]);
  useEffect(() => { if (selectedPeriod === 'week') { setIsWeeklyLoading(true); const fetchWeeklyData = async () => { const history = await getStoredDistanceHistory(); const currentIsSameWeek = isSameWeek(selectedWeekStart, new Date(), startOfWeekDay); setIsCurrentWeek(currentIsSameWeek); const data = Array(7).fill(0); for (let i = 0; i < 7; i++) { const dayDate = addDays(selectedWeekStart, i); if (currentIsSameWeek && isToday(dayDate)) { data[i] = actualDistance; } else { data[i] = history[getDateString(dayDate)] || 0; } } setWeeklyData(data); setIsWeeklyLoading(false); }; fetchWeeklyData(); } }, [selectedPeriod, selectedWeekStart, actualDistance, startOfWeekDay, getStoredDistanceHistory]);
  useEffect(() => { if (selectedPeriod === 'month') { setIsMonthlyLoading(true); const fetchMonthlyData = async () => { const history = await getStoredDistanceHistory(); const currentIsSameMonth = selectedMonthStart.getUTCFullYear() === new Date().getFullYear() && selectedMonthStart.getUTCMonth() === new Date().getMonth(); setIsCurrentMonth(currentIsSameMonth); const daysInMonth = getDaysInMonth(selectedMonthStart); const data = Array(daysInMonth).fill(0); for (let i = 0; i < daysInMonth; i++) { const dayDate = new Date(Date.UTC(selectedMonthStart.getUTCFullYear(), selectedMonthStart.getUTCMonth(), i + 1)); if (currentIsSameMonth && isToday(dayDate)) { data[i] = actualDistance; } else { data[i] = history[getDateString(dayDate)] || 0; } } setMonthlyData(data); setIsMonthlyLoading(false); }; fetchMonthlyData(); } }, [selectedPeriod, selectedMonthStart, actualDistance, getStoredDistanceHistory]);
  useEffect(() => { const subscribeToPedometer = async () => { const isAvailable = await Pedometer.isAvailableAsync(); if (!isAvailable) return; const { status } = await Pedometer.requestPermissionsAsync(); if (status !== 'granted') return; const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0); const updateDistance = (steps) => { const distanceInKm = (steps * STEP_LENGTH_METERS) / 1000; setActualDistance(distanceInKm); saveDistanceForDate(new Date(), distanceInKm); }; pedometerSubscription.current = Pedometer.watchStepCount(() => { Pedometer.getStepCountAsync(startOfDay, new Date()).then( dailyResult => updateDistance(dailyResult.steps), error => console.error("Pedometer watch error:", error) ); }); }; if (isToday(currentDate)) { subscribeToPedometer(); } return () => pedometerSubscription.current?.remove(); }, [currentDate, saveDistanceForDate]);
  useEffect(() => { const fetchDailyChartData = async () => { const history = await getStoredDistanceHistory(); const weekStart = getStartOfWeek(currentDate, startOfWeekDay); const data = Array(7).fill(0); for(let i=0; i<7; i++) { const day = addDays(weekStart, i); const distanceForDay = history[getDateString(day)] || 0; data[i] = Math.min(distanceForDay, goalDistance); } if (isSameWeek(currentDate, new Date(), startOfWeekDay)) { const todayIndex = (new Date().getDay() - startOfWeekDay + 7) % 7; data[todayIndex] = Math.min(actualDistance, goalDistance); } setDailyChartData(data); }; if(selectedPeriod === 'day') { fetchDailyChartData(); } }, [currentDate, actualDistance, selectedPeriod, goalDistance, startOfWeekDay, getStoredDistanceHistory]);

  const distanceForDisplay = useMemo(() => Math.min(actualDistance, goalDistance), [actualDistance, goalDistance]);
  const { rawSteps, rawCalories, rawMinutes } = useMemo(() => { const dist = distanceForDisplay; if (dist <= 0) return { rawSteps: 0, rawCalories: 0, rawMinutes: 0 }; const meters = dist * 1000; const steps = meters / STEP_LENGTH_METERS; const cals = steps * CALORIES_PER_STEP; const mins = steps / STEPS_PER_MINUTE; return { rawSteps: steps, rawCalories: cals, rawMinutes: mins }; }, [distanceForDisplay]);
  
  const locale = useMemo(() => language === 'ar' ? 'ar-EG' : 'en-US', [language]);
  const formatDisplayDate = useCallback((date) => { if (isToday(date)) return translation.today; if (isYesterday(date)) return translation.yesterday; const localeFormat = language === 'ar' ? 'ar-EG-u-ca-gregory-nu-arab' : 'en-US-u-ca-gregory'; return new Intl.DateTimeFormat(localeFormat, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date); }, [language, translation]);
  
  const handlePreviousDay = () => setCurrentDate(prev => addDays(prev, -1));
  const handleNextDay = () => { if (!isToday(currentDate)) setCurrentDate(prev => addDays(prev, 1)); };
  const handlePreviousWeek = () => setSelectedWeekStart(prev => addDays(prev, -7));
  const handleNextWeek = () => { if (!isCurrentWeek) setSelectedWeekStart(prev => addDays(prev, 7)); };
  const handlePreviousMonth = () => setSelectedMonthStart(prev => addMonths(prev, -1));
  const handleNextMonth = () => { if (!isCurrentMonth) setSelectedMonthStart(prev => addMonths(prev, 1)); };
  const handleTestIncrement = useCallback(() => { if (!isToday(currentDate)) return; const newDistance = actualDistance + 0.5; setActualDistance(newDistance); saveDistanceForDate(currentDate, newDistance);}, [actualDistance, currentDate, saveDistanceForDate]);
  const handleResetData = useCallback(() => { if (!isToday(currentDate)) return; setActualDistance(0); saveDistanceForDate(currentDate, 0); }, [currentDate, saveDistanceForDate]);
  const handleSaveGoal = (newDistance, newUnit) => { setGoalDistance(newDistance); setGoalUnit(newUnit); setModalVisible(false); };
  const handleNavigateToAchievements = () => { if (onNavigateToAchievements) onNavigateToAchievements(Math.round(rawSteps)); };
  const openTitleMenu = useCallback(() => { titleMenuTriggerRef.current.measure((fx, fy, w, h, px, py) => { const top = py + h + MENU_VERTICAL_OFFSET; const positionStyle = I18nManager.isRTL ? { top, right: width - (px + w) } : { top, left: px }; setTitleMenuPosition(positionStyle); setIsTitleMenuVisible(true); }); }, [width]);
  const closeTitleMenu = useCallback(() => setIsTitleMenuVisible(false), []);
  const navigateTo = (screenName) => { closeTitleMenu(); if (onNavigate) onNavigate(screenName); };

  const progressPercentage = goalDistance > 0 ? (distanceForDisplay / goalDistance) * 100 : 0;
  const clampedProgressPercentage = Math.min(100, progressPercentage);
  useEffect(() => { const targetAngle = Math.min(359.999, (clampedProgressPercentage || 0) * 3.6); Animated.timing(animatedAngle, { toValue: targetAngle, duration: 800, useNativeDriver: false }).start(); }, [clampedProgressPercentage]);
  useEffect(() => { const listenerId = animatedAngle.addListener(({ value }) => { setProgressPathD(describeArc(circleSize / 2, circleSize / 2, radius, 0, value)); setDynamicIconStyle(calculateIconPositionOnPath(value)); }); return () => { animatedAngle.removeListener(listenerId); }; }, [radius]);
  useEffect(() => { Animated.timing(animatedDistance, { toValue: distanceForDisplay, duration: 750, useNativeDriver: false }).start(); }, [distanceForDisplay]);
  useEffect(() => { const listenerId = animatedDistance.addListener((v) => { setDisplayDistanceText(v.value.toLocaleString(locale, {minimumFractionDigits: 2, maximumFractionDigits: 2})); }); return () => { animatedDistance.removeListener(listenerId); }; }, [locale]);
  useEffect(() => { const runInitialChecks = async () => { await updateChallengeStatus(); }; runInitialChecks(); const sub = AppState.addEventListener('change', s => {if (s === 'active') runInitialChecks()}); return () => sub.remove() }, [updateChallengeStatus]);
  
  const handlePeriodSelection = (period) => {
    if (period === translation.today) setSelectedPeriod('day');
    else if (period === translation.week) setSelectedPeriod('week');
    else if (period === translation.month) setSelectedPeriod('month');
  };

  return ( 
    <SafeAreaView style={currentStyles.safeArea}>
      <View style={currentStyles.topBar}>
          <TouchableOpacity ref={titleMenuTriggerRef} style={currentStyles.titleGroup} onPress={openTitleMenu} activeOpacity={0.7}><Text style={currentStyles.headerTitle}>{translation.headerTitle}</Text><Icon name="chevron-down" size={24} color={currentStyles.headerTitle.color} style={{ [I18nManager.isRTL ? 'marginRight' : 'marginLeft']: 5 }} /></TouchableOpacity>
      </View>
      <View style={currentStyles.periodSelector}> 
          {periods.map((period) => {
              const isSelected = (selectedPeriod === 'day' && period === translation.today) || (selectedPeriod === 'week' && period === translation.week) || (selectedPeriod === 'month' && period === translation.month);
              return (<TouchableOpacity key={period} style={[ currentStyles.periodButton, isSelected && currentStyles.selectedPeriodButton ]} onPress={() => handlePeriodSelection(period)}>
                  <Text style={[ currentStyles.periodText, isSelected && currentStyles.selectedPeriodText ]}>{period}</Text>
              </TouchableOpacity>);
          })} 
      </View> 
      <ScrollView contentContainerStyle={currentStyles.scrollContainer} key={`${selectedPeriod}-${language}-${isDarkMode}`}>
        
        {selectedPeriod === 'day' && (
          <View style={currentStyles.dayViewContainer}>
            <View style={currentStyles.dateNavigator}>
                <TouchableOpacity onPress={handleNextDay} disabled={isToday(currentDate)}>
                    <Icon name={"chevron-left"} size={30} color={isToday(currentDate) ? currentStyles.disabledIcon.color : currentStyles.dateNavigatorArrow.color} />
                </TouchableOpacity>
                <Text style={currentStyles.dateText}>{formatDisplayDate(currentDate)}</Text>
                <TouchableOpacity onPress={handlePreviousDay}>
                    <Icon name={"chevron-right"} size={30} color={currentStyles.dateNavigatorArrow.color} />
                </TouchableOpacity>
            </View>
            <View style={currentStyles.progressCircleContainer}> 
              <Svg width={circleSize} height={circleSize}><Circle stroke={currentStyles.progressCircleBackground.stroke} fill="none" cx={circleSize / 2} cy={circleSize / 2} r={radius} strokeWidth={strokeWidth}/> <Path d={progressPathD} stroke={currentStyles.progressCircleForeground.stroke} fill="none" strokeWidth={strokeWidth} strokeLinecap="round" /></Svg> 
              {progressPercentage > 0 && (<Animated.View style={[dynamicIconStyle, currentStyles.movingDotContainer]}><View style={[currentStyles.movingDot, { borderColor: currentStyles.safeArea.backgroundColor }]} /></Animated.View>)}
              <View style={currentStyles.circleContent}> 
                <Icon name="map-marker" size={30} color={currentStyles.progressText.color} /> 
                <Text style={currentStyles.progressText}>{displayDistanceText}</Text> 
                <TouchableOpacity style={currentStyles.goalContainer} onPress={() => setModalVisible(true)}> 
                  <Text style={currentStyles.goalText}>{translation.goalPrefix}: {goalDistance.toLocaleString(locale, {minimumFractionDigits: 1, maximumFractionDigits: 1})} {goalUnit}</Text> 
                  <Icon name="pencil" size={16} color={currentStyles.goalText.color} style={{ marginHorizontal: 5 }}/> 
                </TouchableOpacity> 
              </View> 
            </View> 
            <View style={currentStyles.statsContainer}>
              <AnimatedStatCard iconName="fire" value={rawCalories} label={translation.caloriesLabel} formatter={v => v.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} styles={currentStyles}/>
              <AnimatedStatCard iconName="clock-outline" value={rawMinutes} label={translation.timeLabel} formatter={v => { const h = Math.floor(v / 60); const m = Math.floor(v % 60); return `${h.toLocaleString(locale, {minimumIntegerDigits: 2})}:${m.toLocaleString(locale, {minimumIntegerDigits: 2})}`}} styles={currentStyles}/> 
              <AnimatedStatCard iconName="walk" value={rawSteps} label={translation.stepsLabel} formatter={v => Math.round(v).toLocaleString(locale)} styles={currentStyles}/> 
            </View> 
            <ChallengeCard onPress={handleNavigateToAchievements} currentChallengeDuration={currentChallengeDuration} remainingDays={remainingDays} translation={translation} styles={currentStyles}/> 
            <DistanceWeeklyChart weeklyDistanceData={dailyChartData} goalDistance={goalDistance} onTestIncrement={handleTestIncrement} onResetData={handleResetData} translation={translation} styles={currentStyles} language={language}/>
          </View>
        )}
        
        {selectedPeriod === 'week' && (isWeeklyLoading ? <ActivityIndicator size="large" color={currentStyles.activityIndicator.color} style={{marginTop: 50}} /> : <WeeklyDistance weeklyData={weeklyData} goalDistance={goalDistance} isCurrentWeek={isCurrentWeek} formattedDateRange={formatDateRange(selectedWeekStart, getEndOfWeek(selectedWeekStart, startOfWeekDay), language)} onPreviousWeek={handlePreviousWeek} onNextWeek={handleNextWeek} language={language} isDarkMode={isDarkMode} translation={translation} />)}
        {selectedPeriod === 'month' && (isMonthlyLoading ? <ActivityIndicator size="large" color={currentStyles.activityIndicator.color} style={{marginTop: 50}} /> : <MonthlyDistance monthlyData={monthlyData} goalDistance={goalDistance} isCurrentMonth={isCurrentMonth} formattedMonthRange={new Date(selectedMonthStart).toLocaleDateString(language === 'ar' ? 'ar-EG-u-ca-gregory-nu-arab' : 'en-US-u-ca-gregory', { month: 'long', year: 'numeric', timeZone: 'UTC' })} onPreviousMonth={handlePreviousMonth} onNextMonth={handleNextMonth} language={language} isDarkMode={isDarkMode} translation={translation} />)}

      </ScrollView> 
      <GoalModal visible={isModalVisible} onClose={() => setModalVisible(false)} onSave={handleSaveGoal} currentValue={goalDistance} currentUnit={goalUnit} translation={translation} styles={currentStyles}/>
      <Modal visible={isTitleMenuVisible} transparent={true} animationType="fade" onRequestClose={closeTitleMenu}>
          <Pressable style={currentStyles.menuModalOverlay} onPress={closeTitleMenu}>
              <View style={[ currentStyles.titleMenuModalContent, { top: titleMenuPosition.top, left: I18nManager.isRTL ? undefined : titleMenuPosition.left, right: I18nManager.isRTL ? titleMenuPosition.right : undefined, } ]}>
                  <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('steps')}><Text style={currentStyles.titleMenuItemText}>{translation.menuSteps}</Text>{currentScreenName === 'steps' && <Icon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}</TouchableOpacity>
                  <View style={currentStyles.titleMenuSeparator} /><TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('distance')}><Text style={currentStyles.titleMenuItemText}>{translation.menuDistance}</Text>{currentScreenName === 'distance' && <Icon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}</TouchableOpacity>
                  <View style={currentStyles.titleMenuSeparator} /><TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('calories')}><Text style={currentStyles.titleMenuItemText}>{translation.menuCalories}</Text>{currentScreenName === 'calories' && <Icon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}</TouchableOpacity>
                  <View style={currentStyles.titleMenuSeparator} /><TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('activeTime')}><Text style={currentStyles.titleMenuItemText}>{translation.menuActiveTime}</Text>{currentScreenName === 'activeTime' && <Icon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}</TouchableOpacity>
              </View>
          </Pressable>
      </Modal>
    </SafeAreaView> 
  );
};

// --- الأنماط ---
const lightStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FDF9' },
  scrollContainer: { paddingTop: 10, paddingBottom: 50, flexGrow: 1 },
  dayViewContainer: { alignItems: 'center', width: '100%' },
  topBar: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'flex-start', alignItems: 'center', width: '100%', paddingVertical: 15, paddingHorizontal: 20 },
  titleGroup: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32' },
  periodSelector: { flexDirection: 'row-reverse', backgroundColor: '#E8F5E9', borderRadius: 20, overflow: 'hidden', width: '90%', height: 40, alignSelf: 'center', marginTop: 10 },
  periodButton: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  selectedPeriodButton: { backgroundColor: '#388e3c', borderRadius: 20 },
  periodText: { fontSize: 16, color: '#388e3c', fontWeight: 'bold' },
  selectedPeriodText: { color: 'white' },
  dateNavigator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '60%', marginVertical: 25 },
  dateNavigatorArrow: { color: '#2e7d32'},
  dateText: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32', marginHorizontal: 15 },
  disabledIcon: { color: '#a5d6a7' },
  progressCircleContainer: { width: circleSize, height: circleSize, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  progressCircleBackground: { stroke: '#e0f2f1' },
  progressCircleForeground: { stroke: '#4caf50' },
  circleContent: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  progressText: { fontSize: 60, fontWeight: 'bold', color: '#388e3c', marginVertical: 5, fontVariant: ['tabular-nums'] },
  goalContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', padding: 5 },
  goalText: { fontSize: 16, color: '#757575' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '95%' },
  statCard: { alignItems: 'center', flex: 1 },
  iconContainer: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 10, backgroundColor: '#e0f2f1' },
  animatedStatIcon: { color: '#4caf50'},
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#388e3c', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 14, color: '#757575', marginTop: 4 },
  challengeCardWrapper: { width: '100%', paddingVertical: 15, marginTop: 15 },
  summaryCard: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 15, width: '90%', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, alignSelf: 'center' },
  summaryTextContainer: { alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start', flex: 1, marginHorizontal: 12 },
  summaryMainText: { fontSize: 18, fontWeight: 'bold', color: '#424242', textAlign: I18nManager.isRTL ? 'right' : 'left' },
  summarySubText: { fontSize: 14, color: '#757575', textAlign: I18nManager.isRTL ? 'right' : 'left', marginTop: 2 },
  summaryChevron: { color: "#bdbdbd" },
  badgeContainer: { width: BADGE_CONTAINER_SIZE, height: BADGE_CONTAINER_SIZE, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badgeBackgroundCircle: { stroke: "#e0f2f1" },
  badgeProgressCircle: { stroke: "#4caf50" },
  badgeTextContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 16, fontWeight: 'bold', color: '#4caf50', fontVariant: ['tabular-nums'] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, width: width * 0.9, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 25 },
  pickersContainer: { flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: '#F7FDF9', borderRadius: 20 },
  pickerItemText: { fontSize: 24, color: '#4caf50' },
  selectedPickerItemText: { fontSize: 32, fontWeight: 'bold', color: '#2e7d32' },
  buttonRow: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 },
  modalButton: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  saveButton: { backgroundColor: '#4caf50', marginLeft: 10 },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#e8f5e9' },
  cancelButtonText: { color: '#388e3c', fontSize: 18, fontWeight: 'bold' },
  movingDotContainer: { width: ICON_SIZE, height: ICON_SIZE, justifyContent: 'center', alignItems: 'center', },
  movingDot: { width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2, backgroundColor: '#4caf50', borderWidth: 2 },
  activityIndicator: { color: '#388e3c' },
  menuModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)' },
  titleMenuModalContent: { position: 'absolute', backgroundColor: 'white', borderRadius: 12, paddingVertical: 8, minWidth: 240, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6 },
  menuItemButton: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, width: '100%' },
  titleMenuItemText: { fontSize: 16, color: '#2e7d32', fontWeight: 'bold', textAlign: I18nManager.isRTL ? 'right' : 'left' },
  titleMenuSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e0e0e0' },
  card: { backgroundColor: '#FFF', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 10, width: '90%', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  chartHeader: { width: '100%', alignItems: 'flex-end', marginBottom: 10, paddingRight: 10 },
  chartTitle: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  testButtonsContainer: { flexDirection: 'row-reverse', justifyContent: 'center', marginBottom: 20, width: '100%', flexWrap: 'wrap' },
  testButton: { backgroundColor: '#E8F5E9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginHorizontal: 5, marginVertical: 5, elevation: 1 },
  testButtonText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 13 },
  chartAreaContainer: { flexDirection: 'row-reverse', width: '100%', paddingRight: 5 },
  yAxisLabels: { height: CHART_HEIGHT, justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: 5 },
  axisLabelY: { color: '#757575', fontSize: 12 },
  chartContent: { flex: 1, height: CHART_HEIGHT, position: 'relative', marginLeft: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  barsAndLabelsContainer: { flexDirection: 'row-reverse', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%' },
  barColumn: { alignItems: 'center', justifyContent: 'flex-end', flex: 1, position: 'relative' },
  bar: { width: 12, backgroundColor: '#c8e6c9', borderRadius: 6 },
  barToday: { backgroundColor: '#66bb6a' },
  selectedBar: { backgroundColor: '#2E7D32' },
  barGoalAchieved: { backgroundColor: '#4caf50' },
  axisLabelX: { color: '#757575', marginTop: 8, fontSize: 12 },
  activeDayLabel: { color: '#000000', fontWeight: 'bold' },
  tooltipPositioner: { position: 'absolute', alignSelf: 'center', alignItems: 'center', zIndex: 10, minWidth: 40 },
  tooltipBox: { backgroundColor: '#333333', borderRadius: 5, paddingVertical: 4, paddingHorizontal: 8, elevation: 3 },
  tooltipText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  tooltipArrow: { position: 'absolute', bottom: -6, width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#333333', alignSelf: 'center' },
});

const darkStyles = StyleSheet.create({
  ...lightStyles,
  safeArea: { ...lightStyles.safeArea, backgroundColor: '#121212' },
  headerTitle: { ...lightStyles.headerTitle, color: '#A7FFEB' },
  topBar: { ...lightStyles.topBar, backgroundColor: '#121212'},
  periodSelector: { ...lightStyles.periodSelector, backgroundColor: '#1E1E1E' },
  periodText: { ...lightStyles.periodText, color: '#80CBC4' },
  selectedPeriodButton: { ...lightStyles.selectedPeriodButton, backgroundColor: '#00796B' },
  selectedPeriodText: { ...lightStyles.selectedPeriodText, color: '#E0E0E0' },
  dateNavigatorArrow: { color: '#80CBC4'},
  dateText: { ...lightStyles.dateText, color: '#80CBC4' },
  disabledIcon: { color: '#004D40' },
  progressCircleBackground: { stroke: '#333333' },
  progressCircleForeground: { stroke: '#80CBC4' },
  progressText: { ...lightStyles.progressText, color: '#80CBC4' },
  goalText: { ...lightStyles.goalText, color: '#B0B0B0' },
  iconContainer: { ...lightStyles.iconContainer, backgroundColor: '#2C2C2C' },
  animatedStatIcon: { color: '#80CBC4'},
  statValue: { ...lightStyles.statValue, color: '#E0E0E0' },
  statLabel: { ...lightStyles.statLabel, color: '#B0B0B0' },
  summaryCard: { ...lightStyles.summaryCard, backgroundColor: '#1E1E1E' },
  summaryMainText: { ...lightStyles.summaryMainText, color: '#E0E0E0' },
  summarySubText: { ...lightStyles.summarySubText, color: '#B0B0B0' },
  summaryChevron: { color: "#A0A0A0" },
  badgeBackgroundCircle: { stroke: "#333333" },
  badgeProgressCircle: { stroke: "#80CBC4" },
  badgeText: { ...lightStyles.badgeText, color: '#80CBC4' },
  movingDot: { ...lightStyles.movingDot, backgroundColor: '#80CBC4'},
  activityIndicator: { color: '#80CBC4' },
  modalOverlay: { ...lightStyles.modalOverlay, backgroundColor: 'rgba(0, 0, 0, 0.7)'},
  modalCard: { ...lightStyles.modalCard, backgroundColor: '#2C2C2C' },
  modalTitle: { ...lightStyles.modalTitle, color: '#E0E0E0' },
  pickersContainer: { ...lightStyles.pickersContainer, backgroundColor: '#1E1E1E' },
  pickerItemText: { ...lightStyles.pickerItemText, color: '#80CBC4' },
  selectedPickerItemText: { ...lightStyles.selectedPickerItemText, color: '#A7FFEB' },
  saveButton: { ...lightStyles.saveButton, backgroundColor: '#00796B' },
  saveButtonText: { ...lightStyles.saveButtonText, color: '#E0E0E0' },
  cancelButton: { ...lightStyles.cancelButton, backgroundColor: '#424242' },
  cancelButtonText: { ...lightStyles.cancelButtonText, color: '#B0B0B0' },
  titleMenuModalContent: { ...lightStyles.titleMenuModalContent, backgroundColor: '#2C2C2C' },
  titleMenuItemText: { ...lightStyles.titleMenuItemText, color: '#A7FFEB' },
  titleMenuSeparator: { ...lightStyles.titleMenuSeparator, backgroundColor: '#424242' },
  card: { ...lightStyles.card, backgroundColor: '#1E1E1E' },
  chartHeader: { ...lightStyles.chartHeader },
  chartTitle: { ...lightStyles.chartTitle, color: '#80CBC4' },
  testButton: { ...lightStyles.testButton, backgroundColor: '#2C2C2C'},
  testButtonText: { ...lightStyles.testButtonText, color: '#80CBC4'},
  axisLabelY: { ...lightStyles.axisLabelY, color: '#B0B0B0'},
  chartContent: { ...lightStyles.chartContent, borderBottomColor: '#333333'},
  bar: { ...lightStyles.bar, backgroundColor: '#004D40'},
  barToday: { ...lightStyles.barToday, backgroundColor: '#00796B'},
  selectedBar: { ...lightStyles.selectedBar, backgroundColor: '#A7FFEB'},
  barGoalAchieved: { ...lightStyles.barGoalAchieved, backgroundColor: '#80CBC4'},
  axisLabelX: { ...lightStyles.axisLabelX, color: '#B0B0B0'},
  activeDayLabel: { ...lightStyles.activeDayLabel, color: '#FFFFFF'},
  tooltipBox: { ...lightStyles.tooltipBox, backgroundColor: '#E0E0E0'},
  tooltipText: { ...lightStyles.tooltipText, color: '#121212'},
  tooltipArrow: { ...lightStyles.tooltipArrow, borderTopColor: '#E0E0E0'},
});

export default DistanceScreen;
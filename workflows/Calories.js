// CaloriesScreen.js (النسخة النهائية والصحيحة)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView,
    Platform, Animated, Modal, Pressable, I18nManager, Alert, AppState, ActivityIndicator, useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Circle as SvgCircle, Path } from 'react-native-svg';
import { Pedometer } from 'expo-sensors';

// --- استيراد مكونات الأسبوع والشهر (تم إرجاعها كما طلبت) ---
import WeeklyCalories from './weeklycalories'; // تأكد من أن هذا المسار صحيح
import MonthlyCalories from './monthlycalories'; // تأكد من أن هذا المسار صحيح


// --- الثوابت الأساسية ---
const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.70;
const CIRCLE_BORDER_WIDTH = 20;
const ICON_SIZE = 24;
const SVG_VIEWBOX_SIZE = CIRCLE_SIZE;
const PATH_RADIUS = (CIRCLE_SIZE / 2) - (CIRCLE_BORDER_WIDTH / 2);
const CENTER_X = SVG_VIEWBOX_SIZE / 2;
const CENTER_Y = SVG_VIEWBOX_SIZE / 2;
const CALORIES_PER_STEP = 0.04;
const STEP_LENGTH_METERS = 0.762;
const STEPS_PER_MINUTE = 100;
const MENU_VERTICAL_OFFSET = 5;

// --- ثوابت الرسم البياني ---
const CHART_HEIGHT = 150;
const BAR_CONTAINER_HEIGHT = CHART_HEIGHT;
const X_AXIS_HEIGHT = 30;
const Y_AXIS_WIDTH = 45;
const BAR_WIDTH = 12;
const BAR_SPACING = 18;
const TOOLTIP_ARROW_HEIGHT = 6;
const TOOLTIP_ARROW_WIDTH = 12;
const TOOLTIP_OFFSET = 5;

// --- ثوابت التحدي ---
const CHALLENGE_DURATIONS = [7, 14, 30];
const INITIAL_CHALLENGE_DURATION = CHALLENGE_DURATIONS[0];
const LAST_PARTICIPATION_DATE_KEY = '@StepsChallenge:lastParticipationDate';
const REMAINING_CHALLENGE_DAYS_KEY = '@StepsChallenge:remainingDays';
const CURRENT_CHALLENGE_DURATION_KEY = '@StepsChallenge:currentDuration';
const MAX_COMPLETED_CHALLENGE_DAYS_KEY = '@Achievements:maxCompletedChallengeDays';
const CELEBRATE_TIER_COMPLETION_KEY = '@Achievements:celebrateTierCompletion';

// ثوابت شارة التحدي
const BADGE_CONTAINER_SIZE = 60;
const BADGE_SVG_SIZE = BADGE_CONTAINER_SIZE;
const BADGE_CIRCLE_BORDER_WIDTH = 6;
const BADGE_PATH_RADIUS = (BADGE_SVG_SIZE / 2) - (BADGE_CIRCLE_BORDER_WIDTH / 2);
const BADGE_CENTER_X = BADGE_SVG_SIZE / 2;
const BADGE_CENTER_Y = BADGE_SVG_SIZE / 2;

// ثوابت الهدف
const GOAL_OPTIONS = [ 150, 200, 250, 300, 350, 400, 500, 600, 750, 1000, 1500, 2500, 5000, 10000 ];
const DEFAULT_GOAL = 300;
const GOAL_KEY = '@Calories:goal';

// ثوابت أخرى
const STEP_ANIMATION_DURATION = 400;
const DAILY_STEPS_HISTORY_KEY = '@Steps:DailyHistory';

// --- الترجمات ---
const translations = {
    ar: {
        caloriesTitle: "السعرات",
        stepsTitle: "الخطوات",
        distanceTitle: "المسافة",
        timeTitle: "الوقت النشط",
        goalLabelPrefix: 'الهدف:',
        caloriesUnit: 'كيلوكالوري',
        distanceUnit: 'كم',
        stepsUnit: 'خطوة',
        timeUnit: 'ساعات',
        challengePrefix: 'أيام تحدي',
        challengeCompleted: 'اكتمل التحدي!',
        challengeRemainingSingular: 'يوم متبقي',
        challengeRemainingPlural: 'أيام متبقية',
        challengeDaySuffix: 'ي',
        editGoal: 'تعديل الهدف',
        setTargetTitle: 'تحديد السعرات المستهدفة',
        save: 'حفظ',
        cancel: 'إلغاء',
        errorTitle: "خطأ",
        cannotSaveGoalError: "لم نتمكن من حفظ الهدف.",
        dayNamesShort: ['س', 'أ', 'ن', 'ث', 'ر', 'خ', 'ج'], // السبت -> الجمعة
        weeklyStatsTitle: "إحصائيات الأسبوع",
        pedometerNotAvailable: "عداد الخطى غير متوفر",
        addSteps: "إضافة 1000 خطوة",
        reset: "إعادة تعيين",
        today: "اليوم",
        yesterday: "أمس",
        dayPeriod: 'يوم',
        weekPeriod: 'أسبوع',
        monthPeriod: 'شهر',
    },
    en: {
        caloriesTitle: "Calories",
        stepsTitle: "Steps",
        distanceTitle: "Distance",
        timeTitle: "Active Time",
        goalLabelPrefix: 'Goal:',
        caloriesUnit: 'kcal',
        distanceUnit: 'km',
        stepsUnit: 'step',
        timeUnit: 'hours',
        challengePrefix: 'Day Challenge',
        challengeCompleted: 'Challenge Completed!',
        challengeRemainingSingular: 'day remaining',
        challengeRemainingPlural: 'days remaining',
        challengeDaySuffix: 'd',
        editGoal: 'Edit Goal',
        setTargetTitle: 'Set Calorie Goal',
        save: 'Save',
        cancel: 'Cancel',
        errorTitle: "Error",
        cannotSaveGoalError: "We could not save the goal.",
        dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], // Sunday -> Saturday
        weeklyStatsTitle: "Weekly Stats",
        pedometerNotAvailable: "Pedometer is not available",
        addSteps: "Add 1000 Steps",
        reset: "Reset",
        today: "Today",
        yesterday: "Yesterday",
        dayPeriod: 'Day',
        weekPeriod: 'Week',
        monthPeriod: 'Month',
    },
};

// --- دوال مساعدة ---
const MOVING_DOT_SIZE = CIRCLE_BORDER_WIDTH; 
const calculateIconPositionOnPath = (angleDegrees) => { const angleRad = (angleDegrees - 90) * (Math.PI / 180); const iconRadius = PATH_RADIUS; const xOffset = iconRadius * Math.cos(angleRad); const yOffset = iconRadius * Math.sin(angleRad); const iconCenterX = (SVG_VIEWBOX_SIZE / 2) + xOffset; const iconCenterY = (SVG_VIEWBOX_SIZE / 2) + yOffset; const top = iconCenterY - (MOVING_DOT_SIZE / 2); const left = iconCenterX - (MOVING_DOT_SIZE / 2); return { position: 'absolute', width: MOVING_DOT_SIZE, height: MOVING_DOT_SIZE, top, left, zIndex: 10 }; };
const describeArc = (x, y, radius, startAngleDeg, endAngleDeg) => { const clampedEndAngle = Math.min(endAngleDeg, 359.999); const startAngleRad = ((startAngleDeg - 90) * Math.PI) / 180.0; const endAngleRad = ((clampedEndAngle - 90) * Math.PI) / 180.0; const startX = x + radius * Math.cos(startAngleRad); const startY = y + radius * Math.sin(startAngleRad); const endX = x + radius * Math.cos(endAngleRad); const endY = y + radius * Math.sin(endAngleRad); const largeArcFlag = clampedEndAngle - startAngleDeg <= 180 ? '0' : '1'; const sweepFlag = '1'; const d = [ 'M', startX, startY, 'A', radius, radius, 0, largeArcFlag, sweepFlag, endX, endY ].join(' '); return d; };
const getDateString = (date) => { if (!date || !(date instanceof Date)) return null; return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10); };
const getStartOfWeek = (date, startOfWeekDay = 6) => { const d = new Date(date); d.setUTCHours(0, 0, 0, 0); const day = d.getUTCDay(); const diff = (day < startOfWeekDay) ? (day - startOfWeekDay + 7) : (day - startOfWeekDay); d.setDate(d.getDate() - diff); return d; };
const addDays = (date, days) => { const result = new Date(date); result.setUTCDate(result.getUTCDate() + days); return result; };
const isToday = (someDate) => { const today = new Date(); return someDate.getDate() === today.getDate() && someDate.getMonth() === today.getMonth() && someDate.getFullYear() === today.getFullYear(); };
const isYesterday = (someDate) => { const today = new Date(); const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1); return someDate.getDate() === yesterday.getDate() && someDate.getMonth() === yesterday.getMonth() && someDate.getFullYear() === yesterday.getFullYear(); };
const getEndOfWeek = (date, startOfWeekDay) => { const start = getStartOfWeek(date, startOfWeekDay); const end = new Date(start); end.setUTCDate(start.getUTCDate() + 6); end.setUTCHours(23, 59, 59, 999); return end; };
const isSameWeek = (date1, date2, startOfWeekDay) => { if (!date1 || !date2) return false; const start1 = getStartOfWeek(date1, startOfWeekDay); const start2 = getStartOfWeek(date2, startOfWeekDay); return start1.getTime() === start2.getTime(); };
const getStartOfMonth = (date) => { const d = new Date(date); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(1); return d; };
const addMonths = (date, months) => { const d = new Date(date); d.setUTCMonth(d.getUTCMonth() + months); return d; };
const getDaysInMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
const formatDateRange = (startDate, endDate, lang) => { const locale = lang === 'ar' ? 'ar-EG-u-ca-gregory-nu-arab' : 'en-US-u-ca-gregory'; const optionsDayMonth = { day: 'numeric', month: 'long', timeZone: 'UTC' }; const optionsDay = { day: 'numeric', timeZone: 'UTC' }; if (startDate.getUTCMonth() === endDate.getUTCMonth()) { const monthName = endDate.toLocaleDateString(locale, { month: 'long', timeZone: 'UTC' }); return `${startDate.toLocaleDateString(locale, optionsDay)} - ${endDate.toLocaleDateString(locale, optionsDay)} ${monthName}`; } else { return `${startDate.toLocaleDateString(locale, optionsDayMonth)} - ${endDate.toLocaleDateString(locale, optionsDayMonth)}`; } };


// --- مكونات قابلة لإعادة الاستخدام (كاملة) ---
const AnimatedStatItem = React.memo(({ type, value, unit, styles, formatter }) => {
    const icons = { steps: 'walk', time: 'clock-time-four-outline', distance: 'map-marker-distance' };
    const iconName = icons[type];

    const animatedValue = useRef(new Animated.Value(value || 0)).current;
    const [displayValue, setDisplayValue] = useState(() => formatter(value || 0));

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value || 0,
            duration: 750,
            useNativeDriver: false,
        }).start();
    }, [value]);

    useEffect(() => {
        const listenerId = animatedValue.addListener((v) => {
            setDisplayValue(formatter(v.value));
        });
        return () => animatedValue.removeListener(listenerId);
    }, [formatter, animatedValue]);

    return (
        <View style={styles.statItem}>
            <View style={styles.statIconCircle}>
                <MaterialCommunityIcon name={iconName} size={28} color={styles.statIcon.color} />
            </View>
            <Text style={styles.statValue}>{displayValue}</Text>
            <Text style={styles.statUnit}>{unit}</Text>
        </View>
    );
});


const ActivityChart = React.memo(({ data = [], goal = DEFAULT_GOAL, styles, language, dayNames }) => { 
    const [tooltipVisible, setTooltipVisible] = useState(false); 
    const [selectedBarIndex, setSelectedBarIndex] = useState(null); 
    const [selectedBarValue, setSelectedBarValue] = useState(null); 
    const yAxisLabelsToDisplay = useMemo(() => { 
        const dataMax = Math.max(...(data || []).map(d => d || 0), 0);
        const practicalMax = Math.max(dataMax, goal, 1);
        let roundedMax = Math.ceil(practicalMax / 100) * 100;
        if (roundedMax < 100) roundedMax = 100;
        const stepSize = Math.max(50, Math.ceil(roundedMax / 4 / 50) * 50);
        const finalMax = Math.max(stepSize * 4, 1);
        const labels = [];
        for (let i = 0; i <= 4; i++) { labels.push(Math.round(i * (finalMax / 4))); }
        const uniqueLabels = [...new Set(labels)].sort((a,b) => a-b);
        while (uniqueLabels.length < 5) { uniqueLabels.unshift(0); }
        return uniqueLabels.slice(0,5);
    }, [data, goal]);
    const scaleMaxValue = Math.max(yAxisLabelsToDisplay[yAxisLabelsToDisplay.length - 1] || 1, 1); 
    const scale = BAR_CONTAINER_HEIGHT / scaleMaxValue; 
    const handleBarPress = useCallback((displayIndex, value) => { const numericValue = value || 0; if (tooltipVisible && selectedBarIndex === displayIndex) { setTooltipVisible(false); setSelectedBarIndex(null); setSelectedBarValue(null); } else if (numericValue > 0) { setTooltipVisible(true); setSelectedBarIndex(displayIndex); setSelectedBarValue(numericValue); } else { setTooltipVisible(false); setSelectedBarIndex(null); setSelectedBarValue(null); } }, [tooltipVisible, selectedBarIndex]); 
    const handleOutsidePress = useCallback(() => { if (tooltipVisible) { setTooltipVisible(false); setSelectedBarIndex(null); setSelectedBarValue(null); } }, [tooltipVisible]); 
    const jsDayIndex = new Date().getDay();
    const startOfWeekDay = language === 'ar' ? 6 : 0;
    const displayDayIndex = (jsDayIndex - startOfWeekDay + 7) % 7;
    return ( <Pressable onPress={handleOutsidePress} style={styles.chartPressableArea}><View style={styles.chartContainer}><View style={styles.yAxisContainer}>{yAxisLabelsToDisplay.slice().reverse().map((labelValue, index) => (<Text key={`y-${index}`} style={styles.yAxisLabel}>{labelValue.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</Text>))}</View><View style={styles.mainChartArea}><View style={styles.barsContainer}>{dayNames.map((_, displayIndex) => { const dataIndex = displayIndex; const value = (Array.isArray(data) && data.length === 7) ? (data[dataIndex] || 0) : 0; const barHeight = Math.min(BAR_CONTAINER_HEIGHT, Math.max(0, value * scale)); const isTodayLabel = displayIndex === displayDayIndex; const achievedGoal = value >= goal; const isSelected = selectedBarIndex === displayIndex; return ( <View key={`bar-${displayIndex}`} style={styles.barWrapper}><Pressable onPress={(e) => { e.stopPropagation(); handleBarPress(displayIndex, value); }} hitSlop={5} disabled={value <= 0}><View style={[styles.bar, { height: barHeight }, isTodayLabel ? (achievedGoal ? styles.barTodayAchieved : styles.barToday) : (achievedGoal ? styles.barAchievedGoal : styles.barDefault), isSelected && value > 0 && styles.selectedBar]}/></Pressable>{tooltipVisible && isSelected && selectedBarValue !== null && ( <View style={[styles.tooltipPositioner, { bottom: barHeight + TOOLTIP_OFFSET }]}><View style={styles.tooltipBox}><Text style={styles.tooltipText}>{Math.round(selectedBarValue).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</Text></View><View style={styles.tooltipArrow} /></View> )}</View> ); })}</View><View style={styles.xAxisContainer}>{dayNames.map((day, displayIndex) => (<View key={`x-${displayIndex}`} style={styles.dayLabelWrapper}>
        <Text style={[ styles.xAxisLabel, (displayIndex === displayDayIndex || (selectedBarIndex !== null && displayIndex === selectedBarIndex)) && styles.xAxisLabelToday ]}>{day}</Text>
    </View>))}</View></View></View></Pressable> ); });

// ====================================================================================
// ============================= بداية المكون الرئيسي =================================
// ====================================================================================
const CaloriesScreen = (props) => {
    const { 
        onNavigate, 
        currentScreenName, 
        onNavigateToAchievements,
        language: initialLanguage, 
        isDarkMode: initialIsDarkMode 
    } = props;
    
    const systemColorScheme = useColorScheme();
    const [language, setLanguage] = useState(initialLanguage || (I18nManager.isRTL ? 'ar' : 'en'));
    const isDarkMode = initialIsDarkMode === undefined ? systemColorScheme === 'dark' : initialIsDarkMode;
    const translation = useMemo(() => translations[language] || translations.ar, [language]);
    const currentStyles = useMemo(() => isDarkMode ? darkStyles : lightStyles, [isDarkMode]);
    const startOfWeekDay = useMemo(() => (language === 'ar' ? 6 : 0), [language]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [stepsHistory, setStepsHistory] = useState({});
    const [pedometerSteps, setPedometerSteps] = useState(0);
    const [displayCalories, setDisplayCalories] = useState(0);
    const [goalCalories, setGoalCalories] = useState(DEFAULT_GOAL);
    const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
    const [tempGoalCalories, setTempGoalCalories] = useState(DEFAULT_GOAL);
    const [isTitleMenuVisible, setIsTitleMenuVisible] = useState(false);
    const [titleMenuPosition, setTitleMenuPosition] = useState({ top: 0, left: undefined, right: undefined });
    const titleMenuTriggerRef = useRef(null);
    const [lastParticipationDate, setLastParticipationDate] = useState(null);
    const [currentChallengeDuration, setCurrentChallengeDuration] = useState(INITIAL_CHALLENGE_DURATION);
    const [remainingDays, setRemainingDays] = useState(INITIAL_CHALLENGE_DURATION);
    const [appState, setAppState] = useState(AppState.currentState);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('day'); 
    
    const [weeklyChartData, setWeeklyChartData] = useState({ dates: [], steps: Array(7).fill(0) }); // For daily chart
    const [fullWeeklyData, setFullWeeklyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);
    const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);
    const [selectedWeekStart, setSelectedWeekStart] = useState(() => getStartOfWeek(new Date(), startOfWeekDay));
    const [selectedMonthStart, setSelectedMonthStart] = useState(() => getStartOfMonth(new Date()));
    const [isCurrentWeek, setIsCurrentWeek] = useState(true);
    const [isCurrentMonth, setIsCurrentMonth] = useState(true);

    const animatedAngle = useRef(new Animated.Value(0)).current;
    const animationFrameRef = useRef(null);
    const pedometerSubscription = useRef(null);
    const displayCaloriesRef = useRef(displayCalories);
    const [dynamicIconStyle, setDynamicIconStyle] = useState(() => calculateIconPositionOnPath(0));
    const [progressPathD, setProgressPathD] = useState('');

    const navigateTo = (screenName) => {
       closeTitleMenu();
       if (onNavigate && typeof onNavigate === 'function') {
           onNavigate(screenName);
       } else {
           console.error(`Navigation failed: 'onNavigate' prop is missing or is not a function.`);
           Alert.alert("خطأ في التنقل", `فشل الانتقال إلى الشاشة.`);
       }
    };
    
    const handleNavigateToAchievements = () => {
        if (onNavigateToAchievements && typeof onNavigateToAchievements === 'function') {
            onNavigateToAchievements(pedometerSteps);
        } else {
            console.error('[CaloriesScreen] onNavigateToAchievements is not a function.');
        }
    };

    useEffect(() => { displayCaloriesRef.current = displayCalories; }, [displayCalories]);
    
    const getStoredStepsHistory = useCallback(async () => {
        try { const storedHistory = await AsyncStorage.getItem(DAILY_STEPS_HISTORY_KEY); return storedHistory ? JSON.parse(storedHistory) : {}; } 
        catch (error) { console.error("Failed to get step history:", error); return {}; }
    }, []);

    const saveDailySteps = useCallback(async (date, steps) => {
        const dateString = getDateString(date);
        if (!dateString) return;
        try { 
            const history = await getStoredStepsHistory(); 
            if (history[dateString] !== Math.round(steps)) {
                history[dateString] = Math.round(steps);
                await AsyncStorage.setItem(DAILY_STEPS_HISTORY_KEY, JSON.stringify(history)); 
                setStepsHistory(prev => ({...prev, [dateString]: Math.round(steps)}));
            }
        }
        catch (error) { console.error("Failed to save daily steps:", error); }
    }, [getStoredStepsHistory]);

    useEffect(() => {
        const loadHistory = async () => {
            const history = await getStoredStepsHistory();
            setStepsHistory(history);
        };
        loadHistory();
    }, [getStoredStepsHistory]);

    useEffect(() => {
        let isMounted = true;
        const subscribe = async () => {
            const isAvailable = await Pedometer.isAvailableAsync();
            if (!isAvailable) {
                if(isMounted) Alert.alert(translation.errorTitle, translation.pedometerNotAvailable);
                return;
            }
            const { status } = await Pedometer.requestPermissionsAsync();
            if (status === 'granted') {
                const fetchAndUpdateTodaySteps = async () => {
                    if (!isMounted) return;
                    const start = new Date();
                    start.setHours(0, 0, 0, 0);
                    const end = new Date();
                    try {
                        const result = await Pedometer.getStepCountAsync(start, end);
                        if (isMounted && result) {
                            const newSteps = result.steps || 0;
                            setPedometerSteps(newSteps);
                            saveDailySteps(new Date(), newSteps);
                        }
                    } catch (error) { console.error("Could not fetch step count:", error); }
                };
                await fetchAndUpdateTodaySteps();
                pedometerSubscription.current = Pedometer.watchStepCount(fetchAndUpdateTodaySteps);
            } else {
                 if(isMounted) Alert.alert(translation.errorTitle, "تم رفض إذن الوصول إلى بيانات النشاط.");
            }
        };
        subscribe();
        return () => { isMounted = false; if (pedometerSubscription.current) { pedometerSubscription.current.remove(); pedometerSubscription.current = null; } };
    }, [saveDailySteps, translation]);
    
    const stepsForDate = useMemo(() => {
        if (isToday(currentDate)) { return pedometerSteps; }
        const dateStr = getDateString(currentDate);
        return stepsHistory[dateStr] || 0;
    }, [currentDate, pedometerSteps, stepsHistory]);
    
    const caloriesForDate = useMemo(() => stepsForDate * CALORIES_PER_STEP, [stepsForDate]);
    
    const caloriesToDisplayInCircle = useMemo(() => {
        return Math.min(caloriesForDate, goalCalories);
    }, [caloriesForDate, goalCalories]);
    
    const animateDisplay = useCallback((startValue, endValue) => { if (startValue === endValue || isNaN(startValue) || isNaN(endValue)) { setDisplayCalories(endValue); return; } if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); const startTime = Date.now(); const step = () => { const now = Date.now(); const timePassed = now - startTime; const progress = Math.min(timePassed / STEP_ANIMATION_DURATION, 1); const currentDisplay = startValue + (endValue - startValue) * progress; setDisplayCalories(currentDisplay); if (progress < 1) animationFrameRef.current = requestAnimationFrame(step); else if (progress >= 1) { setDisplayCalories(endValue); }}; animationFrameRef.current = requestAnimationFrame(step); }, []);

    useEffect(() => {
        animateDisplay(displayCaloriesRef.current, caloriesToDisplayInCircle);
    }, [caloriesToDisplayInCircle, animateDisplay]);
    
    useEffect(() => {
        const loadGoal = async () => { try { const storedGoal = await AsyncStorage.getItem(GOAL_KEY); if (storedGoal) { const parsedGoal = parseInt(storedGoal, 10); setGoalCalories(parsedGoal); setTempGoalCalories(parsedGoal); } } catch (e) { console.error("Failed to load goal:", e); } };
        loadGoal();
    }, []);

    const formatDisplayDate = useCallback((date) => {
        const localeFormat = language === 'ar' ? 'ar-EG-u-ca-gregory-nu-arab' : 'en-US-u-ca-gregory';
        if (isToday(date)) return translation.today;
        if (isYesterday(date)) return translation.yesterday;
        return new Intl.DateTimeFormat(localeFormat, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date);
    }, [language, translation]);

    const handlePreviousDay = () => { setCurrentDate(prevDate => addDays(prevDate, -1)); };
    const handleNextDay = () => { if (!isToday(currentDate)) setCurrentDate(prevDate => addDays(prevDate, 1)); };

    const handleAddSteps = () => { if (!isToday(currentDate)) return; const newSteps = pedometerSteps + 1000; setPedometerSteps(newSteps); saveDailySteps(new Date(), newSteps); };
    const handleResetSteps = () => { if (!isToday(currentDate)) return; setPedometerSteps(0); saveDailySteps(new Date(), 0); };

    const openTitleMenu = useCallback(() => { if (titleMenuTriggerRef.current) { titleMenuTriggerRef.current.measure((fx, fy, w, h, px, py) => { const top = py + h + MENU_VERTICAL_OFFSET; const positionStyle = I18nManager.isRTL ? { top, right: width - (px + w), left: undefined } : { top, left: px, right: undefined }; setTitleMenuPosition(positionStyle); setIsTitleMenuVisible(true); }); } }, [width]);
    const closeTitleMenu = useCallback(() => setIsTitleMenuVisible(false), []);
    
    const updateChallengeStatus = useCallback(async () => {
        const todayString = getDateString(new Date());
        if (!todayString) return;
        try {
            const [storedRemainingDaysStr, storedLastParticipationDate, storedChallengeDurationStr] = await Promise.all([ AsyncStorage.getItem(REMAINING_CHALLENGE_DAYS_KEY), AsyncStorage.getItem(LAST_PARTICIPATION_DATE_KEY), AsyncStorage.getItem(CURRENT_CHALLENGE_DURATION_KEY) ]);
            let loadedDuration = INITIAL_CHALLENGE_DURATION;
            if (storedChallengeDurationStr !== null) { const parsedDuration = parseInt(storedChallengeDurationStr, 10); if (!isNaN(parsedDuration) && CHALLENGE_DURATIONS.includes(parsedDuration)) loadedDuration = parsedDuration; }
            setCurrentChallengeDuration(loadedDuration);
            let currentRemainingDays = loadedDuration;
            if (storedRemainingDaysStr !== null) { const parsedDays = parseInt(storedRemainingDaysStr, 10); if (!isNaN(parsedDays) && parsedDays >= 0 && parsedDays <= loadedDuration) currentRemainingDays = parsedDays; }
            setRemainingDays(currentRemainingDays);
            setLastParticipationDate(storedLastParticipationDate);
            if (todayString !== storedLastParticipationDate && currentRemainingDays > 0) {
                const newRemainingDays = currentRemainingDays - 1;
                if (newRemainingDays <= 0) {
                    try {
                        const completedDuration = loadedDuration;
                        const storedMaxStr = await AsyncStorage.getItem(MAX_COMPLETED_CHALLENGE_DAYS_KEY);
                        const currentMax = parseInt(storedMaxStr || '0', 10);
                        if (completedDuration > currentMax) { await AsyncStorage.multiSet([ [MAX_COMPLETED_CHALLENGE_DAYS_KEY, String(completedDuration)], [CELEBRATE_TIER_COMPLETION_KEY, String(completedDuration)] ]); }
                    } catch (e) { console.error("Error saving max challenge or celebration flag:", e); }
                    const currentDurationIndex = CHALLENGE_DURATIONS.indexOf(loadedDuration);
                    const nextDurationIndex = currentDurationIndex + 1;
                    if (nextDurationIndex < CHALLENGE_DURATIONS.length) {
                        const nextChallengeDuration = CHALLENGE_DURATIONS[nextDurationIndex];
                        setRemainingDays(nextChallengeDuration); setCurrentChallengeDuration(nextChallengeDuration); setLastParticipationDate(todayString);
                        await AsyncStorage.multiSet([ [REMAINING_CHALLENGE_DAYS_KEY, String(nextChallengeDuration)], [LAST_PARTICIPATION_DATE_KEY, todayString], [CURRENT_CHALLENGE_DURATION_KEY, String(nextChallengeDuration)] ]);
                    } else {
                        setRemainingDays(0); setLastParticipationDate(todayString);
                        await AsyncStorage.multiSet([ [REMAINING_CHALLENGE_DAYS_KEY, '0'], [LAST_PARTICIPATION_DATE_KEY, todayString] ]);
                    }
                } else {
                    setRemainingDays(newRemainingDays); setLastParticipationDate(todayString);
                    await AsyncStorage.multiSet([ [REMAINING_CHALLENGE_DAYS_KEY, String(newRemainingDays)], [LAST_PARTICIPATION_DATE_KEY, todayString] ]);
                }
            } else if (currentRemainingDays <= 0 && remainingDays !== 0) { setRemainingDays(0); }
        } catch (error) { console.error("Challenge update fail:", error); }
    }, [remainingDays]);

    useEffect(() => { const runInitialChecks = async () => { await updateChallengeStatus(); }; runInitialChecks(); const subscription = AppState.addEventListener('change', nextAppState => { if (appState.match(/inactive|background/) && nextAppState === 'active') { runInitialChecks(); } setAppState(nextAppState); }); return () => { subscription.remove(); }; }, [appState, updateChallengeStatus]);

    const progressPercentage = useMemo(() => goalCalories > 0 ? (caloriesForDate / goalCalories) * 100 : 0, [caloriesForDate, goalCalories]);
    const clampedProgress = useMemo(() => Math.min(100, Math.max(0, progressPercentage || 0)), [progressPercentage]);
    
    const targetAngle = useMemo(() => clampedProgress * 3.6, [clampedProgress]);
    useEffect(() => { Animated.timing(animatedAngle, { toValue: targetAngle, duration: 1000, useNativeDriver: false }).start(); }, [targetAngle]);
    useEffect(() => { const listenerId = animatedAngle.addListener(({ value }) => { setProgressPathD(value > 0.01 ? describeArc(CENTER_X, CENTER_Y, PATH_RADIUS, 0.01, value) : ''); setDynamicIconStyle(calculateIconPositionOnPath(value > 0.01 ? value : 0)); }); return () => animatedAngle.removeListener(listenerId); }, [animatedAngle]);
    const handleSaveGoal = useCallback(async () => { try { setGoalCalories(tempGoalCalories); await AsyncStorage.setItem(GOAL_KEY, String(tempGoalCalories)); setIsGoalModalVisible(false); } catch (e) { Alert.alert(translation.errorTitle, translation.cannotSaveGoalError); } }, [tempGoalCalories, translation]);

    const stepsAtGoal = useMemo(() => (goalCalories > 0 && CALORIES_PER_STEP > 0) ? (goalCalories / CALORIES_PER_STEP) : Infinity, [goalCalories]);
    const effectiveStepsForDisplay = useMemo(() => Math.min(stepsForDate, stepsAtGoal), [stepsForDate, stepsAtGoal]);

    const { rawMinutes, rawDistance } = useMemo(() => {
        const totalMinutes = effectiveStepsForDisplay / STEPS_PER_MINUTE;
        const distanceKm = (effectiveStepsForDisplay * STEP_LENGTH_METERS) / 1000;
        return { rawMinutes: totalMinutes, rawDistance: distanceKm };
    }, [effectiveStepsForDisplay]);

    const badgeProgressAngle = useMemo(() => { if (remainingDays <= 0 || currentChallengeDuration <= 0) return 359.999; const daysCompleted = currentChallengeDuration - remainingDays; return (daysCompleted / currentChallengeDuration) * 360; }, [remainingDays, currentChallengeDuration]);
    const badgeProgressPathD = useMemo(() => (badgeProgressAngle > 0.1 ? describeArc(BADGE_CENTER_X, BADGE_CENTER_Y, BADGE_PATH_RADIUS, 0.01, badgeProgressAngle) : ''), [badgeProgressAngle]);

    useEffect(() => {
        if (selectedPeriod !== 'day') return;
        const fetchDataForChart = async () => {
            setIsLoading(true);
            const weekStart = getStartOfWeek(new Date(), startOfWeekDay);
            const dates = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
            const history = await getStoredStepsHistory();
            const todayString = getDateString(new Date());
            const steps = dates.map((date) => {
                const dateString = getDateString(date);
                if (dateString === todayString) { return pedometerSteps; }
                return history[dateString] || 0;
            });
            setWeeklyChartData({ dates, steps });
            setIsLoading(false);
        };
        fetchDataForChart();
    }, [pedometerSteps, language, getStoredStepsHistory, selectedPeriod, startOfWeekDay]);
    
    useEffect(() => {
        if (selectedPeriod !== 'week') return;
        setIsWeeklyLoading(true);
        const fetchWeeklyData = async () => {
            const history = await getStoredStepsHistory();
            const currentIsSameWeek = isSameWeek(selectedWeekStart, new Date(), startOfWeekDay);
            setIsCurrentWeek(currentIsSameWeek);
            const data = Array(7).fill(0);
            for (let i = 0; i < 7; i++) {
                const dayDate = addDays(selectedWeekStart, i);
                let stepsForDay = 0;
                if (currentIsSameWeek && isToday(dayDate)) {
                    stepsForDay = pedometerSteps;
                } else {
                    stepsForDay = history[getDateString(dayDate)] || 0;
                }
                data[i] = stepsForDay * CALORIES_PER_STEP;
            }
            setFullWeeklyData(data);
            setIsWeeklyLoading(false);
        };
        fetchWeeklyData();
    }, [selectedPeriod, selectedWeekStart, pedometerSteps, startOfWeekDay, getStoredStepsHistory]);

    useEffect(() => {
        if (selectedPeriod !== 'month') return;
        setIsMonthlyLoading(true);
        const fetchMonthlyData = async () => {
            const history = await getStoredStepsHistory();
            const currentIsSameMonth = selectedMonthStart.getUTCFullYear() === new Date().getFullYear() && selectedMonthStart.getUTCMonth() === new Date().getMonth();
            setIsCurrentMonth(currentIsSameMonth);
            const daysInMonth = getDaysInMonth(selectedMonthStart);
            const data = Array(daysInMonth).fill(0);
            for (let i = 0; i < daysInMonth; i++) {
                const dayDate = new Date(Date.UTC(selectedMonthStart.getUTCFullYear(), selectedMonthStart.getUTCMonth(), i + 1));
                let stepsForDay = 0;
                if (currentIsSameMonth && isToday(dayDate)) {
                    stepsForDay = pedometerSteps;
                } else {
                    stepsForDay = history[getDateString(dayDate)] || 0;
                }
                data[i] = stepsForDay * CALORIES_PER_STEP;
            }
            setMonthlyData(data);
            setIsMonthlyLoading(false);
        };
        fetchMonthlyData();
    }, [selectedPeriod, selectedMonthStart, pedometerSteps, getStoredStepsHistory]);

    const handlePreviousWeek = () => setSelectedWeekStart(prev => addDays(prev, -7));
    const handleNextWeek = () => { if (!isCurrentWeek) setSelectedWeekStart(prev => addDays(prev, 7)); };
    const handlePreviousMonth = () => setSelectedMonthStart(prev => addMonths(prev, -1));
    const handleNextMonth = () => { if (!isCurrentMonth) setSelectedMonthStart(prev => addMonths(prev, 1)); };
    
    return (
        <SafeAreaView style={currentStyles.safeArea}>
            <View style={currentStyles.topBar}>
                <TouchableOpacity ref={titleMenuTriggerRef} style={currentStyles.titleGroup} onPress={openTitleMenu} activeOpacity={0.7} >
                    <Text style={currentStyles.headerTitle}>{translation.caloriesTitle}</Text>
                    <MaterialCommunityIcon name="chevron-down" size={24} color={currentStyles.headerTitle.color} style={{ [I18nManager.isRTL ? 'marginRight' : 'marginLeft']: 5 }} />
                </TouchableOpacity>
            </View>

            <View style={currentStyles.periodSelectorContainer}>
                <TouchableOpacity style={[ currentStyles.periodButton, selectedPeriod === 'day' ? currentStyles.periodButtonSelected : currentStyles.periodButtonInactive ]} onPress={() => setSelectedPeriod('day')}>
                    <Text style={[ currentStyles.periodText, selectedPeriod === 'day' ? currentStyles.periodTextSelected : currentStyles.periodTextInactive ]}>{translation.dayPeriod}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[ currentStyles.periodButton, selectedPeriod === 'week' ? currentStyles.periodButtonSelected : currentStyles.periodButtonInactive ]} onPress={() => setSelectedPeriod('week')}>
                    <Text style={[ currentStyles.periodText, selectedPeriod === 'week' ? currentStyles.periodTextSelected : currentStyles.periodTextInactive ]}>{translation.weekPeriod}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[ currentStyles.periodButton, selectedPeriod === 'month' ? currentStyles.periodButtonSelected : currentStyles.periodButtonInactive ]} onPress={() => setSelectedPeriod('month')}>
                    <Text style={[ currentStyles.periodText, selectedPeriod === 'month' ? currentStyles.periodTextSelected : currentStyles.periodTextInactive ]}>{translation.monthPeriod}</Text>
                </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={currentStyles.scrollViewContent} showsVerticalScrollIndicator={false} key={`${selectedPeriod}-${language}-${isDarkMode}`}>
                {selectedPeriod === 'day' && (
                    <>
                        <View style={currentStyles.mainDisplayArea}>
                             <View style={currentStyles.testButtonsContainer}>
                                <TouchableOpacity style={currentStyles.testButton} onPress={handleAddSteps} disabled={!isToday(currentDate)}>
                                    <Text style={[currentStyles.testButtonText, !isToday(currentDate) && {color: '#BDBDBD'}]}>{translation.addSteps}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={currentStyles.testButton} onPress={handleResetSteps} disabled={!isToday(currentDate)}>
                                    <Text style={[currentStyles.testButtonText, !isToday(currentDate) && {color: '#BDBDBD'}]}>{translation.reset}</Text>
                                </TouchableOpacity>
                            </View>

                    
<View style={currentStyles.dayHeader}>
    {/* السهم الأيسر (لليوم التالي) */}
    <TouchableOpacity onPress={handleNextDay} disabled={isToday(currentDate)}>
        <Ionicons 
            name={"chevron-back-outline"} 
            size={30} 
            style={isToday(currentDate) ? currentStyles.disabledIcon : currentStyles.dayHeaderArrow}
        />
    </TouchableOpacity>
    
    <View><Text style={currentStyles.dayHeaderTitle}>{formatDisplayDate(currentDate)}</Text></View>
    
    {/* السهم الأيمن (لليوم السابق) */}
    <TouchableOpacity onPress={handlePreviousDay}>
        <Ionicons 
            name={"chevron-forward-outline"} 
            size={30} 
            color={currentStyles.dayHeaderArrow.color}
        />
    </TouchableOpacity>
</View>

                            <View style={currentStyles.circle}>
                                <Svg height={SVG_VIEWBOX_SIZE} width={SVG_VIEWBOX_SIZE} viewBox={`0 0 ${SVG_VIEWBOX_SIZE} ${SVG_VIEWBOX_SIZE}`}>
                                    <SvgCircle cx={CENTER_X} cy={CENTER_Y} r={PATH_RADIUS} stroke={currentStyles.circleBackground.stroke} strokeWidth={CIRCLE_BORDER_WIDTH} fill="none" />
                                    <Path d={progressPathD} stroke={currentStyles.circleProgress.stroke} strokeWidth={CIRCLE_BORDER_WIDTH} fill="none" strokeLinecap="round" />
                                </Svg>
                                {clampedProgress < 100 && caloriesForDate > 0 && (
                                    <Animated.View style={dynamicIconStyle}><View style={[currentStyles.movingDot, { borderColor: currentStyles.safeArea.backgroundColor }]} /></Animated.View>
                                )}
                                <View style={currentStyles.circleContentOverlay}>
                                    <MaterialCommunityIcon name="fire" size={currentStyles.mainIcon.size} color={currentStyles.mainIcon.color} />
                                    <Text style={currentStyles.caloriesCount}>{Math.round(displayCalories).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</Text>
                                    <TouchableOpacity onPress={() => setIsGoalModalVisible(true)} style={currentStyles.goalContainerTouchable}>
                                        <View style={currentStyles.goalContainer}>
                                            <MaterialCommunityIcon name="pencil" size={16} color={currentStyles.pencilIcon.color} style={currentStyles.pencilIcon} />
                                            <Text style={currentStyles.goalText}>{translation.goalLabelPrefix} {goalCalories.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} {translation.caloriesUnit}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={currentStyles.statsRow}>
                            <AnimatedStatItem type="steps" value={effectiveStepsForDisplay} unit={translation.stepsUnit} styles={currentStyles} formatter={v => Math.round(v).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}/>
                            <AnimatedStatItem type="time" value={rawMinutes} unit={translation.timeUnit} styles={currentStyles} formatter={v => { const h = Math.floor(v / 60); const m = Math.floor(v % 60); const locale = language === 'ar' ? 'ar-EG' : 'en-US'; return `${h.toLocaleString(locale, { minimumIntegerDigits: 2 })}:${m.toLocaleString(locale, { minimumIntegerDigits: 2 })}`; }}/>
                            <AnimatedStatItem type="distance" value={rawDistance} unit={translation.distanceUnit} styles={currentStyles} formatter={v => v.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                        </View>
                        
                        <TouchableOpacity activeOpacity={0.8} onPress={handleNavigateToAchievements}>
                            <View style={currentStyles.summaryCard}>
                                <View style={currentStyles.badgeContainer}>
                                    <Svg height={BADGE_SVG_SIZE} width={BADGE_SVG_SIZE} viewBox={`0 0 ${BADGE_SVG_SIZE} ${BADGE_SVG_SIZE}`}>
                                        <SvgCircle cx={BADGE_CENTER_X} cy={BADGE_CENTER_Y} r={BADGE_PATH_RADIUS} stroke={currentStyles.badgeBackgroundCircle.stroke} strokeWidth={BADGE_CIRCLE_BORDER_WIDTH} fill="none" />
                                        <Path d={badgeProgressPathD} stroke={currentStyles.badgeProgressCircle.stroke} strokeWidth={BADGE_CIRCLE_BORDER_WIDTH} fill="none" strokeLinecap="round" />
                                    </Svg>
                                    <View style={currentStyles.badgeTextContainer}>
                                        <Text style={currentStyles.badgeText}>{remainingDays > 0 ? `${remainingDays.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}${translation.challengeDaySuffix}` : '✓'}</Text>
                                    </View>
                                </View>
                                <View style={currentStyles.summaryTextContainer}>
                                    <Text style={currentStyles.summaryMainText}>{`${currentChallengeDuration.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${translation.challengePrefix}`}</Text>
                                    <Text style={currentStyles.summarySubText}>{remainingDays > 0 ? `${remainingDays.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${remainingDays === 1 ? translation.challengeRemainingSingular : translation.challengeRemainingPlural}` : translation.challengeCompleted}</Text>
                                </View>
                                <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={24} color={currentStyles.summaryChevron.color} />
                            </View>
                        </TouchableOpacity>

                        {isLoading ? ( <ActivityIndicator size="large" color={currentStyles.activityIndicator.color} style={{ marginTop: 20 }} /> ) : (
                            <View style={currentStyles.chartPageContainer}>
                                <Text style={currentStyles.chartPageTitle}>{translation.weeklyStatsTitle}</Text>
                                <ActivityChart 
                                    data={weeklyChartData.steps.map(s => Math.min(s * CALORIES_PER_STEP, goalCalories))}
                                    goal={goalCalories} 
                                    styles={currentStyles} 
                                    language={language} 
                                    dayNames={translation.dayNamesShort} 
                                />
                            </View>
                        )}
                    </>
                )}

                {selectedPeriod === 'week' && (
                    isWeeklyLoading ? <ActivityIndicator size="large" color={currentStyles.activityIndicator.color} style={{marginTop: 50}} /> : 
                    <WeeklyCalories 
                        weeklyData={fullWeeklyData} 
                        goalCalories={goalCalories} 
                        isCurrentWeek={isCurrentWeek} 
                        formattedDateRange={formatDateRange(selectedWeekStart, getEndOfWeek(selectedWeekStart, startOfWeekDay), language)} 
                        onPreviousWeek={handlePreviousWeek} 
                        onNextWeek={handleNextWeek} 
                        language={language} 
                        isDarkMode={isDarkMode} 
                        translation={translation}
                        styles={currentStyles} 
                    />
                )}

                {selectedPeriod === 'month' && (
                    isMonthlyLoading ? <ActivityIndicator size="large" color={currentStyles.activityIndicator.color} style={{marginTop: 50}} /> : 
                    <MonthlyCalories 
                        monthlyData={monthlyData} 
                        goalCalories={goalCalories} 
                        isCurrentMonth={isCurrentMonth} 
                        formattedMonthRange={new Date(selectedMonthStart).toLocaleDateString(language === 'ar' ? 'ar-EG-u-ca-gregory-nu-arab' : 'en-US-u-ca-gregory', { month: 'long', year: 'numeric', timeZone: 'UTC' })} 
                        onPreviousMonth={handlePreviousMonth} 
                        onNextMonth={handleNextMonth} 
                        language={language} 
                        isDarkMode={isDarkMode} 
                        translation={translation}
                        styles={currentStyles}
                    />
                )}
            </ScrollView>

            <Modal visible={isGoalModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsGoalModalVisible(false)}>
                 <Pressable style={currentStyles.modalOverlay} onPress={() => setIsGoalModalVisible(false)}>
                     <Pressable style={currentStyles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <TouchableOpacity style={currentStyles.closeButton} onPress={() => setIsGoalModalVisible(false)}><Ionicons name="close" size={28} color={currentStyles.modalCloseIcon.color} /></TouchableOpacity>
                         <Text style={currentStyles.modalTitle}>{translation.setTargetTitle}</Text>
                         <ScrollView style={{width: '100%'}}>
                             {GOAL_OPTIONS.map((option) => ( <TouchableOpacity key={option} style={[ currentStyles.goalOptionButton, tempGoalCalories === option && currentStyles.goalOptionButtonSelected ]} onPress={() => setTempGoalCalories(option)} > <Text style={[ currentStyles.goalOptionText, tempGoalCalories === option && currentStyles.goalOptionTextSelected ]}> {option.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} </Text> </TouchableOpacity> ))}
                         </ScrollView>
                          <View style={currentStyles.modalActions}>
                            <TouchableOpacity style={currentStyles.saveButton} onPress={handleSaveGoal}><Text style={currentStyles.saveButtonText}>{translation.save}</Text></TouchableOpacity>
                            <TouchableOpacity style={currentStyles.cancelButton} onPress={() => setIsGoalModalVisible(false)}><Text style={currentStyles.cancelButtonText}>{translation.cancel}</Text></TouchableOpacity>
                        </View>
                     </Pressable>
                 </Pressable>
            </Modal>
            
            <Modal visible={isTitleMenuVisible} transparent={true} animationType="fade" onRequestClose={closeTitleMenu}>
                <Pressable style={currentStyles.menuModalOverlay} onPress={closeTitleMenu}>
                    <View style={[ currentStyles.titleMenuModalContent, { top: titleMenuPosition.top, left: I18nManager.isRTL ? undefined : titleMenuPosition.left, right: I18nManager.isRTL ? titleMenuPosition.right : undefined, } ]}>
                        <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('steps')}><Text style={currentStyles.titleMenuItemText}>{translation.stepsTitle}</Text>{currentScreenName === 'steps' && <MaterialCommunityIcon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}</TouchableOpacity><View style={currentStyles.titleMenuSeparator} />
                        <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('distance')}><Text style={currentStyles.titleMenuItemText}>{translation.distanceTitle}</Text>{currentScreenName === 'distance' && <MaterialCommunityIcon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}</TouchableOpacity><View style={currentStyles.titleMenuSeparator} />
                        <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('calories')}><Text style={currentStyles.titleMenuItemText}>{translation.caloriesTitle}</Text>{currentScreenName === 'calories' && <MaterialCommunityIcon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}</TouchableOpacity><View style={currentStyles.titleMenuSeparator} />
                        <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('activeTime')}><Text style={currentStyles.titleMenuItemText}>{translation.timeTitle}</Text>{currentScreenName === 'activeTime' && <MaterialCommunityIcon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}</TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
};
// ====================================================================================
// ============================== نهاية المكون الرئيسي =================================
// ====================================================================================


// --- الأنماط (Styles) ---
const lightStyles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7FDF9' },
    scrollViewContent: { paddingBottom: 40, paddingHorizontal: 0, flexGrow: 1 },
    topBar: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'flex-start', alignItems: 'center', width: '100%', paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#F7FDF9', },
    titleGroup: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32', },
    testButtonsContainer: { flexDirection: 'row-reverse', justifyContent: 'center', width: '90%', marginBottom: 15, alignSelf: 'center'},
    testButton: { backgroundColor: '#e8f5e9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginHorizontal: 5, elevation: 1, },
    testButtonText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 13, },
    mainDisplayArea: { width: '100%', alignItems: 'center', paddingBottom: 10 },
    dayHeader: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', width: '80%', alignItems: 'center', marginBottom: 20, marginTop: 20, alignSelf: 'center'},
    dayHeaderTitle: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32' },
    dayHeaderArrow: { color: '#2e7d32' },
    disabledIcon: { color: '#a5d6a7' },
    circle: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    circleBackground: { stroke: "#e0f2f1" },
    circleProgress: { stroke: "#4caf50" }, 
    movingDot: { width: MOVING_DOT_SIZE, height: MOVING_DOT_SIZE, borderRadius: MOVING_DOT_SIZE / 2, backgroundColor: '#4caf50', borderWidth: 2, },
    circleContentOverlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    mainIcon: { color: '#388e3c', size: 50 },
    caloriesCount: { fontSize: 60, fontWeight: 'bold', color: '#388e3c', marginTop: 5, fontVariant: ['tabular-nums'] },
    goalContainerTouchable: { paddingVertical: 5 },
    goalContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginTop: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
    goalText: { fontSize: 14, color: '#757575', fontWeight: '500' },
    pencilIcon: { color: '#757575', marginHorizontal: 5 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 25, alignSelf: 'center', paddingHorizontal: 15 },
    statItem: { alignItems: 'center', flex: 1, paddingHorizontal: 5 },
    statIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#e0f2f1', justifyContent: 'center', alignItems: 'center', marginBottom: 8, },
    statIcon: { color: "#4caf50" }, 
    statValue: { fontSize: 20, fontWeight: 'bold', color: '#388e3c', marginTop: 5, fontVariant: ['tabular-nums'] }, 
    statUnit: { fontSize: 14, color: '#757575', marginTop: 2 },
    summaryCard: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 15, padding: 15, width: '92%', marginTop: 30, alignSelf: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, },
    summaryTextContainer: { alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start', flex: 1, marginHorizontal: 12 },
    summaryMainText: { fontSize: 18, fontWeight: 'bold', color: '#424242' },
    summarySubText: { fontSize: 14, color: '#757575', marginTop: 4 },
    summaryChevron: { color: "#bdbdbd" },
    badgeContainer: { width: BADGE_CONTAINER_SIZE, height: BADGE_CONTAINER_SIZE, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    badgeBackgroundCircle: { stroke: "#e0f2f1"},
    badgeProgressCircle: { stroke: "#4caf50" },
    badgeTextContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    badgeText: { fontSize: 18, fontWeight: 'bold', color: '#4caf50', fontVariant: ['tabular-nums'] },
    activityIndicator: { color: '#388e3c' },
    periodSelectorContainer: { flexDirection: 'row-reverse', marginVertical: 10, backgroundColor: '#E8F5E9', borderRadius: 20, overflow: 'hidden', width: '85%', height: 40, alignSelf: 'center' }, 
    periodButton: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 }, 
    periodButtonInactive: { backgroundColor: 'transparent' }, 
    periodButtonSelected: { backgroundColor: '#388e3c', borderRadius: 20 }, 
    periodText: { fontSize: 16, fontWeight: 'bold' }, 
    periodTextInactive: { color: '#388e3c' }, 
    periodTextSelected: { color: '#ffffff' },
    chartPageContainer: { padding: 10, alignItems: 'center', width: '100%', marginTop: 20 },
    chartPageTitle: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32', marginBottom: 20, textAlign: I18nManager.isRTL ? 'right' : 'left', alignSelf: 'stretch', paddingHorizontal: 15 },
    chartPressableArea: { width: '92%', alignSelf: 'center', marginTop: 0, marginBottom: 20 },
    chartContainer: { paddingHorizontal: 5, paddingVertical: 15, backgroundColor: '#FFF', borderRadius: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, flexDirection: 'row-reverse', position: 'relative' },
    yAxisContainer: { width: Y_AXIS_WIDTH, height: BAR_CONTAINER_HEIGHT, justifyContent: 'space-between', alignItems: I18nManager.isRTL ? 'flex-start' : 'flex-end', paddingLeft: I18nManager.isRTL ? 5 : 0, paddingRight: I18nManager.isRTL ? 0 : 5 },
    yAxisLabel: { fontSize: 11, color: '#757575', fontVariant: ['tabular-nums'], textAlign: I18nManager.isRTL ? 'left' : 'right' },
    mainChartArea: { flex: 1, height: BAR_CONTAINER_HEIGHT + X_AXIS_HEIGHT + 10, position: 'relative', marginLeft: I18nManager.isRTL ? 5 : 0, marginRight: I18nManager.isRTL ? 0 : 5 },
    barsContainer: { flexDirection: 'row-reverse', height: BAR_CONTAINER_HEIGHT, alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: BAR_SPACING / 2, zIndex: 2 },
    barWrapper: { width: BAR_WIDTH + BAR_SPACING, alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', overflow: 'visible', marginLeft: -BAR_SPACING, paddingHorizontal: BAR_SPACING / 2 },
    bar: { width: BAR_WIDTH, borderRadius: 4 },
    barDefault: { backgroundColor: '#c8e6c9' },
    barAchievedGoal: { backgroundColor: '#a5d6a7' },
    barToday: { backgroundColor: '#66bb6a' },
    barTodayAchieved: { backgroundColor: '#4caf50' },
    selectedBar: { backgroundColor: '#2E7D32' },
    xAxisContainer: { flexDirection: 'row-reverse', height: X_AXIS_HEIGHT, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: BAR_SPACING / 2, marginTop: 8, borderTopColor: '#eee', borderTopWidth: StyleSheet.hairlineWidth },
    dayLabelWrapper: { width: BAR_WIDTH + BAR_SPACING, alignItems: 'center', marginLeft: -BAR_SPACING, paddingHorizontal: BAR_SPACING / 2 },
    xAxisLabel: { fontSize: 12, color: '#757575' },
    xAxisLabelToday: { color: '#000000', fontWeight: 'bold' },
    tooltipPositioner: { position: 'absolute', alignSelf: 'center', alignItems: 'center', zIndex: 10, elevation: 3, minWidth: 30, overflow: 'visible' },
    tooltipBox: { backgroundColor: '#333333', borderRadius: 5, paddingVertical: 4, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1 },
    tooltipText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', fontVariant: ['tabular-nums'], textAlign: 'center' },
    tooltipArrow: { position: 'absolute', bottom: -TOOLTIP_ARROW_HEIGHT, width: 0, height: 0, borderLeftWidth: TOOLTIP_ARROW_WIDTH / 2, borderRightWidth: TOOLTIP_ARROW_WIDTH / 2, borderTopWidth: TOOLTIP_ARROW_HEIGHT, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#333333', alignSelf: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, paddingTop: 50, width: width * 0.85, maxHeight: '80%', alignItems: 'center', position: 'relative', elevation: 5 },
    modalCloseIcon: { color: "#9e9e9e" },
    closeButton: { position: 'absolute', top: 10, left: I18nManager.isRTL ? undefined : 10, right: I18nManager.isRTL ? 10 : undefined, padding: 8, zIndex: 1 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#424242', marginBottom: 20 },
    goalOptionButton: { backgroundColor: '#f1f8e9', borderRadius: 10, paddingVertical: 12, marginBottom: 10, width: '100%', alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
    goalOptionButtonSelected: { backgroundColor: '#e8f5e9', borderColor: '#4caf50' },
    goalOptionText: { fontSize: 16, color: '#388e3c', fontWeight: '500' },
    goalOptionTextSelected: { color: '#2e7d32', fontWeight: 'bold' },
    modalActions: { width: '100%', alignItems: 'center', paddingTop: 10, borderTopColor: '#eee', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 10 },
    saveButton: { backgroundColor: '#4caf50', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 10 },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    cancelButton: { backgroundColor: '#f5f5f5', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center' },
    cancelButtonText: { color: '#757575', fontSize: 16, fontWeight: '500' },
    menuModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)' },
    titleMenuModalContent: { position: 'absolute', backgroundColor: 'white', borderRadius: 12, paddingVertical: 8, minWidth: 240, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, },
    menuItemButton: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, width: '100%' },
    titleMenuItemText: { fontSize: 16, color: '#2e7d32', fontWeight: 'bold', textAlign: I18nManager.isRTL ? 'right' : 'left' },
    titleMenuSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e0e0e0', },
});

const darkStyles = StyleSheet.create({
    ...lightStyles,
    safeArea: { ...lightStyles.safeArea, backgroundColor: '#121212' },
    topBar: { ...lightStyles.topBar, backgroundColor: '#121212'},
    headerTitle: { ...lightStyles.headerTitle, color: '#A7FFEB' },
    testButton: { ...lightStyles.testButton, backgroundColor: '#2C2C2C'},
    testButtonText: { ...lightStyles.testButtonText, color: '#80CBC4'},
    dayHeaderTitle: { ...lightStyles.dayHeaderTitle, color: '#80CBC4' },
    dayHeaderArrow: { ...lightStyles.dayHeaderArrow, color: '#80CBC4' },
    disabledIcon: { ...lightStyles.disabledIcon, color: '#004D40' },
    circleBackground: { stroke: "#333333" },
    circleProgress: { stroke: "#80CBC4" },
    movingDot: { ...lightStyles.movingDot, backgroundColor: '#80CBC4'},
    mainIcon: { ...lightStyles.mainIcon, color: '#80CBC4' },
    caloriesCount: { ...lightStyles.caloriesCount, color: '#80CBC4' },
    goalText: { ...lightStyles.goalText, color: '#B0B0B0' },
    pencilIcon: { ...lightStyles.pencilIcon, color: '#B0B0B0' },
    statIconCircle: { ...lightStyles.statIconCircle, backgroundColor: '#2C2C2C' },
    statIcon: { ...lightStyles.statIcon, color: '#80CBC4' },
    statValue: { ...lightStyles.statValue, color: '#E0E0E0' },
    statUnit: { ...lightStyles.statUnit, color: '#B0B0B0' },
    summaryCard: { ...lightStyles.summaryCard, backgroundColor: '#1E1E1E', elevation: 3, shadowOpacity: 0.2, shadowColor: '#000' },
    summaryMainText: { ...lightStyles.summaryMainText, color: '#E0E0E0' },
    summarySubText: { ...lightStyles.summarySubText, color: '#B0B0B0' },
    summaryChevron: { ...lightStyles.summaryChevron, color: "#A0A0A0" },
    badgeBackgroundCircle: { stroke: "#333333" },
    badgeProgressCircle: { stroke: "#80CBC4" },
    badgeText: { ...lightStyles.badgeText, color: '#80CBC4' },
    activityIndicator: { color: '#80CBC4' },
    periodSelectorContainer: { ...lightStyles.periodSelectorContainer, backgroundColor: '#1E1E1E' },
    periodTextInactive: { ...lightStyles.periodTextInactive, color: '#80CBC4' },
    periodButtonSelected: { ...lightStyles.periodButtonSelected, backgroundColor: '#00796B' },
    periodTextSelected: { ...lightStyles.periodTextSelected, color: '#E0E0E0' },
    chartPageTitle: { ...lightStyles.chartPageTitle, color: '#80CBC4' },
    chartContainer: { ...lightStyles.chartContainer, backgroundColor: '#1E1E1E', elevation: 3, shadowOpacity: 0.2, shadowColor: '#000' },
    yAxisLabel: { ...lightStyles.yAxisLabel, color: '#B0B0B0' },
    barDefault: { ...lightStyles.barDefault, backgroundColor: '#004D40' },
    barAchievedGoal: { ...lightStyles.barAchievedGoal, backgroundColor: '#00695C' },
    barToday: { ...lightStyles.barToday, backgroundColor: '#00796B' },
    barTodayAchieved: { ...lightStyles.barTodayAchieved, backgroundColor: '#80CBC4' },
    selectedBar: { ...lightStyles.selectedBar, backgroundColor: '#A7FFEB' },
    xAxisContainer: { ...lightStyles.xAxisContainer, borderTopColor: '#333333' },
    xAxisLabel: { ...lightStyles.xAxisLabel, color: '#B0B0B0' },
    xAxisLabelToday: { ...lightStyles.xAxisLabelToday, color: '#FFFFFF' },
    tooltipBox: { ...lightStyles.tooltipBox, backgroundColor: '#E0E0E0' },
    tooltipText: { ...lightStyles.tooltipText, color: '#121212' },
    tooltipArrow: { ...lightStyles.tooltipArrow, borderTopColor: '#E0E0E0' },
    modalOverlay: { ...lightStyles.modalOverlay, backgroundColor: 'rgba(0, 0, 0, 0.7)' },
    modalContent: { ...lightStyles.modalContent, backgroundColor: '#2C2C2C' },
    modalCloseIcon: { ...lightStyles.modalCloseIcon, color: '#B0B0B0' },
    modalTitle: { ...lightStyles.modalTitle, color: '#E0E0E0' },
    goalOptionButton: { ...lightStyles.goalOptionButton, backgroundColor: '#1E1E1E' },
    goalOptionButtonSelected: { ...lightStyles.goalOptionButtonSelected, backgroundColor: '#333333', borderColor: '#80CBC4' },
    goalOptionText: { ...lightStyles.goalOptionText, color: '#80CBC4' },
    goalOptionTextSelected: { ...lightStyles.goalOptionTextSelected, color: '#A7FFEB' },
    modalActions: { ...lightStyles.modalActions, borderTopColor: '#424242' },
    saveButton: { ...lightStyles.saveButton, backgroundColor: '#00796B' },
    saveButtonText: { ...lightStyles.saveButtonText, color: '#E0E0E0' },
    cancelButton: { ...lightStyles.cancelButton, backgroundColor: '#424242' },
    cancelButtonText: { ...lightStyles.cancelButtonText, color: '#B0B0B0' },
    menuModalOverlay: { ...lightStyles.menuModalOverlay, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
    titleMenuModalContent: { ...lightStyles.titleMenuModalContent, backgroundColor: '#2C2C2C' },
    titleMenuItemText: { ...lightStyles.titleMenuItemText, color: '#A7FFEB' },
    titleMenuSeparator: { ...lightStyles.titleMenuSeparator, backgroundColor: '#424242' },
});


export default CaloriesScreen;
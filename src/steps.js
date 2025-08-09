import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView,
    Platform, Animated, Modal, Pressable, I18nManager, Alert, AppState, ActivityIndicator, Image, useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Circle as SvgCircle, Path } from 'react-native-svg';
import { Pedometer } from 'expo-sensors';

import WeeklySteps from './weeklysteps';
import MonthlySteps from './Monthlysteps';

const { width, height } = Dimensions.get('window');
// ... (All constants are correct and don't need changes)
const CIRCLE_SIZE = width * 0.60;
const CIRCLE_BORDER_WIDTH = 15;
const ICON_SIZE = 22;
const _BASE_RUNNER_ICON_SIZE = 55;
const _BASE_STEPS_COUNT_MARGIN_TOP = -5;
const RUNNER_ICON_SIZE = 75;
const SVG_VIEWBOX_SIZE = CIRCLE_SIZE;
const PATH_RADIUS = (CIRCLE_SIZE / 2) - (CIRCLE_BORDER_WIDTH / 2);
const CENTER_X = SVG_VIEWBOX_SIZE / 2;
const CENTER_Y = SVG_VIEWBOX_SIZE / 2;
const STEPS_PER_MINUTE = 100;
const CALORIES_PER_STEP = 0.04;
const STEP_LENGTH_METERS = 0.762;
const CHART_HEIGHT = 150;
const BAR_CONTAINER_HEIGHT = CHART_HEIGHT;
const X_AXIS_HEIGHT = 30;
const Y_AXIS_WIDTH = 45;
const BAR_WIDTH = 12;
const BAR_SPACING = 18;
const TOOLTIP_ARROW_HEIGHT = 6;
const TOOLTIP_ARROW_WIDTH = 12;
const TOOLTIP_OFFSET = 5;
const BADGE_CONTAINER_SIZE = 60;
const BADGE_SVG_SIZE = BADGE_CONTAINER_SIZE;
const BADGE_CIRCLE_BORDER_WIDTH = 5;
const BADGE_PATH_RADIUS = (BADGE_SVG_SIZE / 2) - (BADGE_CIRCLE_BORDER_WIDTH / 2);
const BADGE_CENTER_X = BADGE_SVG_SIZE / 2;
const BADGE_CENTER_Y = BADGE_SVG_SIZE / 2;
const CHALLENGE_DURATIONS = [7, 14, 30, 60, 100, 180, 270, 360];
const INITIAL_CHALLENGE_DURATION = CHALLENGE_DURATIONS[0];
const LAST_PARTICIPATION_DATE_KEY = '@StepsChallenge:lastParticipationDate';
const REMAINING_CHALLENGE_DAYS_KEY = '@StepsChallenge:remainingDays';
const CURRENT_CHALLENGE_DURATION_KEY = '@StepsChallenge:currentDuration';
const GOAL_OPTIONS = [ 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 12000, 15000, 18000, 20000, 25000, 30000, 40000, 50000 ];
const DEFAULT_GOAL = 5000;
const MENU_VERTICAL_OFFSET = 5;
const MENU_ARROW_WIDTH = 14;
const MENU_ARROW_HEIGHT = 8;
const STEP_ANIMATION_DURATION = 400;
const RUNNER_STOP_DELAY = 800;
const DAILY_STEPS_HISTORY_KEY = '@Steps:DailyHistory';
const TOTAL_ACCUMULATED_STEPS_KEY = '@Steps:TotalAccumulatedSteps';
const CONSECUTIVE_GOAL_DAYS_KEY = '@Achievements:consecutiveGoalDays';
const LAST_GOAL_ACHIEVED_DATE_KEY = '@Achievements:lastGoalAchievedDate';
const LAST_STREAK_CHECK_DATE_KEY = '@Achievements:lastStreakCheckDate';
const MAX_COMPLETED_CHALLENGE_DAYS_KEY = '@Achievements:maxCompletedChallengeDays';
const CELEBRATE_TIER_COMPLETION_KEY = '@Achievements:celebrateTierCompletion';
const APP_LANGUAGE_KEY = '@App:language';
const APP_DARK_MODE_KEY = '@App:darkMode';

const translations = {
    ar: { headerTitle: 'الخطوات', today: 'اليوم', week: 'أسبوع', month: 'شهر', stepsTodayLabel: 'اليوم', yesterdayLabel: 'أمس', stepsLabelUnit: 'خطوة', goalLabelPrefix: 'الهدف:', durationUnit: 'ساعة', caloriesUnit: 'كالوري', distanceUnit: 'كم', challengePrefix: 'أيام تحدي', challengeCompleted: 'اكتمل التحدي!', challengeRemainingSingular: 'يوم متبقي', challengeRemainingPlural: 'أيام متبقية', challengeDaySuffix: 'ي', editGoal: 'تعديل الهدف', resetTodaySteps: 'إعادة تعيين خطوات اليوم', addTestSteps: 'اختبار إضافة خطوات (+٥٠٠)', setTargetStepsTitle: 'تحديد عدد الخطوات المستهدفة', save: 'حفظ', cancel: 'إلغاء', resetConfirmationTitle: "إعادة تعيين خطوات اليوم", resetConfirmationMessage: "هل أنت متأكد؟ لا يمكن التراجع.", errorTitle: "خطأ", cannotNavigateError: "لا يمكن الانتقال.", cannotSaveGoalError: "لم نتمكن من حفظ الهدف.", dayNamesShort: ['س', 'أ', 'ن', 'ث', 'ر', 'خ', 'ج'], loadingError: "خطأ في تحميل البيانات", activeTimeUnavailable: "غير متوفر", activeTimeMostlyMorning: "غالباً صباحاً", activeTimeMostlyEvening: "غالباً مساءً", activeTimeScattered: "متفرق", activeTimeNoSignificant: "لا يوجد نشاط بارز", trendStartActive: "بداية نشطة!", trendNoData: "لا يوجد بيانات للمقارنة", trendMoreActive: "نشاط زائد هذا الأسبوع", trendLessActive: "أقل نشاطاً من المعتاد", trendUsualActivity: "مستوى نشاط معتاد", menuMoreButton: "المزيد", pedometerChecking: "يتم التحقق...", pedometerNotAvailable: " عداد الخطى غير متوفر", pedometerPermissionDenied: "لم يتم منح الإذن لعداد الخطى", pedometerError: "خطأ في عداد الخطى", yes: "نعم", no: "لا", average: 'المتوسط', total: 'الإجمالي', vsLast7Days: 'مقارنة بآخر ٧ أيام', vsLast30Days: 'مقارنة بآخر ٣٠ يومًا', trendsLabel: 'الاتجاهات', mostActiveTimeLabel: 'وقت النشاط الأعلى', trendExtraActive: 'نشاط إضافي', minutesUnit: 'دقيقة', timeAM: 'ص', timePM: 'م', distanceDetails: 'المسافة', caloriesDetails: 'السعرات', activeTimeDetails: 'الوقت النشط', weeklySummary: 'ملخص الأسبوع'},
    en: { headerTitle: 'Steps', today: 'Today', week: 'Week', month: 'Month', stepsTodayLabel: 'Today', yesterdayLabel: 'Yesterday', stepsLabelUnit: 'steps', goalLabelPrefix: 'Goal:', durationUnit: 'Hour', caloriesUnit: 'Kcal', distanceUnit: 'Km', challengePrefix: 'Day Challenge', challengeCompleted: 'Challenge Completed!', challengeRemainingSingular: 'day remaining', challengeRemainingPlural: 'days remaining', challengeDaySuffix: 'd', editGoal: 'Edit Goal', resetTodaySteps: 'Reset Today\'s Steps', addTestSteps: 'Test Add Steps (+500)', setTargetStepsTitle: 'Set Target Steps', save: 'Save', cancel: 'Cancel', resetConfirmationTitle: "Reset Today's Steps", resetConfirmationMessage: "Are you sure? This cannot be undone.", errorTitle: "Error", cannotNavigateError: "Cannot navigate.", cannotSaveGoalError: "Could not save goal.", dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], loadingError: "Error loading data", activeTimeUnavailable: "Unavailable", activeTimeMostlyMorning: "Mostly Morning", activeTimeMostlyEvening: "Mostly Evening", activeTimeScattered: "Scattered", activeTimeNoSignificant: "No significant activity", trendStartActive: "Active start!", trendNoData: "No data to compare", trendMoreActive: "More active this week", trendLessActive: "Less active than usual", trendUsualActivity: "Usual activity level", menuMoreButton: "More", pedometerChecking: "Checking...", pedometerNotAvailable: "Pedometer not available", pedometerPermissionDenied: "Pedometer permission denied", pedometerError: "Pedometer error", yes: "Yes", no: "No", average: 'Average', total: 'Total', vsLast7Days: 'vs. Last 7 Days', vsLast30Days: 'vs. Last 30 Days', trendsLabel: 'Trends', mostActiveTimeLabel: 'Most Active Time', trendExtraActive: 'Extra active', minutesUnit: 'min', timeAM: 'AM', timePM: 'PM', distanceDetails: 'Distance', caloriesDetails: 'Calories', activeTimeDetails: 'Active Time', weeklySummary: 'Weekly Summary'}
};
const describeArc = (x, y, radius, startAngleDeg, endAngleDeg) => { const clampedEndAngle = Math.min(endAngleDeg, 359.999); const startAngleRad = ((startAngleDeg - 90) * Math.PI) / 180.0; const endAngleRad = ((clampedEndAngle - 90) * Math.PI) / 180.0; const startX = x + radius * Math.cos(startAngleRad); const startY = y + radius * Math.sin(startAngleRad); const endX = x + radius * Math.cos(endAngleRad); const endY = y + radius * Math.sin(endAngleRad); const largeArcFlag = clampedEndAngle - startAngleDeg <= 180 ? '0' : '1'; const sweepFlag = '1'; const d = [ 'M', startX, startY, 'A', radius, radius, 0, largeArcFlag, sweepFlag, endX, endY ].join(' '); return d; };
const calculateIconPositionOnPath = (angleDegrees) => { const angleRad = (angleDegrees - 90) * (Math.PI / 180); const iconRadius = PATH_RADIUS; const xOffset = iconRadius * Math.cos(angleRad); const yOffset = iconRadius * Math.sin(angleRad); const iconCenterX = (SVG_VIEWBOX_SIZE / 2) + xOffset; const iconCenterY = (SVG_VIEWBOX_SIZE / 2) + yOffset; const top = iconCenterY - (ICON_SIZE / 2); const left = iconCenterX - (ICON_SIZE / 2); return { position: 'absolute', width: ICON_SIZE, height: ICON_SIZE, top, left, zIndex: 10, justifyContent: 'center', alignItems: 'center' }; };
const formatStepsK = (steps, lang = 'ar') => { if (typeof steps !== 'number' || isNaN(steps)) steps = 0; const locale = lang === 'ar' ? 'ar-EG' : 'en-US'; if (lang === 'ar') { if (steps === 0) return '٠'; if (steps >= 1000) { const formattedK = (steps / 1000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); return `${formattedK.replace(/[.,٫]0$/, '')} ألف`; } return steps.toLocaleString(locale); } else { if (steps === 0) return '0'; if (steps >= 1000) { const kValue = steps / 1000; const formattedK = kValue % 1 === 0 ? kValue.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : kValue.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); return `${formattedK}k`; } return steps.toLocaleString(locale); }};
const getDateString = (date) => { if (!date || !(date instanceof Date)) return null; return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10); };
const getYesterdayDateString = () => { const yesterday = new Date(); yesterday.setUTCDate(yesterday.getUTCDate() - 1); return getDateString(yesterday); };
const getStartOfWeek = (date, startOfWeekDay = 6) => { const d = new Date(date); d.setUTCHours(0, 0, 0, 0); const currentUTCDate = d.getUTCDate(); const currentUTCDay = d.getUTCDay(); let diff = currentUTCDay - startOfWeekDay; if (diff < 0) { diff += 7; } d.setUTCDate(currentUTCDate - diff); return d; };
const getEndOfWeek = (date, startOfWeekDay = 6) => { const start = getStartOfWeek(date, startOfWeekDay); const end = new Date(start); end.setUTCDate(start.getUTCDate() + 6); end.setUTCHours(23, 59, 59, 999); return end; };
const addDays = (date, days) => { const result = new Date(date); result.setUTCDate(result.getUTCDate() + days); return result; };
const isSameWeek = (date1, date2, startOfWeekDay = 6) => { if (!date1 || !date2) return false; const start1 = getStartOfWeek(date1, startOfWeekDay); const start2 = getStartOfWeek(date2, startOfWeekDay); return start1.getTime() === start2.getTime(); };
const getStartOfMonth = (date) => { const d = new Date(date); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(1); return d; };
const getEndOfMonth = (date) => { const d = new Date(date); const currentMonth = d.getUTCMonth(); d.setUTCFullYear(d.getUTCFullYear(), currentMonth + 1, 0); d.setUTCHours(23, 59, 59, 999); return d; };
const getDaysInMonth = (date) => { const year = date.getUTCFullYear(); const month = date.getUTCMonth(); return new Date(Date.UTC(year, month + 1, 0)).getUTCDate(); };
const addMonths = (date, months) => { const d = new Date(date); const targetDay = d.getUTCDate(); d.setUTCMonth(d.getUTCMonth() + months); if (d.getUTCDate() < targetDay) { d.setUTCDate(0); } return d; };

const formatDateRange = (startDate, endDate, lang = 'ar') => {
    if (!startDate || !endDate) return "";
    const locale = lang === 'ar' ? 'ar-EG-u-ca-gregory-nu-arab' : 'en-US-u-ca-gregory';
    const options = { month: 'long', day: 'numeric', timeZone: 'UTC' };
    const startStr = startDate.toLocaleDateString(locale, options);
    const endStr = endDate.toLocaleDateString(locale, options);
    return `${startStr} - ${endStr}`;
};

const getWeekDataFromHistory = async (startDate, currentDaySteps, historyGetter) => { const history = await historyGetter(); const weekData = Array(7).fill(0); const todayStr = getDateString(new Date()); for (let i = 0; i < 7; i++) { const dayDate = addDays(startDate, i); const dayDateString = getDateString(dayDate); weekData[i] = (dayDateString === todayStr) ? (currentDaySteps >= 0 ? currentDaySteps : 0) : (history[dayDateString] || 0); } return weekData; };
const getMonthDataFromHistory = async (startDate, currentDaySteps, historyGetter) => { const history = await historyGetter(); const daysInMonth = getDaysInMonth(startDate); const monthData = Array(daysInMonth).fill(0); const todayStr = getDateString(new Date()); const startMonth = startDate.getUTCMonth(); const startYear = startDate.getUTCFullYear(); for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth++) { const dayDate = new Date(Date.UTC(startYear, startMonth, dayOfMonth)); const dayDateString = getDateString(dayDate); monthData[dayOfMonth - 1] = (dayDateString === todayStr) ? (currentDaySteps >= 0 ? currentDaySteps : 0) : (history[dayDateString] || 0); } return monthData; };
const isToday = (someDate) => { const today = new Date(); return someDate.getUTCDate() === today.getUTCDate() && someDate.getUTCMonth() === today.getUTCMonth() && someDate.getUTCFullYear() === today.getUTCFullYear(); };
const isYesterday = (someDate) => { const today = new Date(); const yesterday = new Date(today); yesterday.setUTCDate(yesterday.getUTCDate() - 1); return someDate.getUTCDate() === yesterday.getUTCDate() && someDate.getUTCMonth() === yesterday.getUTCMonth() && someDate.getUTCFullYear() === yesterday.getUTCFullYear(); };
const formatDisplayDate = (date, lang, translation) => { if (isToday(date)) return translation.stepsTodayLabel; if (isYesterday(date)) return translation.yesterdayLabel; const locale = lang === 'ar' ? 'ar-EG-u-ca-gregory-nu-arab' : 'en-US-u-ca-gregory'; const options = { day: 'numeric', month: 'long', timeZone: 'UTC' }; return date.toLocaleDateString(locale, options); };
const StatItem = React.memo(({ type, value, unit, isDarkMode, styles }) => { const lightModeIcons = { time: 'clock-outline', calories: 'fire', distance: 'map-marker' }; const darkModeIcons = { time: 'clock-outline', calories: 'fire', distance: 'map-marker-path' }; if (isDarkMode) { return ( <View style={styles.statItem}> <Icon name={darkModeIcons[type]} size={28} color={styles.statIcon.color} /> <Text style={styles.statValue}>{value}</Text> <Text style={styles.statUnit}>{unit}</Text> </View> ); } else { return ( <View style={styles.statItem}> <View style={styles.statItemCircle}> <Icon name={lightModeIcons[type]} size={28} color={styles.statIconInCircle.color} /> </View> <Text style={styles.statValue}>{value}</Text> <Text style={styles.statUnit}>{unit}</Text> </View> ); } });
const DailyStepsChart = React.memo(({ dailySteps = [], goalSteps = DEFAULT_GOAL, styles, language, dayNames }) => { const todayJSDay = useMemo(() => new Date().getDay(), []); const [tooltipVisible, setTooltipVisible] = useState(false); const [selectedBarIndex, setSelectedBarIndex] = useState(null); const [selectedBarValue, setSelectedBarValue] = useState(null); const yAxisLabelsToDisplay = useMemo(() => { const actualData = Array.isArray(dailySteps) ? dailySteps : []; const dataMax = Math.max(...actualData.map(s => s || 0), 0); const practicalMax = Math.max(dataMax, goalSteps, 1); let roundedMax = Math.ceil(practicalMax / 1000) * 1000; if (roundedMax < 1000) roundedMax = 1000; let stepSize = Math.max(250, Math.ceil(roundedMax / 4 / 250) * 250); let finalMax = stepSize * 4; if (finalMax < practicalMax) { stepSize = Math.ceil(practicalMax / 4 / 500) * 500; finalMax = stepSize * 4; if (finalMax < practicalMax) { finalMax = Math.ceil(practicalMax / stepSize) * stepSize; } } finalMax = Math.max(finalMax, 1); const labels = []; for (let i = 0; i <= 4; i++) { labels.push(Math.round(i * (finalMax / 4))); } return [0, ...new Set(labels.filter(l => l >= 0))].sort((a, b) => a - b).slice(0, 5); }, [dailySteps, goalSteps]); const scaleMaxValue = Math.max(yAxisLabelsToDisplay[yAxisLabelsToDisplay.length - 1] || 1, 1); const scale = BAR_CONTAINER_HEIGHT / scaleMaxValue; const handleBarPress = useCallback((displayIndex, value) => { const numericValue = value || 0; if (tooltipVisible && selectedBarIndex === displayIndex) { setTooltipVisible(false); setSelectedBarIndex(null); setSelectedBarValue(null); } else if (numericValue > 0) { setTooltipVisible(true); setSelectedBarIndex(displayIndex); setSelectedBarValue(numericValue); } else { setTooltipVisible(false); setSelectedBarIndex(null); setSelectedBarValue(null); } }, [tooltipVisible, selectedBarIndex]); const handleOutsidePress = useCallback(() => { if (tooltipVisible) { setTooltipVisible(false); setSelectedBarIndex(null); setSelectedBarValue(null); } }, [tooltipVisible]); const displayTodayIndex = useMemo(() => { const localTodayJSDay = new Date().getDay(); if (language === 'ar') { return localTodayJSDay === 6 ? 0 : localTodayJSDay + 1; } return localTodayJSDay; }, [language]);
return ( <Pressable onPress={handleOutsidePress} style={styles.chartPressableArea}><View style={styles.chartContainer}><View style={styles.yAxisContainer}>{yAxisLabelsToDisplay.slice().reverse().map((labelValue) => (<Text key={`y-${labelValue}`} style={styles.yAxisLabel}>{formatStepsK(labelValue, language)}</Text>))}</View><View style={styles.mainChartArea}><View style={styles.barsContainer}>{dayNames.map((_, displayIndex) => { const dataIndex = displayIndex; const steps = (Array.isArray(dailySteps) && dailySteps.length === 7) ? (dailySteps[dataIndex] || 0) : 0; const barHeight = Math.min(BAR_CONTAINER_HEIGHT, Math.max(0, steps * scale)); const isTodayLabel = displayIndex === displayTodayIndex; const achievedGoal = steps >= goalSteps; const isSelected = selectedBarIndex === displayIndex; return ( <View key={`bar-${displayIndex}`} style={styles.barWrapper}><Pressable onPress={(e) => { e.stopPropagation(); handleBarPress(displayIndex, steps); }} hitSlop={5} disabled={steps <= 0}><View style={[styles.bar, { height: barHeight }, isTodayLabel ? (achievedGoal ? styles.barTodayAchieved : styles.barToday) : (achievedGoal ? styles.barAchievedGoal : styles.barDefault), isSelected && steps > 0 && styles.selectedBar]}/></Pressable>{tooltipVisible && isSelected && selectedBarValue !== null && ( <View style={[styles.tooltipPositioner, { bottom: barHeight + TOOLTIP_OFFSET }]}><View style={styles.tooltipBox}><Text style={styles.tooltipText}>{selectedBarValue.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</Text></View><View style={styles.tooltipArrow} /></View> )}</View> ); })}</View><View style={styles.xAxisContainer}>{dayNames.map((day, displayIndex) => (<View key={`x-${displayIndex}`} style={styles.dayLabelWrapper}><Text style={[ styles.xAxisLabel, displayIndex === displayTodayIndex && styles.xAxisLabelToday ]}>{day}</Text></View>))}</View></View></View></Pressable> ); });

const StepsScreen = (props) => {
    const { 
        navigation, 
        onNavigate,
        currentScreenName,
        onNavigateToAchievements, 
        language: initialLanguage, 
        isDarkMode: initialIsDarkMode, 
    } = props;

    const systemColorScheme = useColorScheme();
    const [language, setLanguage] = useState(initialLanguage || (I18nManager.isRTL ? 'ar' : 'en'));
    const [isDarkMode, setIsDarkMode] = useState(initialIsDarkMode === undefined ? systemColorScheme === 'dark' : initialIsDarkMode);
    const translation = useMemo(() => translations[language] || translations.ar, [language]);
    const currentStyles = useMemo(() => isDarkMode ? darkStyles : lightStyles, [isDarkMode]);
    const [selectedPeriod, setSelectedPeriod] = useState('day');
    const [currentSteps, setCurrentSteps] = useState(0); 
    const [displaySteps, setDisplaySteps] = useState(0); 
    const [goalSteps, setGoalSteps] = useState(DEFAULT_GOAL);
    const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
    const [tempGoal, setTempGoal] = useState(DEFAULT_GOAL);
    const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
    const [currentChallengeDuration, setCurrentChallengeDuration] = useState(INITIAL_CHALLENGE_DURATION);
    const [remainingDays, setRemainingDays] = useState(INITIAL_CHALLENGE_DURATION);
    const [lastParticipationDate, setLastParticipationDate] = useState(null);
    const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: undefined, right: undefined, triggerX: 0, triggerWidth: 0 });
    const [isTitleMenuVisible, setIsTitleMenuVisible] = useState(false);
    const [titleMenuPosition, setTitleMenuPosition] = useState({ top: 0, left: undefined, right: undefined, triggerX: 0, triggerWidth: 0 });
    const [appState, setAppState] = useState(AppState.currentState);
    const startOfWeekDay = useMemo(() => language === 'ar' ? 6 : 0, [language]);
    const [selectedWeekStart, setSelectedWeekStart] = useState(() => getStartOfWeek(new Date(), startOfWeekDay));
    const [actualWeekData, setActualWeekData] = useState(Array(7).fill(0));
    const [previousWeekForComparisonData, setPreviousWeekForComparisonData] = useState(Array(7).fill(0));
    const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);
    const [selectedMonthStart, setSelectedMonthStart] = useState(() => getStartOfMonth(new Date()));
    const [currentMonthData, setCurrentMonthData] = useState([]);
    const [previousMonthDataForComparison, setPreviousMonthDataForComparison] = useState([]);
    const [formattedMonthRange, setFormattedMonthRange] = useState("");
    const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);
    const [isCurrentMonthSelected, setIsCurrentMonthSelected] = useState(true);
    const [isCurrentWeekSelected, setIsCurrentWeekSelected] = useState(true);
    const [dailyChartData, setDailyChartData] = useState(Array(7).fill(0));
    const animatedAngle = useRef(new Animated.Value(0)).current;
    const animationFrameRef = useRef(null);
    const pedometerSubscription = useRef(null);
    const displayStepsRef = useRef(displaySteps);
    const menuButtonRef = useRef(null);
    const titleMenuTriggerRef = useRef(null);
    const isAnimatingSteps = useRef(false);
    const stopSteppingTimer = useRef(null);
    const goalStepsRef = useRef(goalSteps);
    const [isStepping, setIsStepping] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [stepsForSelectedDay, setStepsForSelectedDay] = useState(0); 
    const isViewingToday = useMemo(() => isToday(selectedDate), [selectedDate]);
    const [isRunnerVisuallyStopped, setIsRunnerVisuallyStopped] = useState(false);

    useEffect(() => { displayStepsRef.current = displaySteps; }, [displaySteps]);
    useEffect(() => { goalStepsRef.current = goalSteps; }, [goalSteps]);
    useEffect(() => { setSelectedWeekStart(getStartOfWeek(new Date(), startOfWeekDay)); }, [startOfWeekDay]);
    useEffect(() => { const loadAppPreferences = async () => { let activeLanguage = language; let activeIsDarkMode = isDarkMode; let rtlNeedsUpdate = false; try { const storedLang = await AsyncStorage.getItem(APP_LANGUAGE_KEY); if (storedLang && ['ar', 'en'].includes(storedLang)) { if (activeLanguage !== storedLang) { activeLanguage = storedLang; rtlNeedsUpdate = true; } } const storedDarkMode = await AsyncStorage.getItem(APP_DARK_MODE_KEY); const newDarkModeSetting = storedDarkMode !== null ? storedDarkMode === 'true' : systemColorScheme === 'dark'; if (activeIsDarkMode !== newDarkModeSetting) activeIsDarkMode = newDarkModeSetting; } catch (e) { console.error("Prefs load fail:", e); const systemDark = systemColorScheme === 'dark'; if(activeIsDarkMode !== systemDark) activeIsDarkMode = systemDark; } finally { if (language !== activeLanguage) setLanguage(activeLanguage); if (isDarkMode !== activeIsDarkMode) setIsDarkMode(activeIsDarkMode); const currentRTL = I18nManager.isRTL; const targetRTL = activeLanguage === 'ar'; if (rtlNeedsUpdate && currentRTL !== targetRTL) { I18nManager.forceRTL(targetRTL); Alert.alert("Language Change", "Restart app for full effect."); } } }; if (initialLanguage === undefined || initialIsDarkMode === undefined) { loadAppPreferences(); } }, [systemColorScheme, language, isDarkMode, initialLanguage, initialIsDarkMode]);
    const saveDailySteps = useCallback(async (date, steps) => { const dateString = getDateString(date); if (!dateString || typeof steps !== 'number' || isNaN(steps)) return; try { const storedHistory = await AsyncStorage.getItem(DAILY_STEPS_HISTORY_KEY); let history = {}; if (storedHistory) { try { history = JSON.parse(storedHistory); if (typeof history !== 'object' || history === null) history = {}; } catch (e) { console.error("Parse history fail:", e); history = {}; } } const stepsToSave = Math.max(0, Math.round(steps)); const oldStepsForDay = history[dateString] || 0; let currentTotal = 0; try { const storedTotalStr = await AsyncStorage.getItem(TOTAL_ACCUMULATED_STEPS_KEY); if (storedTotalStr) currentTotal = parseInt(storedTotalStr, 10) || 0; } catch (e) { console.error("Read total fail:", e); currentTotal = 0; } const difference = stepsToSave - oldStepsForDay; const newTotal = Math.max(0, currentTotal + difference); if (history[dateString] !== stepsToSave) { history[dateString] = stepsToSave; await AsyncStorage.multiSet([ [DAILY_STEPS_HISTORY_KEY, JSON.stringify(history)], [TOTAL_ACCUMULATED_STEPS_KEY, String(newTotal)] ]); } else { if (String(currentTotal) !== String(newTotal)) await AsyncStorage.setItem(TOTAL_ACCUMULATED_STEPS_KEY, String(newTotal)); } } catch (error) { console.error("Save daily/total fail:", error); } }, []);
    const getStoredStepsHistory = useCallback(async () => { try { const storedHistory = await AsyncStorage.getItem(DAILY_STEPS_HISTORY_KEY); if (storedHistory) { try { const history = JSON.parse(storedHistory); if (typeof history === 'object' && history !== null) { Object.keys(history).forEach(key => { if (typeof history[key] !== 'number' || isNaN(history[key])) { console.warn(`Invalid step count for ${key}, set 0.`); history[key] = 0; } }); return history; } else return {}; } catch (e) { console.error("Parse history retrieval fail:", e); return {}; } } return {}; } catch (error) { console.error("Get history fail:", error); return {}; } }, []);
    const progressPercentage = useMemo(() => goalSteps > 0 ? (stepsForSelectedDay / goalSteps) * 100 : 0, [stepsForSelectedDay, goalSteps]);
    const clampedProgress = useMemo(() => Math.min(100, Math.max(0, progressPercentage || 0)), [progressPercentage]);
    const targetAngle = useMemo(() => { if (stepsForSelectedDay <= 0 || goalSteps <= 0) return 0; const angle = clampedProgress * 3.6; return Math.min(359.999, Math.max(0.01, angle || 0)); }, [stepsForSelectedDay, goalSteps, clampedProgress]);
    const [dynamicIconStyle, setDynamicIconStyle] = useState(() => calculateIconPositionOnPath(0));
    const [progressPathD, setProgressPathD] = useState('');
    const { formattedDuration, formattedCalories, formattedDistance } = useMemo(() => { const steps = displaySteps; const totalMinutes = steps > 0 ? steps / STEPS_PER_MINUTE : 0; const hours = Math.floor(totalMinutes / 60); const minutes = Math.floor(totalMinutes % 60); const locale = language === 'ar' ? 'ar-EG' : 'en-US'; const duration = `${hours.toLocaleString(locale, { minimumIntegerDigits: 2 })}:${minutes.toLocaleString(locale, { minimumIntegerDigits: 2 })}`; const totalCalories = steps * CALORIES_PER_STEP; const calories = totalCalories.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); const distanceMeters = steps * STEP_LENGTH_METERS; const distanceKm = distanceMeters / 1000; const distance = distanceKm.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return { formattedDuration: duration, formattedCalories: calories, formattedDistance: distance }; }, [displaySteps, language]);
    const badgeProgressAngle = useMemo(() => { if (remainingDays <= 0 || currentChallengeDuration <= 0) return 359.999; if (remainingDays >= currentChallengeDuration) return 0; const daysCompleted = currentChallengeDuration - remainingDays; const angle = (daysCompleted / currentChallengeDuration) * 360; return Math.min(359.999, Math.max(0.01, angle || 0)); }, [remainingDays, currentChallengeDuration]);
    const badgeProgressPathD = useMemo(() => (badgeProgressAngle > 0.1 ? describeArc(BADGE_CENTER_X, BADGE_CENTER_Y, BADGE_PATH_RADIUS, 0.01, badgeProgressAngle) : ''), [badgeProgressAngle]);
    const isCurrentWeekSelectedMemo = useMemo(() => isSameWeek(selectedWeekStart, new Date(), startOfWeekDay), [selectedWeekStart, startOfWeekDay]);
    useEffect(() => { setIsCurrentWeekSelected(isCurrentWeekSelectedMemo); }, [isCurrentWeekSelectedMemo]);
    const formattedWeekRange = useMemo(() => {
        const endDate = getEndOfWeek(selectedWeekStart, startOfWeekDay);
        return formatDateRange(selectedWeekStart, endDate, language);
    }, [selectedWeekStart, startOfWeekDay, language]);
    
    const weeklyStats = useMemo(() => {
        const calculateWeekMetrics = (weekDataArray) => {
            if (!Array.isArray(weekDataArray) || weekDataArray.length === 0) {
                return { total: 0, avg: 0, rawMinutes: 0, rawCals: 0, rawDist: 0, durationStr: language === 'ar' ? "٠٠:٠٠" : "00:00", calsStr: language === 'ar' ? "٠٫٠" : "0.0", distStr: language === 'ar' ? "٠٫٠٠" : "0.00" };
            }
            const locale = language === 'ar' ? 'ar-EG' : 'en-US';
            const validDaysData = weekDataArray.filter(s => typeof s === 'number' && s >= 0);
            const total = validDaysData.reduce((sum, steps) => sum + steps, 0);
            const daysWithData = validDaysData.length;
            const avg = daysWithData > 0 ? total / daysWithData : 0;
            const rawMinutes = total / STEPS_PER_MINUTE;
            const rawCals = total * CALORIES_PER_STEP;
            const rawDist = total * STEP_LENGTH_METERS / 1000;
            const hours = Math.floor(rawMinutes / 60);
            const mins = Math.floor(rawMinutes % 60);
            const durationStr = `${hours.toLocaleString(locale, { minimumIntegerDigits: 2 })}:${mins.toLocaleString(locale, { minimumIntegerDigits: 2 })}`;
            const calsStr = rawCals.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            const distStr = rawDist.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return { total, avg: Math.round(avg), rawMinutes, rawCals, rawDist, durationStr, calsStr, distStr };
        };

        const currentMetrics = calculateWeekMetrics(actualWeekData);
        const previousMetrics = calculateWeekMetrics(previousWeekForComparisonData);
        const locale = language === 'ar' ? 'ar-EG' : 'en-US';

        const stepsDiff = currentMetrics.total - previousMetrics.total;
        const stepsChangeStr = `${stepsDiff >= 0 ? '+' : '−'}${Math.abs(stepsDiff).toLocaleString(locale)}`;

        return {
            totalSteps: currentMetrics.total,
            averageSteps: currentMetrics.avg,
            weeklyDuration: currentMetrics.durationStr,
            weeklyCalories: currentMetrics.calsStr,
            weeklyDistance: currentMetrics.distStr,
            stepsChange: stepsChangeStr,
        };
    }, [actualWeekData, previousWeekForComparisonData, language]);
    
    useEffect(() => { const animation = Animated.timing(animatedAngle, { toValue: targetAngle, duration: 800, useNativeDriver: false, }); animation.start(({ finished }) => { if (finished && stepsForSelectedDay >= goalStepsRef.current) { setIsRunnerVisuallyStopped(true); } }); return () => { animation.stop(); }; }, [targetAngle, animatedAngle, stepsForSelectedDay]);
    useEffect(() => { if (stepsForSelectedDay < goalSteps) { setIsRunnerVisuallyStopped(false); } }, [stepsForSelectedDay, goalSteps]);
    useEffect(() => { const listenerId = animatedAngle.addListener(({ value }) => { setDynamicIconStyle(calculateIconPositionOnPath(value)); setProgressPathD(value > 0.01 ? describeArc(CENTER_X, CENTER_Y, PATH_RADIUS, 0.01, value) : ''); }); return () => animatedAngle.removeListener(listenerId); }, [animatedAngle]);
    const animateDisplaySteps = useCallback((startValue, endValue) => { if (startValue === endValue || isNaN(startValue) || isNaN(endValue)) { setDisplaySteps(endValue); isAnimatingSteps.current = false; return; } if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; } isAnimatingSteps.current = true; const startTime = Date.now(); const step = () => { const now = Date.now(); const timePassed = now - startTime; const progress = Math.min(timePassed / STEP_ANIMATION_DURATION, 1); const currentDisplay = Math.round(startValue + (endValue - startValue) * progress); if (isAnimatingSteps.current) setDisplaySteps(currentDisplay); if (progress < 1 && isAnimatingSteps.current) animationFrameRef.current = requestAnimationFrame(step); else { if (isAnimatingSteps.current && progress >= 1) setDisplaySteps(endValue); animationFrameRef.current = null; isAnimatingSteps.current = false; } }; animationFrameRef.current = requestAnimationFrame(step); }, []);
    useEffect(() => { const fetchStepsForDate = async () => { if (isViewingToday) { setStepsForSelectedDay(currentSteps); } else { const history = await getStoredStepsHistory(); const dateString = getDateString(selectedDate); setStepsForSelectedDay(history[dateString] || 0); } }; fetchStepsForDate(); }, [selectedDate, currentSteps, getStoredStepsHistory, isViewingToday]);
    
    useEffect(() => {
        const stepsToAnimateTo = Math.min(stepsForSelectedDay, goalSteps);
        animateDisplaySteps(displaySteps, stepsToAnimateTo);
    }, [stepsForSelectedDay, goalSteps, animateDisplaySteps]);

    useEffect(() => {
        if (selectedPeriod === 'day') {
            const newWeekStart = getStartOfWeek(selectedDate, startOfWeekDay);
            if (newWeekStart.getTime() !== selectedWeekStart.getTime()) {
                setSelectedWeekStart(newWeekStart);
            }
        }
    }, [selectedDate, startOfWeekDay, selectedWeekStart, selectedPeriod]);
    
    useEffect(() => { let isMounted = true; let initialLoad = true; const subscribe = async () => { try { const available = await Pedometer.isAvailableAsync(); if (!isMounted) return; setIsPedometerAvailable(String(available)); if (available) { const { status } = await Pedometer.requestPermissionsAsync(); if (!isMounted) return; if (status === 'granted') { const end = new Date(); const start = new Date(); start.setHours(0, 0, 0, 0); try { const pastStepCountResult = await Pedometer.getStepCountAsync(start, end); if (isMounted && pastStepCountResult) { const initialSteps = pastStepCountResult.steps || 0; setCurrentSteps(initialSteps); if (initialLoad) { await saveDailySteps(new Date(), initialSteps); initialLoad = false; } } } catch (error) { if (isMounted) { console.error("Pedometer getStepCountAsync error:", error); setCurrentSteps(0); await saveDailySteps(new Date(), 0); } } pedometerSubscription.current = Pedometer.watchStepCount(result => { if (!isMounted) return; const fetchTodaysSteps = async () => { const endOfDay = new Date(); const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0); try { const stepCount = await Pedometer.getStepCountAsync(startOfDay, endOfDay); if (isMounted && stepCount) { const newTotalStepsToday = stepCount.steps || 0; setCurrentSteps(prevActualSteps => { if (newTotalStepsToday !== prevActualSteps) { saveDailySteps(new Date(), newTotalStepsToday); if (newTotalStepsToday > prevActualSteps) { setIsStepping(true); if (stopSteppingTimer.current) clearTimeout(stopSteppingTimer.current); stopSteppingTimer.current = setTimeout(() => { if (isMounted) setIsStepping(false); }, RUNNER_STOP_DELAY); } } return newTotalStepsToday; }); } } catch (err) { if (isMounted) console.error("Error fetching step count in watch:", err); } }; fetchTodaysSteps(); }); } else { if (isMounted) { console.warn("Pedometer permission not granted."); setIsPedometerAvailable('permission_denied'); setCurrentSteps(0); await saveDailySteps(new Date(), 0); } } } else { if (isMounted) { console.warn("Pedometer not available."); setIsPedometerAvailable('not_available'); setCurrentSteps(0); await saveDailySteps(new Date(), 0); } } } catch (error) { if (isMounted) { console.error("Pedometer setup error:", error); setIsPedometerAvailable('error'); setCurrentSteps(0); await saveDailySteps(new Date(), 0); } } }; subscribe(); return () => { isMounted = false; if (pedometerSubscription.current) { pedometerSubscription.current.remove(); pedometerSubscription.current = null; } if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; isAnimatingSteps.current = false; } if(stopSteppingTimer.current) clearTimeout(stopSteppingTimer.current); setIsStepping(false); }; }, [saveDailySteps, animateDisplaySteps]);
    const updateConsecutiveDaysStreak = useCallback(async () => { const todayString = getDateString(new Date()); const yesterdayString = getYesterdayDateString(); try { const lastCheckDate = await AsyncStorage.getItem(LAST_STREAK_CHECK_DATE_KEY); if (lastCheckDate === todayString) return; const history = await getStoredStepsHistory(); const storedStreakStr = await AsyncStorage.getItem(CONSECUTIVE_GOAL_DAYS_KEY); const storedLastAchievedDate = await AsyncStorage.getItem(LAST_GOAL_ACHIEVED_DATE_KEY); const currentGoal = goalStepsRef.current; const yesterdaySteps = history[yesterdayString] || 0; let currentStreak = parseInt(storedStreakStr || '0', 10); if (isNaN(currentStreak)) currentStreak = 0; let lastAchievedDate = storedLastAchievedDate || null; let newStreak = currentStreak; let newLastAchievedDate = lastAchievedDate; const yesterdayGoalMet = yesterdaySteps >= currentGoal; if (yesterdayGoalMet) { const dayBeforeYesterday = new Date(); dayBeforeYesterday.setUTCDate(dayBeforeYesterday.getUTCDate() - 2); const dayBeforeYesterdayString = getDateString(dayBeforeYesterday); if (lastAchievedDate === dayBeforeYesterdayString) newStreak = currentStreak + 1; else newStreak = 1; newLastAchievedDate = yesterdayString; } else { if (currentStreak > 0) newStreak = 0; } await AsyncStorage.multiSet([ [CONSECUTIVE_GOAL_DAYS_KEY, String(newStreak)], [LAST_GOAL_ACHIEVED_DATE_KEY, newLastAchievedDate || ''], [LAST_STREAK_CHECK_DATE_KEY, todayString] ]); } catch (error) { console.error("Streak update fail:", error); } }, [getStoredStepsHistory]);
    const updateChallengeStatus = useCallback(async () => { const todayString = getDateString(new Date()); if (!todayString) return; try { const [ storedRemainingDaysStr, storedLastParticipationDate, storedChallengeDurationStr ] = await Promise.all([ AsyncStorage.getItem(REMAINING_CHALLENGE_DAYS_KEY), AsyncStorage.getItem(LAST_PARTICIPATION_DATE_KEY), AsyncStorage.getItem(CURRENT_CHALLENGE_DURATION_KEY) ]); let loadedDuration = INITIAL_CHALLENGE_DURATION; if (storedChallengeDurationStr !== null) { const parsedDuration = parseInt(storedChallengeDurationStr, 10); if (!isNaN(parsedDuration) && CHALLENGE_DURATIONS.includes(parsedDuration)) { loadedDuration = parsedDuration; } } setCurrentChallengeDuration(loadedDuration); let currentRemainingDays = loadedDuration; if (storedRemainingDaysStr !== null) { const parsedDays = parseInt(storedRemainingDaysStr, 10); if (!isNaN(parsedDays) && parsedDays >= 0 && parsedDays <= loadedDuration) { currentRemainingDays = parsedDays; } } setRemainingDays(currentRemainingDays); if (storedLastParticipationDate) { setLastParticipationDate(storedLastParticipationDate); } if (todayString !== storedLastParticipationDate && currentRemainingDays > 0) { const newRemainingDays = currentRemainingDays - 1; if (newRemainingDays <= 0) { try { const completedDuration = loadedDuration; const storedMaxStr = await AsyncStorage.getItem(MAX_COMPLETED_CHALLENGE_DAYS_KEY); const currentMax = parseInt(storedMaxStr || '0', 10); if (completedDuration > currentMax) { await AsyncStorage.multiSet([ [MAX_COMPLETED_CHALLENGE_DAYS_KEY, String(completedDuration)], [CELEBRATE_TIER_COMPLETION_KEY, String(completedDuration)] ]); } } catch (e) { console.error("Error saving max challenge or celebration flag:", e); } const currentDurationIndex = CHALLENGE_DURATIONS.indexOf(loadedDuration); const nextDurationIndex = currentDurationIndex + 1; if (nextDurationIndex < CHALLENGE_DURATIONS.length) { const nextChallengeDuration = CHALLENGE_DURATIONS[nextDurationIndex]; setRemainingDays(nextChallengeDuration); setCurrentChallengeDuration(nextChallengeDuration); setLastParticipationDate(todayString); await AsyncStorage.multiSet([ [REMAINING_CHALLENGE_DAYS_KEY, String(nextChallengeDuration)], [LAST_PARTICIPATION_DATE_KEY, todayString], [CURRENT_CHALLENGE_DURATION_KEY, String(nextChallengeDuration)] ]); } else { setRemainingDays(0); setLastParticipationDate(todayString); await AsyncStorage.multiSet([ [REMAINING_CHALLENGE_DAYS_KEY, '0'], [LAST_PARTICIPATION_DATE_KEY, todayString] ]); } } else { setRemainingDays(newRemainingDays); setLastParticipationDate(todayString); await AsyncStorage.multiSet([ [REMAINING_CHALLENGE_DAYS_KEY, String(newRemainingDays)], [LAST_PARTICIPATION_DATE_KEY, todayString] ]); } } else if (currentRemainingDays <= 0 && remainingDays !== 0) { setRemainingDays(0); } } catch (error) { console.error("Challenge update fail:", error); } }, []);
    useEffect(() => { const runInitialChecks = async () => { await updateChallengeStatus(); await updateConsecutiveDaysStreak(); }; runInitialChecks(); const subscription = AppState.addEventListener('change', nextAppState => { if (appState.match(/inactive|background/) && nextAppState === 'active') { runInitialChecks(); const fetchStepsOnForeground = async () => { const end = new Date(), start = new Date(); start.setHours(0,0,0,0); try { const available = await Pedometer.isAvailableAsync(); const { status } = await Pedometer.getPermissionsAsync(); if (available && status === 'granted') { const count = await Pedometer.getStepCountAsync(start, end); if (count) { const stepsVal = count.steps || 0; setCurrentSteps(stepsVal); } } } catch(e) { console.error("Error steps foreground:", e); } }; fetchStepsOnForeground(); } setAppState(nextAppState); }); return () => { subscription.remove(); }; }, [appState, updateChallengeStatus, updateConsecutiveDaysStreak]);
    useEffect(() => { const loadGoal = async () => { let loadedGoal = DEFAULT_GOAL; try { const storedGoal = await AsyncStorage.getItem('@Steps:goal'); if (storedGoal) { const parsedGoal = parseInt(storedGoal, 10); if (!isNaN(parsedGoal) && GOAL_OPTIONS.includes(parsedGoal)) loadedGoal = parsedGoal; else await AsyncStorage.setItem('@Steps:goal', String(DEFAULT_GOAL)); } setGoalSteps(loadedGoal); setTempGoal(loadedGoal); } catch(e) { console.error("Goal load fail:", e); setGoalSteps(DEFAULT_GOAL); setTempGoal(DEFAULT_GOAL); } }; loadGoal(); }, []);
    
    useEffect(() => { 
        if (selectedPeriod === 'day' || selectedPeriod === 'week') { 
            const fetchWeeklyData = async () => { 
                setIsWeeklyLoading(true); 
                try { 
                    const stepsForTodayInView = isCurrentWeekSelected ? currentSteps : 0; 
                    const currentDisplayWeekStart = getStartOfWeek(selectedWeekStart, startOfWeekDay); 
                    const displayedWeekPromise = getWeekDataFromHistory(currentDisplayWeekStart, stepsForTodayInView, getStoredStepsHistory); 
                    const comparisonWeekStartDate = addDays(currentDisplayWeekStart, -7); 
                    const comparisonWeekPromise = getWeekDataFromHistory(comparisonWeekStartDate, 0, getStoredStepsHistory); 
                    const [displayedData, comparisonData] = await Promise.all([displayedWeekPromise, comparisonWeekPromise]); 
                    setActualWeekData(displayedData); 
                    setPreviousWeekForComparisonData(comparisonData); 
                    if (selectedPeriod === 'day') setDailyChartData(displayedData); 
                } catch (error) { 
                    console.error("Weekly data fail:", error); 
                    setActualWeekData(Array(7).fill(0)); 
                    setPreviousWeekForComparisonData(Array(7).fill(0)); 
                    if (selectedPeriod === 'day') setDailyChartData(Array(7).fill(0));
                } finally { 
                    setIsWeeklyLoading(false); 
                } 
            }; 
            fetchWeeklyData(); 
        } 
    }, [selectedWeekStart, currentSteps, selectedPeriod, getStoredStepsHistory, isCurrentWeekSelected, startOfWeekDay]);
    
    useEffect(() => { if (selectedPeriod === 'month') { const fetchMonthlyData = async () => { setIsMonthlyLoading(true); try { const currentMonthStartDate = selectedMonthStart; const previousMonthStartDate = addMonths(currentMonthStartDate, -1); const endOfCurrentMonth = getEndOfMonth(currentMonthStartDate); const today = new Date(); const isActualCurrentMonth = currentMonthStartDate.getUTCFullYear() === today.getFullYear() && currentMonthStartDate.getUTCMonth() === today.getMonth(); setIsCurrentMonthSelected(isActualCurrentMonth); const stepsForTodayInView = isActualCurrentMonth ? currentSteps : 0; const monthDataPromise = getMonthDataFromHistory(currentMonthStartDate, stepsForTodayInView, getStoredStepsHistory); const prevMonthDataPromise = getMonthDataFromHistory(previousMonthStartDate, 0, getStoredStepsHistory); const [monthData, prevMonthData] = await Promise.all([monthDataPromise, prevMonthDataPromise]); setCurrentMonthData(monthData); setPreviousMonthDataForComparison(prevMonthData); setFormattedMonthRange(formatDateRange(currentMonthStartDate, endOfCurrentMonth, language)); } catch (error) { console.error("Monthly data fail:", error); setCurrentMonthData([]); setPreviousMonthDataForComparison([]); setFormattedMonthRange(translation.loadingError); } finally { setIsMonthlyLoading(false); } }; fetchMonthlyData(); } }, [selectedMonthStart, currentSteps, selectedPeriod, getStoredStepsHistory, language, translation.loadingError]);
    
    const closeMenuModal = useCallback(() => setIsMenuModalVisible(false), []);
    const closeTitleMenu = useCallback(() => setIsTitleMenuVisible(false), []);
    const resetSteps = useCallback(async () => { Alert.alert( translation.resetConfirmationTitle, translation.resetConfirmationMessage, [ { text: translation.cancel, style: "cancel" }, { text: translation.resetTodaySteps, style: "destructive", onPress: async () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); isAnimatingSteps.current = false; animatedAngle.stopAnimation(); if (stopSteppingTimer.current) clearTimeout(stopSteppingTimer.current); setIsStepping(false); setCurrentSteps(0); setStepsForSelectedDay(0); setDisplaySteps(0); animatedAngle.setValue(0); setProgressPathD(''); setDynamicIconStyle(calculateIconPositionOnPath(0)); await saveDailySteps(new Date(), 0); if(isCurrentWeekSelected && (selectedPeriod === 'day' || selectedPeriod === 'week')) setSelectedWeekStart(prev => new Date(prev.getTime())); if(isCurrentMonthSelected && selectedPeriod === 'month') setSelectedMonthStart(prev => new Date(prev.getTime())); closeMenuModal(); } } ] ); }, [animatedAngle, isCurrentWeekSelected, isCurrentMonthSelected, selectedPeriod, closeMenuModal, saveDailySteps, translation]);
    const addStepsTest = useCallback(() => { const increment = 500; const nextActualSteps = currentSteps + increment; setCurrentSteps(nextActualSteps); saveDailySteps(new Date(), nextActualSteps); setIsStepping(true); if (stopSteppingTimer.current) clearTimeout(stopSteppingTimer.current); stopSteppingTimer.current = setTimeout(() => { setIsStepping(false); }, RUNNER_STOP_DELAY); closeMenuModal(); }, [currentSteps, saveDailySteps, closeMenuModal]);
    const openGoalModal = useCallback(() => { setTempGoal(goalSteps); setIsMenuModalVisible(false); setIsGoalModalVisible(true); }, [goalSteps]);
    const handleSaveGoal = useCallback(async () => { try { const newGoal = tempGoal; setGoalSteps(newGoal); await AsyncStorage.setItem('@Steps:goal', String(newGoal)); setIsGoalModalVisible(false); } catch (e) { console.error("Goal save fail:", e); Alert.alert(translation.errorTitle, translation.cannotSaveGoalError); } }, [tempGoal, translation]);
    const handleCancelGoal = useCallback(() => { setIsGoalModalVisible(false); }, []);
    const openMenuModal = useCallback(() => { if (menuButtonRef.current) { menuButtonRef.current.measure((fx, fy, w, h, px, py) => { const top = py + h + MENU_VERTICAL_OFFSET; const positionStyle = I18nManager.isRTL ? { top, right: width - (px + w), left: undefined } : { top, left: px, right: undefined }; setMenuPosition({ ...positionStyle, triggerX: px, triggerWidth: w }); setIsMenuModalVisible(true); }); } }, [width]);
    const openTitleMenu = useCallback(() => { if (titleMenuTriggerRef.current) { titleMenuTriggerRef.current.measure((fx, fy, w, h, px, py) => { const top = py + h + MENU_VERTICAL_OFFSET; const positionStyle = I18nManager.isRTL ? { top, right: width - (px + w), left: undefined } : { top, left: px, right: undefined }; setTitleMenuPosition({ ...positionStyle, triggerX: px, triggerWidth: w }); setIsTitleMenuVisible(true); }); } }, [width]);
    const navigateTo = (screenName) => {
        closeTitleMenu();
        if (onNavigate && typeof onNavigate === 'function') {
            onNavigate(screenName);
        } else {
            Alert.alert(translation.errorTitle, translation.cannotNavigateError);
            console.error("The 'onNavigate' prop is missing or is not a function. Cannot navigate to", screenName);
        }
    };
    
    const handlePreviousDay = useCallback(() => { setSelectedDate(prevDate => addDays(prevDate, -1)); }, []);
    const handleNextDay = useCallback(() => { if (!isViewingToday) { setSelectedDate(prevDate => addDays(prevDate, 1)); } }, [isViewingToday]);
    const handlePreviousWeek = useCallback(() => { setSelectedWeekStart(prev => addDays(prev, -7)); }, []);
    const handleNextWeek = useCallback(() => { if (!isCurrentWeekSelected) setSelectedWeekStart(prev => addDays(prev, 7)); }, [isCurrentWeekSelected]);
    const handlePreviousMonth = useCallback(() => { setSelectedMonthStart(prev => addMonths(prev, -1)); }, []);
    const handleNextMonth = useCallback(() => { if (!isCurrentMonthSelected) setSelectedMonthStart(prev => addMonths(prev, 1)); }, [isCurrentMonthSelected]);
    const navigateToAchievements = useCallback(() => {
        if (onNavigateToAchievements && typeof onNavigateToAchievements === 'function') {
            onNavigateToAchievements(currentSteps);
        } else {
            console.error('[StepsScreen] Cannot navigate: onNavigateToAchievements is not a function or is undefined.');
            Alert.alert(translation.errorTitle, translation.cannotNavigateError);
        }
    }, [onNavigateToAchievements, currentSteps, translation]);
    
    const runnerImageSource = (isStepping && isViewingToday && !isRunnerVisuallyStopped) ? require('./assets/walking.gif') : require('./assets/walking.png');
    const chartDayNamesForDayTab = useMemo(() => { return language === 'ar' ? ['س', 'خ', 'ر', 'ث', 'ن', 'أ', 'ج'].reverse() : ['S', 'M', 'T', 'W', 'T', 'F', 'S']; }, [language]);
    const dayLabel = useMemo(() => formatDisplayDate(selectedDate, language, translation), [selectedDate, language, translation]);

    const dailyChartDataForDisplay = useMemo(() => {
        if (!Array.isArray(dailyChartData)) return [];
        return dailyChartData.map(steps => Math.min(steps || 0, goalSteps));
    }, [dailyChartData, goalSteps]);

    return (
        <SafeAreaView style={currentStyles.safeArea}>
             <View style={currentStyles.topBar}>
                <TouchableOpacity ref={titleMenuTriggerRef} style={currentStyles.titleGroup} onPress={openTitleMenu} activeOpacity={0.7} >
                    <Text style={currentStyles.headerTitle}>{translation.headerTitle}</Text>
                    <Icon name="chevron-down" size={24} color={currentStyles.headerTitle.color} style={{ [I18nManager.isRTL ? 'marginRight' : 'marginLeft']: 5 }} />
                </TouchableOpacity>
                <TouchableOpacity ref={menuButtonRef} style={currentStyles.moreButton} onPress={openMenuModal} disabled={!isViewingToday} >
                    <Ionicons name="ellipsis-vertical" size={28} color={isViewingToday ? currentStyles.moreButtonIcon.color : currentStyles.moreButtonIconDisabled.color} />
                </TouchableOpacity>
             </View>
             <View style={currentStyles.periodSelectorContainer}><TouchableOpacity style={[ currentStyles.periodButton, selectedPeriod === 'day' ? currentStyles.periodButtonSelected : currentStyles.periodButtonInactive ]} onPress={() => setSelectedPeriod('day')}><Text style={[ currentStyles.periodText, selectedPeriod === 'day' ? currentStyles.periodTextSelected : currentStyles.periodTextInactive ]}>{translation.today}</Text></TouchableOpacity><TouchableOpacity style={[ currentStyles.periodButton, selectedPeriod === 'week' ? currentStyles.periodButtonSelected : currentStyles.periodButtonInactive ]} onPress={() => setSelectedPeriod('week')}><Text style={[ currentStyles.periodText, selectedPeriod === 'week' ? currentStyles.periodTextSelected : currentStyles.periodTextInactive ]}>{translation.week}</Text></TouchableOpacity><TouchableOpacity style={[ currentStyles.periodButton, selectedPeriod === 'month' ? currentStyles.periodButtonSelected : currentStyles.periodButtonInactive ]} onPress={() => setSelectedPeriod('month')}><Text style={[ currentStyles.periodText, selectedPeriod === 'month' ? currentStyles.periodTextSelected : currentStyles.periodTextInactive ]}>{translation.month}</Text></TouchableOpacity></View>
             <ScrollView contentContainerStyle={currentStyles.scrollViewContent} showsVerticalScrollIndicator={false} key={`${selectedPeriod}-${language}-${isDarkMode}-${startOfWeekDay}`} >
                 {selectedPeriod === 'day' && (
                     <>
                        <View style={currentStyles.dayHeader}>
                            <TouchableOpacity onPress={handlePreviousDay}>
                                <Ionicons name={I18nManager.isRTL ? "chevron-back-outline" : "chevron-forward-outline"} size={28} color={currentStyles.dayHeaderArrow.color} />
                            </TouchableOpacity>
                            <Text style={currentStyles.dayHeaderText}>{dayLabel}</Text>
                            <TouchableOpacity onPress={handleNextDay} disabled={isViewingToday}>
                                <Ionicons name={I18nManager.isRTL ? "chevron-forward-outline" : "chevron-back-outline"} size={28} color={isViewingToday ? currentStyles.dayHeaderArrowDisabled.color : currentStyles.dayHeaderArrow.color} />
                            </TouchableOpacity>
                        </View>
                        <View style={currentStyles.mainDisplayArea}><View style={currentStyles.circle}><Svg height={SVG_VIEWBOX_SIZE} width={SVG_VIEWBOX_SIZE} viewBox={`0 0 ${SVG_VIEWBOX_SIZE} ${SVG_VIEWBOX_SIZE}`}><SvgCircle cx={CENTER_X} cy={CENTER_Y} r={PATH_RADIUS} stroke={currentStyles.circleBackground.stroke} strokeWidth={CIRCLE_BORDER_WIDTH} fill="none"/><Path d={progressPathD} stroke={currentStyles.circleProgress.stroke} strokeWidth={CIRCLE_BORDER_WIDTH} fill="none" strokeLinecap="round"/></Svg><View style={currentStyles.circleContentOverlay}><Image key={runnerImageSource} source={runnerImageSource} style={currentStyles.runnerImageStyle} /><Text style={currentStyles.stepsCount}>{displaySteps.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</Text><Text style={currentStyles.stepsLabel}>{translation.stepsLabelUnit}</Text><TouchableOpacity onPress={openGoalModal} style={currentStyles.goalContainerTouchable} activeOpacity={0.7}><View style={currentStyles.goalContainer}><Text style={currentStyles.goalText}>{translation.goalLabelPrefix} {goalSteps.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</Text><Icon name="pencil-outline" size={14} color={currentStyles.pencilIcon.color} style={currentStyles.pencilIcon} /></View></TouchableOpacity></View>{clampedProgress < 100 && stepsForSelectedDay > 0 && ( <Animated.View style={dynamicIconStyle}><View style={[currentStyles.movingDot, {borderColor: currentStyles.safeArea.backgroundColor}]} /></Animated.View> )}</View></View>
                        <View style={currentStyles.statsRow}>
                            <StatItem type="distance" value={formattedDistance} unit={translation.distanceUnit} isDarkMode={isDarkMode} styles={currentStyles} />
                            <StatItem type="calories" value={formattedCalories} unit={translation.caloriesUnit} isDarkMode={isDarkMode} styles={currentStyles} />
                            <StatItem type="time" value={formattedDuration} unit={translation.durationUnit} isDarkMode={isDarkMode} styles={currentStyles} />
                        </View>
                        <TouchableOpacity onPress={navigateToAchievements} activeOpacity={0.8} ><View style={currentStyles.summaryCard}><View style={currentStyles.badgeContainer}><Svg height={BADGE_SVG_SIZE} width={BADGE_SVG_SIZE} viewBox={`0 0 ${BADGE_SVG_SIZE} ${BADGE_SVG_SIZE}`}><SvgCircle cx={BADGE_CENTER_X} cy={BADGE_CENTER_Y} r={BADGE_PATH_RADIUS} stroke={currentStyles.badgeBackgroundCircle.stroke} strokeWidth={BADGE_CIRCLE_BORDER_WIDTH} fill="none" /><Path d={badgeProgressPathD} stroke={currentStyles.badgeProgressCircle.stroke} strokeWidth={BADGE_CIRCLE_BORDER_WIDTH} fill="none" strokeLinecap="round" /></Svg><View style={currentStyles.badgeTextContainer}><Text style={currentStyles.badgeText}>{remainingDays > 0 ? `${remainingDays.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}${translation.challengeDaySuffix}` : '✓'}</Text></View></View><View style={currentStyles.summaryTextContainer}><Text style={currentStyles.summaryMainText}>{`${currentChallengeDuration.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${translation.challengePrefix}`}</Text><Text style={currentStyles.summarySubText}>{remainingDays > 0 ? `${remainingDays.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} ${remainingDays === 1 ? translation.challengeRemainingSingular : translation.challengeRemainingPlural}` : translation.challengeCompleted}</Text></View><Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={24} color={currentStyles.summaryChevron.color} /></View></TouchableOpacity>
                        <DailyStepsChart 
                            dailySteps={dailyChartDataForDisplay} 
                            goalSteps={goalSteps} 
                            styles={currentStyles} 
                            language={language} 
                            dayNames={chartDayNamesForDayTab}
                        />
                     </>
                 )}
                 {selectedPeriod === 'week' && ( 
                    <WeeklySteps 
                        totalSteps={weeklyStats.totalSteps} 
                        averageSteps={weeklyStats.averageSteps} 
                        weeklyDuration={weeklyStats.weeklyDuration} 
                        weeklyDistance={weeklyStats.weeklyDistance} 
                        weeklyCalories={weeklyStats.weeklyCalories} 
                        stepsChange={weeklyStats.stepsChange} 
                        weekData={actualWeekData}
                        previousWeekData={previousWeekForComparisonData}
                        weekStartDate={selectedWeekStart}
                        formattedDateRange={formattedWeekRange} 
                        onPreviousWeek={handlePreviousWeek} 
                        onNextWeek={handleNextWeek} 
                        isCurrentWeek={isCurrentWeekSelected} 
                        targetSteps={goalSteps} 
                        isLoading={isWeeklyLoading} 
                        maxSteps={Math.max(...(actualWeekData || []).map(s => s || 0), goalSteps, 1000) * 1.15} 
                        language={language} 
                        isDarkMode={isDarkMode} 
                        translation={translation} 
                        dayNamesShort={chartDayNamesForDayTab}
                    /> 
                 )}
                 {selectedPeriod === 'month' && ( 
                     <MonthlySteps 
                        key={selectedMonthStart.toISOString()} 
                        monthlyData={currentMonthData} 
                        previousMonthData={previousMonthDataForComparison} 
                        isLoading={isMonthlyLoading} 
                        formattedDateRange={formattedMonthRange}
                        // =================================================================
                        // <<< START OF FIX: Pass the actual month start date object >>>
                        // =================================================================
                        monthStartDate={selectedMonthStart}
                        // =================================================================
                        // <<< END OF FIX >>>
                        // =================================================================
                        onPreviousMonth={handlePreviousMonth} 
                        onNextMonth={handleNextMonth} 
                        isCurrentMonth={isCurrentMonthSelected} 
                        language={language} 
                        isDarkMode={isDarkMode} 
                        translation={translation} 
                        targetSteps={goalSteps}
                     /> 
                 )}
             </ScrollView>
             <Modal visible={isGoalModalVisible} transparent={true} animationType="fade" onRequestClose={handleCancelGoal} ><Pressable style={currentStyles.modalOverlay} onPress={handleCancelGoal}><Pressable style={currentStyles.modalContent} onPress={(e) => e.stopPropagation()}><TouchableOpacity style={currentStyles.closeButtonRTL} onPress={handleCancelGoal}><Ionicons name="close" size={28} color={currentStyles.modalCloseIcon.color} /></TouchableOpacity><Text style={currentStyles.modalTitle}>{translation.setTargetStepsTitle}</Text><ScrollView style={currentStyles.goalListScrollView} showsVerticalScrollIndicator={false}>{GOAL_OPTIONS.map((option) => ( <TouchableOpacity key={option} style={[ currentStyles.goalOptionButton, tempGoal === option && currentStyles.goalOptionButtonSelected ]} onPress={() => setTempGoal(option)} > <Text style={[ currentStyles.goalOptionText, tempGoal === option && currentStyles.goalOptionTextSelected ]}> {option.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} </Text> </TouchableOpacity> ))}</ScrollView><View style={currentStyles.modalActions}><TouchableOpacity style={currentStyles.saveButton} onPress={handleSaveGoal}><Text style={currentStyles.saveButtonText}>{translation.save}</Text></TouchableOpacity><TouchableOpacity style={currentStyles.cancelButton} onPress={handleCancelGoal}><Text style={currentStyles.cancelButtonText}>{translation.cancel}</Text></TouchableOpacity></View></Pressable></Pressable></Modal>
             <Modal visible={isMenuModalVisible} transparent={true} animationType="fade" onRequestClose={closeMenuModal} ><Pressable style={currentStyles.menuModalOverlay} onPress={closeMenuModal}><View style={[ currentStyles.menuArrow, { top: menuPosition.top ? menuPosition.top - MENU_ARROW_HEIGHT : 0, left: I18nManager.isRTL ? undefined : (menuPosition.triggerX + (menuPosition.triggerWidth / 2) - (MENU_ARROW_WIDTH / 2)), right: I18nManager.isRTL ? (width - (menuPosition.triggerX + menuPosition.triggerWidth / 2) - (MENU_ARROW_WIDTH / 2)) : undefined, } ]} /><View style={[ currentStyles.menuModalContent, { top: menuPosition.top, left: I18nManager.isRTL ? undefined : menuPosition.left, right: I18nManager.isRTL ? menuPosition.right : undefined, } ]} ><TouchableOpacity style={currentStyles.menuItemButton} onPress={openGoalModal}><Text style={currentStyles.menuItemText}>{translation.editGoal}</Text></TouchableOpacity><View style={currentStyles.menuSeparator} /><TouchableOpacity style={currentStyles.menuItemButton} onPress={resetSteps}><Text style={[currentStyles.menuItemText, currentStyles.menuItemTextDestructive]}>{translation.resetTodaySteps}</Text></TouchableOpacity><View style={currentStyles.menuSeparator} /><TouchableOpacity style={currentStyles.menuItemButton} onPress={addStepsTest}><Text style={currentStyles.menuItemText}>{translation.addTestSteps}</Text></TouchableOpacity></View></Pressable></Modal>
             <Modal visible={isTitleMenuVisible} transparent={true} animationType="fade" onRequestClose={closeTitleMenu} >
                <Pressable style={currentStyles.menuModalOverlay} onPress={closeTitleMenu}>
                    <View style={[ currentStyles.titleMenuModalContent, { top: titleMenuPosition.top, left: I18nManager.isRTL ? undefined : titleMenuPosition.left, right: I18nManager.isRTL ? titleMenuPosition.right : undefined, } ]}>
                        <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('steps')}>
                            <Text style={currentStyles.titleMenuItemText}>{translation.headerTitle}</Text>
                            {currentScreenName === 'steps' && <Icon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}
                        </TouchableOpacity>
                        <View style={currentStyles.titleMenuSeparator} />
                        <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('distance')}>
                            <Text style={currentStyles.titleMenuItemText}>{translation.distanceDetails}</Text>
                             {currentScreenName === 'distance' && <Icon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}
                        </TouchableOpacity>
                        <View style={currentStyles.titleMenuSeparator} />
                        <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('calories')}>
                            <Text style={currentStyles.titleMenuItemText}>{translation.caloriesDetails}</Text>
                            {currentScreenName === 'calories' && <Icon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}
                        </TouchableOpacity>
                        <View style={currentStyles.titleMenuSeparator} />
                        <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('activeTime')}>
                            <Text style={currentStyles.titleMenuItemText}>{translation.activeTimeDetails}</Text>
                            {currentScreenName === 'activeTime' && <Icon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}
                        </TouchableOpacity>
                    </View>
                </Pressable>
             </Modal>
        </SafeAreaView>
    );
};

const lightStyles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F7FDF9' }, scrollViewContent: { paddingBottom: 40, paddingHorizontal: 0, flexGrow: 1 }, topBar: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 15, paddingHorizontal: 20 }, titleGroup: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center' }, headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32' }, moreButton: { padding: 10 }, moreButtonIcon: { color: '#757575' }, moreButtonIconDisabled: { color: '#DCDCDC' }, periodSelectorContainer: { flexDirection: 'row-reverse', marginVertical: 10, backgroundColor: '#E8F5E9', borderRadius: 20, overflow: 'hidden', width: '85%', height: 40, alignSelf: 'center' }, periodButton: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 }, periodButtonInactive: { backgroundColor: 'transparent' }, periodButtonSelected: { backgroundColor: '#388e3c', borderRadius: 20 }, periodText: { fontSize: 16, fontWeight: 'bold' }, periodTextInactive: { color: '#388e3c' }, periodTextSelected: { color: '#ffffff' }, dayHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', width: '65%', marginVertical: 15, alignSelf: 'center' }, dayHeaderText: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32' }, dayHeaderArrow: { color: '#2e7d32' }, dayHeaderArrowDisabled: { color: '#a5d6a7' }, mainDisplayArea: { width: '100%', alignItems: 'center', marginVertical: 5, paddingBottom: 10, paddingHorizontal: 15 }, circle: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, justifyContent: 'center', alignItems: 'center', position: 'relative' }, circleBackground: { stroke: "#e0f2f1" }, circleProgress: { stroke: "#4caf50" }, circleContentOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 1, padding: CIRCLE_BORDER_WIDTH + 5 }, runnerImageStyle: { width: RUNNER_ICON_SIZE, height: RUNNER_ICON_SIZE, marginBottom: 5, }, stepsCount: { fontSize: 56, fontWeight: 'bold', color: '#388e3c', lineHeight: 64, marginTop: _BASE_STEPS_COUNT_MARGIN_TOP - (RUNNER_ICON_SIZE - _BASE_RUNNER_ICON_SIZE), fontVariant: ['tabular-nums'] }, stepsLabel: { fontSize: 16, color: '#757575', marginTop: 0 }, goalContainerTouchable: { paddingVertical: 5 }, goalContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginTop: 5 }, goalText: { fontSize: 14, color: '#757575', fontVariant: ['tabular-nums'] }, pencilIcon: { color: '#757575', marginLeft: I18nManager.isRTL ? 0 : 4, marginRight: I18nManager.isRTL ? 4 : 0 }, movingDot: { width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2, backgroundColor: '#4caf50', borderWidth: 2 }, statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '90%', marginTop: 25, alignSelf: 'center' }, statItemCircle: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#EDF5F8', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }, statIconInCircle: { color: '#43a047' }, statItem: { alignItems: 'center', flex: 1, paddingHorizontal: 5 }, statIcon: { color: "#4caf50" }, statValue: { fontSize: 20, fontWeight: 'bold', color: '#388e3c', marginTop: 5, fontVariant: ['tabular-nums'] }, statUnit: { fontSize: 14, color: '#757575', marginTop: 2 }, summaryCard: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 15, width: '90%', marginTop: 30, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, alignSelf: 'center' }, summaryTextContainer: { alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start', flex: 1, marginHorizontal: 12 }, summaryMainText: { fontSize: 18, fontWeight: 'bold', color: '#424242', textAlign: I18nManager.isRTL ? 'right' : 'left' }, summarySubText: { fontSize: 14, color: '#757575', textAlign: I18nManager.isRTL ? 'right' : 'left', marginTop: 2 }, summaryChevron: { color: "#bdbdbd" }, badgeContainer: { width: BADGE_CONTAINER_SIZE, height: BADGE_CONTAINER_SIZE, justifyContent: 'center', alignItems: 'center', position: 'relative' }, badgeBackgroundCircle: { stroke: "#e0f2f1"}, badgeProgressCircle: { stroke: "#4caf50" }, badgeTextContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }, badgeText: { fontSize: 16, fontWeight: 'bold', color: '#4caf50', fontVariant: ['tabular-nums'] }, chartPressableArea: { width: '90%', alignSelf: 'center', marginTop: 20, marginBottom: 20 }, chartContainer: { paddingHorizontal: 5, paddingVertical: 15, backgroundColor: '#FFF', borderRadius: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, flexDirection: 'row-reverse', position: 'relative' }, yAxisContainer: { width: Y_AXIS_WIDTH, height: BAR_CONTAINER_HEIGHT, justifyContent: 'space-between', alignItems: I18nManager.isRTL ? 'flex-start' : 'flex-end', paddingLeft: I18nManager.isRTL ? 5 : 0, paddingRight: I18nManager.isRTL ? 0 : 5 }, yAxisLabel: { fontSize: 11, color: '#757575', fontVariant: ['tabular-nums'], textAlign: I18nManager.isRTL ? 'left' : 'right' }, mainChartArea: { flex: 1, height: BAR_CONTAINER_HEIGHT + X_AXIS_HEIGHT + 10, position: 'relative', marginLeft: I18nManager.isRTL ? 5 : 0, marginRight: I18nManager.isRTL ? 0 : 5 }, barsContainer: { flexDirection: 'row-reverse', height: BAR_CONTAINER_HEIGHT, alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: BAR_SPACING / 2, zIndex: 2 }, barWrapper: { width: BAR_WIDTH + BAR_SPACING, alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', overflow: 'visible', marginLeft: -BAR_SPACING, paddingHorizontal: BAR_SPACING / 2 }, bar: { width: BAR_WIDTH, borderRadius: 4 }, barDefault: { backgroundColor: '#c8e6c9' }, barAchievedGoal: { backgroundColor: '#a5d6a7' }, barToday: { backgroundColor: '#66bb6a' }, barTodayAchieved: { backgroundColor: '#4caf50' }, selectedBar: { backgroundColor: '#2E7D32' }, xAxisContainer: { flexDirection: 'row-reverse', height: X_AXIS_HEIGHT, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: BAR_SPACING / 2, marginTop: 8, borderTopColor: '#eee', borderTopWidth: StyleSheet.hairlineWidth }, dayLabelWrapper: { width: BAR_WIDTH + BAR_SPACING, alignItems: 'center', marginLeft: -BAR_SPACING, paddingHorizontal: BAR_SPACING / 2 }, xAxisLabel: { fontSize: 12, color: '#757575' }, xAxisLabelToday: { color: '#000000', fontWeight: 'bold' }, tooltipPositioner: { position: 'absolute', alignSelf: 'center', alignItems: 'center', zIndex: 10, elevation: 3, minWidth: 30, overflow: 'visible' }, tooltipBox: { backgroundColor: '#333333', borderRadius: 5, paddingVertical: 4, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1 }, tooltipText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', fontVariant: ['tabular-nums'], textAlign: 'center' }, tooltipArrow: { position: 'absolute', bottom: -TOOLTIP_ARROW_HEIGHT, width: 0, height: 0, borderLeftWidth: TOOLTIP_ARROW_WIDTH / 2, borderRightWidth: TOOLTIP_ARROW_WIDTH / 2, borderTopWidth: TOOLTIP_ARROW_HEIGHT, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#333333', alignSelf: 'center' }, modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' }, modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, paddingTop: 50, width: width * 0.85, maxHeight: height * 0.75, alignItems: 'center', position: 'relative', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 }, closeButtonRTL: { position: 'absolute', top: 10, left: I18nManager.isRTL ? undefined : 10, right: I18nManager.isRTL ? 10 : undefined, padding: 8, zIndex: 1 }, modalCloseIcon: { color: "#9e9e9e" }, modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#424242', marginBottom: 20, textAlign: 'center' }, goalListScrollView: { width: '100%', marginBottom: 20 }, goalOptionButton: { backgroundColor: '#f1f8e9', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 15, marginBottom: 10, width: '100%', alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' }, goalOptionButtonSelected: { backgroundColor: '#e8f5e9', borderColor: '#4caf50' }, goalOptionText: { fontSize: 16, color: '#388e3c', fontWeight: '500', fontVariant: ['tabular-nums'] }, goalOptionTextSelected: { color: '#2e7d32', fontWeight: 'bold' }, modalActions: { width: '100%', alignItems: 'center', paddingTop: 10, borderTopColor: '#eee', borderTopWidth: StyleSheet.hairlineWidth }, saveButton: { backgroundColor: '#4caf50', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 10 }, saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }, cancelButton: { backgroundColor: '#f5f5f5', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center' }, cancelButtonText: { color: '#757575', fontSize: 16, fontWeight: '500' }, menuModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)' }, menuModalContent: { position: 'absolute', backgroundColor: 'white', borderRadius: 8, paddingVertical: 5, minWidth: 200, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 }, titleMenuModalContent: { position: 'absolute', backgroundColor: '#FFFFFF', borderRadius: 8, paddingVertical: 5, minWidth: 220, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 }, menuItemButton: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, width: '100%' }, titleMenuItemText: { fontSize: 16, color: '#2e7d32', fontWeight: 'bold' }, menuItemText: { fontSize: 16, color: '#333', textAlign: I18nManager.isRTL ? 'right' : 'left' }, menuItemTextDestructive: { color: '#d32f2f' }, menuSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e0e0e0', marginVertical: 5 }, titleMenuSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e0e0e0', marginVertical: 2 }, menuArrow: { position: 'absolute', width: 0, height: 0, borderLeftWidth: MENU_ARROW_WIDTH / 2, borderRightWidth: MENU_ARROW_WIDTH / 2, borderBottomWidth: MENU_ARROW_HEIGHT, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#ffffff', elevation: 6, zIndex: 6 },});
const darkStyles = StyleSheet.create({
    ...lightStyles,
    safeArea: { ...lightStyles.safeArea, backgroundColor: '#121212' },
    headerTitle: { ...lightStyles.headerTitle, color: '#E0E0E0' },
    moreButtonIcon: { color: '#B0B0B0' },
    moreButtonIconDisabled: { color: '#555555'},
    periodSelectorContainer: { ...lightStyles.periodSelectorContainer, backgroundColor: '#2C2C2C' },
    periodTextInactive: { ...lightStyles.periodTextInactive, color: '#80CBC4' },
    periodButtonSelected: { ...lightStyles.periodButtonSelected, backgroundColor: '#00796B' },
    periodTextSelected: { ...lightStyles.periodTextSelected, color: '#FFFFFF' },
    dayHeaderText: { ...lightStyles.dayHeaderText, color: '#80CBC4' },
    dayHeaderArrow: { color: '#80CBC4' },
    dayHeaderArrowDisabled: { color: '#004D40' },
    circleBackground: { stroke: "#333333" },
    circleProgress: { stroke: "#80CBC4" },
    stepsCount: { ...lightStyles.stepsCount, color: '#80CBC4' },
    stepsLabel: { ...lightStyles.stepsLabel, color: '#A0A0A0' },
    goalText: { ...lightStyles.goalText, color: '#A0A0A0' },
    pencilIcon: { ...lightStyles.pencilIcon, color: '#A0A0A0' },
    movingDot: { ...lightStyles.movingDot, backgroundColor: '#80CBC4' },
    statIcon: { color: "#80CBC4" },
    statValue: { ...lightStyles.statValue, color: '#80CBC4' },
    statUnit: { ...lightStyles.statUnit, color: '#A0A0A0' },
    summaryCard: { ...lightStyles.summaryCard, backgroundColor: '#1E1E1E', shadowColor: '#000' },
    summaryMainText: { ...lightStyles.summaryMainText, color: '#E0E0E0' },
    summarySubText: { ...lightStyles.summarySubText, color: '#B0B0B0' },
    summaryChevron: { color: "#A0A0A0" },
    badgeBackgroundCircle: { stroke: "#333333" },
    badgeProgressCircle: { stroke: "#80CBC4" },
    badgeText: { ...lightStyles.badgeText, color: '#80CBC4' },
    chartContainer: { ...lightStyles.chartContainer, backgroundColor: '#1E1E1E', shadowColor: '#000' },
    yAxisLabel: { ...lightStyles.yAxisLabel, color: '#A0A0A0' },
    barDefault: { backgroundColor: '#3E5052' },
    barAchievedGoal: { backgroundColor: '#4A6A64' },
    barToday: { backgroundColor: '#00796B' },
    barTodayAchieved: { backgroundColor: '#80CBC4' },
    selectedBar: { backgroundColor: '#A7FFEB' },
    xAxisContainer: { ...lightStyles.xAxisContainer, borderTopColor: '#333333' },
    xAxisLabel: { ...lightStyles.xAxisLabel, color: '#A0A0A0' },
    xAxisLabelToday: { ...lightStyles.xAxisLabelToday, color: '#FFFFFF' },
    tooltipBox: { ...lightStyles.tooltipBox, backgroundColor: '#E0E0E0' },
    tooltipText: { ...lightStyles.tooltipText, color: '#121212' },
    tooltipArrow: { ...lightStyles.tooltipArrow, borderTopColor: '#E0E0E0' },
    modalContent: { ...lightStyles.modalContent, backgroundColor: '#2C2C2C' },
    modalCloseIcon: { color: "#B0B0B0" },
    modalTitle: { ...lightStyles.modalTitle, color: '#E0E0E0' },
    goalOptionButton: { ...lightStyles.goalOptionButton, backgroundColor: '#3C3C3C', borderColor: 'transparent' },
    goalOptionButtonSelected: { ...lightStyles.goalOptionButtonSelected, backgroundColor: '#4A4A4A', borderColor: '#80CBC4' },
    goalOptionText: { ...lightStyles.goalOptionText, color: '#80CBC4' },
    goalOptionTextSelected: { ...lightStyles.goalOptionTextSelected, color: '#A7FFEB', fontWeight: 'bold' },
    modalActions: { ...lightStyles.modalActions, borderTopColor: '#424242' },
    saveButton: { ...lightStyles.saveButton, backgroundColor: '#00796B' },
    saveButtonText: { ...lightStyles.saveButtonText, color: '#FFFFFF' },
    cancelButton: { ...lightStyles.cancelButton, backgroundColor: '#424242' },
    cancelButtonText: { ...lightStyles.cancelButtonText, color: '#B0B0B0' },
    titleMenuModalContent: { ...lightStyles.titleMenuModalContent, backgroundColor: '#2C2C2C' },
    menuModalContent: { ...lightStyles.menuModalContent, backgroundColor: '#2C2C2C' },
    menuItemText: { ...lightStyles.menuItemText, color: '#E0E0E0' },
    titleMenuItemText: { ...lightStyles.titleMenuItemText, color: '#A7FFEB' },
    menuItemTextDestructive: { ...lightStyles.menuItemTextDestructive, color: '#FF8A80' },
    menuSeparator: { ...lightStyles.menuSeparator, backgroundColor: '#424242' },
    titleMenuSeparator: { ...lightStyles.titleMenuSeparator, backgroundColor: '#424242' },
    menuArrow: { ...lightStyles.menuArrow, borderBottomColor: '#2C2C2C' },
});

export default StepsScreen;
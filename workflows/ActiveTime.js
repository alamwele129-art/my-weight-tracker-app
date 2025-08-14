// ActiveTime.js (الكود الكامل مع تعديل توقف الرسم البياني عند الهدف)
import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  I18nManager,
  Modal,
  AppState,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {Circle, Path} from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons'; 
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { Pedometer } from 'expo-sensors';

import WeeklyTime from './weeklytime';
import MonthlyTime from './monthlytime';

// ... (Translations, Constants, Helper functions... etc remain the same)
// ... كل الكود من هنا حتى المكون الرئيسي يبقى كما هو ...
const translations = {
    ar: {
        headerTitle: "الوقت النشط",
        menuSteps: "الخطوات", menuDistance: "المسافة", menuCalories: "السعرات", menuActiveTime: "الوقت النشط",
        tabDay: "يوم", tabWeek: "الأسبوع", tabMonth: "الشهر",
        displayToday: "اليوم", displayYesterday: "أمس",
        goalPrefix: "الهدف",
        statSteps: "خطوة", statKcal: "كيلوكالوري", statKm: "كم",
        challengePrefix: "أيام تحدي", challengeCompleted: "اكتمل التحدي!", challengeRemainingSingular: "يوم متبقي", challengeRemainingPlural: "أيام متبقية", challengeDaySuffix: "ي",
        weekStatsTitle: "إحصائيات الأسبوع", 
        weekStatsUnit: "(دقائق)", 
        testButton: "اختبار (+5 دق)", 
        resetButton: "إعادة", 
        dayNamesShort: ['س', 'أ', 'ن', 'ث', 'ر', 'خ', 'ج'],
        tooltipUnit: "دقيقة",
        goalModalTitle: "هدف الوقت", goalModalHour: "ساعة", goalModalMinute: "دقيقة",
        saveButton: "حفظ", cancelButton: "إلغاء",
    },
    en: {
        headerTitle: "Active Time",
        menuSteps: "Steps", menuDistance: "Distance", menuCalories: "Calories", menuActiveTime: "Active Time",
        tabDay: "Day", tabWeek: "Week", tabMonth: "Month",
        displayToday: "Today", displayYesterday: "Yesterday",
        goalPrefix: "Goal",
        statSteps: "Step", statKcal: "Kcal", statKm: "Km",
        challengePrefix: "Day Challenge", challengeCompleted: "Challenge Completed!", challengeRemainingSingular: "day remaining", challengeRemainingPlural: "days remaining", challengeDaySuffix: "d",
        weekStatsTitle: "Weekly Stats", 
        weekStatsUnit: "(minutes)", 
        testButton: "Test (+5 min)",
        resetButton: "Reset", 
        dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        tooltipUnit: "minute",
        goalModalTitle: "Time Goal", goalModalHour: "Hour", goalModalMinute: "Minute",
        saveButton: "Save", cancelButton: "Cancel",
    }
};
if (I18nManager.isRTL && !I18nManager.isRTLForced) { I18nManager.forceRTL(true); }
const {width} = Dimensions.get('window');
const chartHeight = 200;
const MENU_VERTICAL_OFFSET = 5;
const CHALLENGE_DURATIONS = [7, 14, 30];
const INITIAL_CHALLENGE_DURATION = CHALLENGE_DURATIONS[0];
const LAST_PARTICIPATION_DATE_KEY = '@StepsChallenge:lastParticipationDate';
const REMAINING_CHALLENGE_DAYS_KEY = '@StepsChallenge:remainingDays';
const CURRENT_CHALLENGE_DURATION_KEY = '@StepsChallenge:currentDuration';
const DAILY_TIME_HISTORY_KEY = '@Time:DailyHistory';
const BADGE_CONTAINER_SIZE = 60; const BADGE_SVG_SIZE = BADGE_CONTAINER_SIZE; const BADGE_CIRCLE_BORDER_WIDTH = 5; const BADGE_PATH_RADIUS = (BADGE_SVG_SIZE / 2) - (BADGE_CIRCLE_BORDER_WIDTH / 2); const BADGE_CENTER_X = BADGE_SVG_SIZE / 2; const BADGE_CENTER_Y = BADGE_SVG_SIZE / 2;
const TOOLTIP_ARROW_HEIGHT = 6; 
const TOOLTIP_OFFSET = 30;
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;
const PICKER_CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const STEPS_PER_MINUTE = 100;
const describeArc = (x, y, radius, startAngleDeg, endAngleDeg) => { const clampedEndAngle = Math.min(endAngleDeg, 359.999); const startAngleRad = ((startAngleDeg - 90) * Math.PI) / 180.0; const endAngleRad = ((clampedEndAngle - 90) * Math.PI) / 180.0; const startX = x + radius * Math.cos(startAngleRad); const startY = y + radius * Math.sin(startAngleRad); const endX = x + radius * Math.cos(endAngleRad); const endY = y + radius * Math.sin(endAngleRad); const largeArcFlag = clampedEndAngle - startAngleDeg <= 180 ? '0' : '1'; const sweepFlag = '1'; const d = [ 'M', startX, startY, 'A', radius, radius, 0, largeArcFlag, sweepFlag, endX, endY ].join(' '); return d; };
const getDateString = (date) => { if (!date || !(date instanceof Date)) return null; return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10); };
const addDays = (date, days) => { const result = new Date(date); result.setUTCDate(result.getUTCDate() + days); return result; };
const getStartOfWeek = (date, startOfWeekDay) => { const d = new Date(date); d.setUTCHours(0, 0, 0, 0); const day = d.getUTCDay(); const diff = (day < startOfWeekDay) ? (day - startOfWeekDay + 7) : (day - startOfWeekDay); d.setDate(d.getDate() - diff); return d; };
const isToday = (someDate) => { const today = new Date(); return someDate.getDate() === today.getDate() && someDate.getMonth() === today.getMonth() && someDate.getFullYear() === today.getFullYear(); };
const isYesterday = (someDate) => { const today = new Date(); const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1); return someDate.getDate() === yesterday.getDate() && someDate.getMonth() === yesterday.getMonth() && someDate.getFullYear() === yesterday.getFullYear(); };
const PickerItem = ({label, currentStyles}) => ( <View style={currentStyles.pickerItemContainer}><Text style={currentStyles.pickerItemText}>{label}</Text></View> );
const GoalSetterModal = ({visible, onClose, onSave, initialHour, initialMinute, currentStyles, translation}) => {
  const hourScrollViewRef = useRef(null); const minuteScrollViewRef = useRef(null); const hourScrollY = useRef(0); const minuteScrollY = useRef(0);
  const hours = Array.from({length: 25}, (_, i) => i); const minutes = Array.from({length: 60}, (_, i) => i);
  useEffect(() => { if (visible) { const initialHourY = initialHour * ITEM_HEIGHT; const initialMinuteY = initialMinute * ITEM_HEIGHT; hourScrollY.current = initialHourY; minuteScrollY.current = initialMinuteY; setTimeout(() => { hourScrollViewRef.current?.scrollTo({ y: initialHourY, animated: false, }); minuteScrollViewRef.current?.scrollTo({ y: initialMinuteY, animated: false, }); }, 10); } }, [visible, initialHour, initialMinute]);
  const handleSave = () => { const hourIndex = Math.round(hourScrollY.current / ITEM_HEIGHT); const minuteIndex = Math.round(minuteScrollY.current / ITEM_HEIGHT); const finalHour = hours[hourIndex] || 0; const finalMinute = minutes[minuteIndex] || 0; onSave(finalHour, finalMinute); onClose(); };
  const onHourScroll = event => { hourScrollY.current = event.nativeEvent.contentOffset.y; }; const onMinuteScroll = event => { minuteScrollY.current = event.nativeEvent.contentOffset.y; };
  const PADDING = (PICKER_CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;
  return ( <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}><View style={currentStyles.modalOverlay}><View style={currentStyles.modalContent}><TouchableOpacity style={currentStyles.closeButton} onPress={onClose}><Text style={currentStyles.closeButtonText}>✕</Text></TouchableOpacity><Text style={currentStyles.modalTitle}>{translation.goalModalTitle}</Text><View style={currentStyles.pickersContainer}><View style={currentStyles.pickerHighlight} pointerEvents="none" /><View style={currentStyles.pickerColumn}><Text style={currentStyles.pickerLabel}>{translation.goalModalMinute}</Text><View style={currentStyles.pickerView}><ScrollView ref={minuteScrollViewRef} showsVerticalScrollIndicator={false} snapToInterval={ITEM_HEIGHT} decelerationRate="fast" onScroll={onMinuteScroll} scrollEventThrottle={16} contentContainerStyle={{paddingVertical: PADDING}}>{minutes.map(minute => (<PickerItem key={`minute-${minute}`} label={minute} currentStyles={currentStyles} />))}</ScrollView></View></View><View style={currentStyles.colonContainer}><Text style={currentStyles.colonText}>:</Text></View><View style={currentStyles.pickerColumn}><Text style={currentStyles.pickerLabel}>{translation.goalModalHour}</Text><View style={currentStyles.pickerView}><ScrollView ref={hourScrollViewRef} showsVerticalScrollIndicator={false} snapToInterval={ITEM_HEIGHT} decelerationRate="fast" onScroll={onHourScroll} scrollEventThrottle={16} contentContainerStyle={{paddingVertical: PADDING}}>{hours.map(hour => (<PickerItem key={`hour-${hour}`} label={hour} currentStyles={currentStyles} />))}</ScrollView></View></View></View><TouchableOpacity style={currentStyles.saveButton} onPress={handleSave}><Text style={currentStyles.saveButtonText}>{translation.saveButton}</Text></TouchableOpacity><TouchableOpacity style={currentStyles.cancelButton} onPress={onClose}><Text style={currentStyles.cancelButtonText}>{translation.cancelButton}</Text></TouchableOpacity></View></View></Modal> );
};
const AnimatedStatItem = ({ value, label, icon, formatter, currentStyles, language }) => {
  const animatedValue = useRef(new Animated.Value(value || 0)).current;
  const [displayValue, setDisplayValue] = useState(() => formatter(value || 0, language));
  useEffect(() => { Animated.timing(animatedValue, { toValue: value || 0, duration: 750, useNativeDriver: false }).start(); }, [value]);
  useEffect(() => { const listenerId = animatedValue.addListener((v) => { setDisplayValue(formatter(v.value, language)); }); return () => { animatedValue.removeListener(listenerId); }; }, [formatter, animatedValue, language]);
  return ( <View style={currentStyles.statItem}><View style={currentStyles.statIconCircle}>{icon}</View><Text style={currentStyles.statValue}>{displayValue}</Text><Text style={currentStyles.statLabel}>{label}</Text></View> );
};
const DayView = ({ goalHour, goalMinute, onOpenGoalModal, activeTimeForDate, currentDate, onNextDay, onPreviousDay, formatDisplayDate, currentStyles, translation, language }) => {
  const CALORIES_PER_STEP = 0.04; const STEP_LENGTH_METERS = 0.762;
  const goalInMinutes = (goalHour * 60) + goalMinute;
  const timeToUseForDisplay = Math.min(activeTimeForDate, goalInMinutes > 0 ? goalInMinutes : Infinity);
  const calculatedSteps = timeToUseForDisplay * STEPS_PER_MINUTE;
  const calculatedCalories = calculatedSteps * CALORIES_PER_STEP;
  const calculatedDistanceKm = (calculatedSteps * STEP_LENGTH_METERS) / 1000;
  const radius = 100; const svgSize = radius * 2 + 20;
  const progress = goalInMinutes > 0 ? (activeTimeForDate / goalInMinutes) * 100 : 0;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const animatedAngle = useRef(new Animated.Value(0)).current;
  const [dynamicDotStyle, setDynamicDotStyle] = useState({});
  const MOVING_DOT_SIZE = 16;
  const targetAngle = clampedProgress > 0 ? clampedProgress * 3.6 : 0;
  const formatTime = (num) => num.toString().padStart(2, '0');
  const animatedTime = useRef(new Animated.Value(timeToUseForDisplay)).current;
  const [displayTimeText, setDisplayTimeText] = useState(() => { const h = Math.floor(timeToUseForDisplay / 60); const m = Math.floor(timeToUseForDisplay % 60); return `${formatTime(h)}:${formatTime(m)}`; });
  const [progressPathD, setProgressPathD] = useState('');
  const calculateDotPosition = useCallback((angleDegrees) => { const angleRad = (angleDegrees - 90) * (Math.PI / 180); const pathRadius = radius; const xOffset = pathRadius * Math.cos(angleRad); const yOffset = pathRadius * Math.sin(angleRad); const iconCenterX = svgSize / 2 + xOffset; const iconCenterY = svgSize / 2 + yOffset; const top = iconCenterY - (MOVING_DOT_SIZE / 2); const left = iconCenterX - (MOVING_DOT_SIZE / 2); return { position: 'absolute', top, left, zIndex: 10 }; }, [radius, svgSize]);
  useEffect(() => { Animated.timing(animatedAngle, { toValue: targetAngle, duration: 800, useNativeDriver: false }).start(); Animated.timing(animatedTime, { toValue: timeToUseForDisplay, duration: 800, useNativeDriver: false }).start(); }, [targetAngle, timeToUseForDisplay]);
  useEffect(() => { const listenerId = animatedAngle.addListener(({ value }) => { setDynamicDotStyle(calculateDotPosition(value)); setProgressPathD(describeArc(radius + 10, radius + 10, radius, 0.01, value)); }); const timeListenerId = animatedTime.addListener(v => { const totalMinutes = v.value; const h = Math.floor(totalMinutes / 60); const m = Math.floor(totalMinutes % 60); setDisplayTimeText(`${formatTime(h)}:${formatTime(m)}`); }); return () => { animatedAngle.removeListener(listenerId); animatedTime.removeListener(timeListenerId); }; }, [animatedAngle, animatedTime, calculateDotPosition, radius]);
  return ( <View style={currentStyles.dayViewContainer}> <View style={currentStyles.dayHeader}> <TouchableOpacity onPress={onPreviousDay}><Icon name="chevron-forward-outline" size={24} color={currentStyles.dayHeaderArrow.color} /></TouchableOpacity> <View style={currentStyles.headerCenter}><Text style={currentStyles.dayHeaderTitle}>{formatDisplayDate(currentDate)}</Text></View> <TouchableOpacity onPress={onNextDay} disabled={isToday(currentDate)}><Icon name="chevron-back-outline" size={24} style={isToday(currentDate) ? currentStyles.disabledIcon : {color: currentStyles.dayHeaderArrow.color}}/></TouchableOpacity> </View> <View style={currentStyles.progressContainer}> <Svg width={svgSize} height={svgSize}> <Circle stroke={currentStyles.progressCircleBackground.stroke} fill="none" cx={radius + 10} cy={radius + 10} r={radius} strokeWidth={12}/> <Path d={progressPathD} stroke={currentStyles.progressCircleForeground.stroke} fill="none" strokeWidth={12} strokeLinecap="round"/> </Svg> {clampedProgress > 0.1 && clampedProgress < 99.9 && (<Animated.View style={[currentStyles.movingDot, dynamicDotStyle]} />)} <View style={currentStyles.progressTextContainer}> <MaterialIcon name="timer" size={28} color={currentStyles.timerIcon.color} /> <Text style={currentStyles.timerText}>{displayTimeText}</Text> <TouchableOpacity style={currentStyles.goalContainer} onPress={onOpenGoalModal}> <Text style={currentStyles.goalText}>{translation.goalPrefix}: {formatTime(goalHour)}:{formatTime(goalMinute)}</Text> <MaterialIcon name="edit" size={16} color={currentStyles.goalText.color} style={{[I18nManager.isRTL ? 'marginRight' : 'marginLeft']: 5}} /> </TouchableOpacity> </View> </View> <View style={currentStyles.statsContainer}> <AnimatedStatItem icon={<FontAwesome5 name="walking" size={22} color={currentStyles.animatedStatIcon.color} />} value={calculatedSteps} label={translation.statSteps} formatter={(v, lang) => Math.round(v).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')} currentStyles={currentStyles} language={language} /> <AnimatedStatItem icon={<FontAwesome5 name="fire" size={22} color={currentStyles.animatedStatIcon.color} />} value={calculatedCalories} label={translation.statKcal} formatter={(v, lang) => v.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} currentStyles={currentStyles} language={language}/> <AnimatedStatItem icon={<MaterialIcon name="location-pin" size={24} color={currentStyles.animatedStatIcon.color} />} value={calculatedDistanceKm} label={translation.statKm} formatter={(v, lang) => v.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} currentStyles={currentStyles} language={language}/> </View> </View> );
};
const ChallengeCard = ({ onPress, currentChallengeDuration, remainingDays, currentStyles, translation, language }) => {
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    const daysCompleted = currentChallengeDuration - remainingDays;
    const badgeProgressAngle = remainingDays <= 0 || currentChallengeDuration <= 0 ? 359.999 : remainingDays >= currentChallengeDuration ? 0 : (daysCompleted / currentChallengeDuration) * 360;
    const badgeProgressPathD = describeArc(BADGE_CENTER_X, BADGE_CENTER_Y, BADGE_PATH_RADIUS, 0.01, badgeProgressAngle);
    const subText = remainingDays > 0 ? `${remainingDays.toLocaleString(locale)} ${remainingDays === 1 ? translation.challengeRemainingSingular : translation.challengeRemainingPlural}` : translation.challengeCompleted;
    const mainText = `${currentChallengeDuration.toLocaleString(locale)} ${translation.challengePrefix}`;
    return ( <TouchableOpacity style={currentStyles.challengeCardWrapper} activeOpacity={0.8} onPress={onPress}> <View style={currentStyles.summaryCard}> <View style={currentStyles.badgeContainer}><Svg height={BADGE_SVG_SIZE} width={BADGE_SVG_SIZE} viewBox={`0 0 ${BADGE_SVG_SIZE} ${BADGE_SVG_SIZE}`}><Circle cx={BADGE_CENTER_X} cy={BADGE_CENTER_Y} r={BADGE_PATH_RADIUS} stroke={currentStyles.badgeBackgroundCircle.stroke} strokeWidth={BADGE_CIRCLE_BORDER_WIDTH} fill="none" /><Path d={badgeProgressPathD} stroke={currentStyles.badgeProgressCircle.stroke} strokeWidth={BADGE_CIRCLE_BORDER_WIDTH} fill="none" strokeLinecap="round" /></Svg><View style={currentStyles.badgeTextContainer}><Text style={currentStyles.badgeText}>{remainingDays > 0 ? `${remainingDays.toLocaleString(locale)}${translation.challengeDaySuffix}` : '✓'}</Text></View></View> <View style={currentStyles.summaryTextContainer}><Text style={currentStyles.summaryMainText}>{mainText}</Text><Text style={currentStyles.summarySubText}>{subText}</Text></View> <Icon name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={24} color={currentStyles.summaryChevron.color} /> </View> </TouchableOpacity> );
};

const WeekView = ({ weeklyTimeData, onTestIncrement, onResetData, currentStyles, translation, language }) => {
    const [tooltipVisible, setTooltipVisible] = useState(false); const [selectedBarIndex, setSelectedBarIndex] = useState(null); const [selectedBarValue, setSelectedBarValue] = useState(null);
    const days = translation.dayNamesShort; const maxVal = Math.max(100, ...weeklyTimeData);
    const today = new Date(); const jsDayIndex = today.getDay();
    const startOfWeekDay = language === 'ar' ? 6 : 0;
    const displayDayIndex = (jsDayIndex - startOfWeekDay + 7) % 7;
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    const handleBarPress = useCallback((index, value) => { const numericValue = value || 0; if (tooltipVisible && selectedBarIndex === index) { setTooltipVisible(false); setSelectedBarIndex(null); setSelectedBarValue(null); } else if (numericValue > 0) { setTooltipVisible(true); setSelectedBarIndex(index); setSelectedBarValue(Math.round(numericValue)); } else { setTooltipVisible(false); } }, [tooltipVisible, selectedBarIndex]);
    const handleOutsidePress = useCallback(() => { if (tooltipVisible) { setTooltipVisible(false); setSelectedBarIndex(null); setSelectedBarValue(null); } }, [tooltipVisible]);
    return ( <Pressable style={currentStyles.card} onPress={handleOutsidePress}> <View style={currentStyles.chartHeader}><Text style={currentStyles.weekChartTitle}>{translation.weekStatsTitle} <Text style={currentStyles.weekChartSubtitle}>{translation.weekStatsUnit}</Text></Text></View> <View style={currentStyles.testButtonsContainer}><TouchableOpacity onPress={onTestIncrement} style={currentStyles.testButton}><Text style={currentStyles.testButtonText}>{translation.testButton}</Text></TouchableOpacity><TouchableOpacity onPress={onResetData} style={currentStyles.testButton}><Text style={currentStyles.testButtonText}>{translation.resetButton}</Text></TouchableOpacity></View> <View style={currentStyles.chartAreaContainer}> <View style={currentStyles.yAxisLabels}>{[Math.round(maxVal), Math.round(maxVal*0.75), Math.round(maxVal*0.5), Math.round(maxVal*0.25), 0].map(label => <Text key={label} style={currentStyles.axisLabelY}>{label}</Text>)}</View> <View style={currentStyles.chartContent}> <View style={currentStyles.barsAndLabelsContainer}> {days.map((dayName, index) => { const value = weeklyTimeData[index] || 0; const barHeight = maxVal > 0 ? Math.min(chartHeight, (value / maxVal) * chartHeight) : 0; const isCurrentDay = index === displayDayIndex; const isSelected = selectedBarIndex === index; return ( <View key={index} style={currentStyles.barColumn}> {tooltipVisible && isSelected && selectedBarValue !== null && ( <View style={[currentStyles.tooltipPositioner, { bottom: barHeight + TOOLTIP_OFFSET }]}><View style={currentStyles.tooltipBox}><Text style={currentStyles.tooltipText}>{selectedBarValue.toLocaleString(locale)} {translation.tooltipUnit}</Text></View><View style={currentStyles.tooltipArrow} /></View> )} <Pressable onPress={(e) => { e.stopPropagation(); handleBarPress(index, value); }} hitSlop={10}> <View style={[currentStyles.bar, { height: barHeight }, isCurrentDay && currentStyles.barToday, isSelected && value > 0 && currentStyles.selectedBar]} /> </Pressable> <Text style={[currentStyles.axisLabelX, isCurrentDay && currentStyles.activeDayLabel]}>{dayName}</Text> </View> ); })} </View> </View> </View> </Pressable> );
}

const ActiveTimeScreen = (props) => {
  const { 
    onNavigate, 
    currentScreenName, 
    onNavigateToAchievements, 
    language, 
    isDarkMode 
  } = props;
  const translation = useMemo(() => translations[language] || translations.ar, [language]);
  const currentStyles = useMemo(() => isDarkMode ? darkStyles : lightStyles, [isDarkMode]);
  const startOfWeekDay = useMemo(() => language === 'ar' ? 6 : 0, [language]);
  
  const [activeTab, setActiveTab] = useState('day'); 
  const [modalVisible, setModalVisible] = useState(false); 
  const [goalHour, setGoalHour] = useState(0); 
  const [goalMinute, setGoalMinute] = useState(30);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isTitleMenuVisible, setIsTitleMenuVisible] = useState(false);
  const [titleMenuPosition, setTitleMenuPosition] = useState({ top: 0, left: undefined, right: undefined });
  const titleMenuTriggerRef = useRef(null);
  const [currentChallengeDuration, setCurrentChallengeDuration] = useState(INITIAL_CHALLENGE_DURATION);
  const [remainingDays, setRemainingDays] = useState(INITIAL_CHALLENGE_DURATION);
  const [appState, setAppState] = useState(AppState.currentState);
  const TABS = useMemo(() => [ { key: 'day', label: translation.tabDay }, { key: 'week', label: translation.tabWeek }, { key: 'month', label: translation.tabMonth } ], [translation]);
  const [timeHistory, setTimeHistory] = useState({});
  const activeTimeForDate = useMemo(() => { const dateStr = getDateString(currentDate); return timeHistory[dateStr] || 0; }, [timeHistory, currentDate]);

  const updateAndSaveTime = useCallback(async (date, minutes) => {
    const dateString = getDateString(date);
    if (!dateString) return;
    setTimeHistory(prevHistory => {
        const newHistory = { ...prevHistory, [dateString]: minutes };
        AsyncStorage.setItem(DAILY_TIME_HISTORY_KEY, JSON.stringify(newHistory));
        return newHistory;
    });
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
        const storedHistory = await AsyncStorage.getItem(DAILY_TIME_HISTORY_KEY);
        setTimeHistory(storedHistory ? JSON.parse(storedHistory) : {});
    };
    loadHistory();
  }, []);

  // ========================== التعديل الرئيسي هنا ==========================
  const weeklyTimeData = useMemo(() => {
    const weekStart = getStartOfWeek(new Date(), startOfWeekDay);
    const newWeekData = Array(7).fill(0);
    const goalInMinutes = (goalHour * 60) + goalMinute;

    for (let i = 0; i < 7; i++) {
        const dayDate = addDays(new Date(weekStart), i);
        const dayDateString = getDateString(dayDate);
        const actualMinutes = timeHistory[dayDateString] || 0;

        // إذا كان اليوم هو اليوم الحالي، قم بتطبيق نفس منطق التقييد بالهدف
        if (isToday(dayDate)) {
            newWeekData[i] = Math.min(actualMinutes, goalInMinutes > 0 ? goalInMinutes : Infinity);
        } else {
            // للأيام الأخرى، اعرض الوقت الفعلي
            newWeekData[i] = actualMinutes;
        }
    }
    return newWeekData;
  }, [timeHistory, startOfWeekDay, goalHour, goalMinute]);
  // ====================================================================
  
  const formatDisplayDate = useCallback((date) => { if (isToday(date)) return translation.displayToday; if (isYesterday(date)) return translation.displayYesterday; const locale = language === 'ar' ? 'ar-EG' : 'en-US'; return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(date); }, [language, translation]);
  const handlePreviousDay = () => { setCurrentDate(prevDate => { const newDate = new Date(prevDate); newDate.setDate(newDate.getDate() - 1); return newDate; }); };
  const handleNextDay = () => { if (isToday(currentDate)) return; setCurrentDate(prevDate => { const newDate = new Date(prevDate); newDate.setDate(newDate.getDate() + 1); return newDate; }); };
  
  const handleTestIncrement = () => {
    const today = new Date();
    // تم تعديل الشرط ليعمل مع `currentDate` بدلاً من `today`
    if (!isToday(currentDate)) return; 
    const dateString = getDateString(today);
    const currentTime = timeHistory[dateString] || 0;
    const newTime = currentTime + 5;
    updateAndSaveTime(today, newTime);
  };
  
  const handleResetData = () => {
    // تم تعديل الشرط ليعمل مع `currentDate` بدلاً من `today`
    if (!isToday(currentDate)) return;
    updateAndSaveTime(currentDate, 0);
  };
  
  const handleNavigateToAchievements = () => { if (onNavigateToAchievements) { onNavigateToAchievements(Math.round(activeTimeForDate * STEPS_PER_MINUTE)); } };
  const openTitleMenu = useCallback(() => { if (titleMenuTriggerRef.current) { titleMenuTriggerRef.current.measure((fx, fy, w, h, px, py) => { const top = py + h + MENU_VERTICAL_OFFSET; const positionStyle = I18nManager.isRTL ? { top, right: width - (px + w), left: undefined } : { top, left: px, right: undefined }; setTitleMenuPosition(positionStyle); setIsTitleMenuVisible(true); }); } }, [width]);
  const closeTitleMenu = useCallback(() => setIsTitleMenuVisible(false), []);
  const navigateTo = (screenName) => { closeTitleMenu(); if (onNavigate) { onNavigate(screenName); } };
  
  const updateChallengeStatus = useCallback(async () => {
    const todayString = getDateString(new Date()); if (!todayString) return;
    try {
        const [ storedRemainingDaysStr, storedLastParticipationDate, storedChallengeDurationStr ] = await Promise.all([ AsyncStorage.getItem(REMAINING_CHALLENGE_DAYS_KEY), AsyncStorage.getItem(LAST_PARTICIPATION_DATE_KEY), AsyncStorage.getItem(CURRENT_CHALLENGE_DURATION_KEY) ]);
        let loadedDuration = INITIAL_CHALLENGE_DURATION; if (storedChallengeDurationStr !== null) { const parsedDuration = parseInt(storedChallengeDurationStr, 10); if (!isNaN(parsedDuration) && CHALLENGE_DURATIONS.includes(parsedDuration)) loadedDuration = parsedDuration; } setCurrentChallengeDuration(loadedDuration);
        let currentRemainingDays = loadedDuration; if (storedRemainingDaysStr !== null) { const parsedDays = parseInt(storedRemainingDaysStr, 10); if (!isNaN(parsedDays) && parsedDays >= 0 && parsedDays <= loadedDuration) currentRemainingDays = parsedDays; } setRemainingDays(currentRemainingDays);
        if (todayString !== storedLastParticipationDate && currentRemainingDays > 0) {
            const newRemainingDays = currentRemainingDays - 1;
            if (newRemainingDays <= 0) {
                const currentDurationIndex = CHALLENGE_DURATIONS.indexOf(loadedDuration); const nextDurationIndex = currentDurationIndex + 1;
                if (nextDurationIndex < CHALLENGE_DURATIONS.length) {
                    const nextChallengeDuration = CHALLENGE_DURATIONS[nextDurationIndex]; setRemainingDays(nextChallengeDuration); setCurrentChallengeDuration(nextChallengeDuration); await AsyncStorage.multiSet([ [REMAINING_CHALLENGE_DAYS_KEY, String(nextChallengeDuration)], [LAST_PARTICIPATION_DATE_KEY, todayString], [CURRENT_CHALLENGE_DURATION_KEY, String(nextChallengeDuration)] ]);
                } else { setRemainingDays(0); await AsyncStorage.multiSet([ [REMAINING_CHALLENGE_DAYS_KEY, '0'], [LAST_PARTICIPATION_DATE_KEY, todayString] ]); }
            } else { setRemainingDays(newRemainingDays); await AsyncStorage.multiSet([ [REMAINING_CHALLENGE_DAYS_KEY, String(newRemainingDays)], [LAST_PARTICIPATION_DATE_KEY, todayString] ]); }
        } else if (currentRemainingDays <= 0 && remainingDays !== 0) { setRemainingDays(0); }
    } catch (error) { console.error("Challenge update fail:", error); }
  }, []);
  useEffect(() => { const runInitialChecks = async () => { await updateChallengeStatus(); }; runInitialChecks(); const subscription = AppState.addEventListener('change', nextAppState => { if (appState.match(/inactive|background/) && nextAppState === 'active') { runInitialChecks(); } setAppState(nextAppState); }); return () => { subscription.remove(); }; }, [appState, updateChallengeStatus]);
  
  return ( <SafeAreaView style={currentStyles.container}> <View style={currentStyles.topBar}> <TouchableOpacity ref={titleMenuTriggerRef} style={currentStyles.titleGroup} onPress={openTitleMenu} activeOpacity={0.7} > <Text style={currentStyles.headerTitle}>{translation.headerTitle}</Text> <MaterialCommunityIcon name="chevron-down" size={24} color={currentStyles.headerTitle.color} style={{ [I18nManager.isRTL ? 'marginRight' : 'marginLeft']: 5 }} /> </TouchableOpacity> </View> <GoalSetterModal visible={modalVisible} onClose={() => setModalVisible(false)} initialHour={goalHour} initialMinute={goalMinute} onSave={(newHour, newMinute) => { setGoalHour(newHour); setGoalMinute(newMinute); }} currentStyles={currentStyles} translation={translation} /> 
      
      <View style={{flex: 1}}>
        <View style={currentStyles.segmentedControlContainer}>
            <View style={currentStyles.segmentedControl}>{TABS.map(tab => (<TouchableOpacity key={tab.key} style={[currentStyles.tab, activeTab === tab.key && currentStyles.activeTab]} onPress={() => setActiveTab(tab.key)}><Text style={[currentStyles.tabText, activeTab === tab.key && currentStyles.activeTabText]}>{tab.label}</Text></TouchableOpacity>))}</View>
        </View>

        {activeTab === 'day' && ( 
          <ScrollView contentContainerStyle={currentStyles.scrollContent} key={`day-${language}-${isDarkMode}`}> 
            <DayView goalHour={goalHour} goalMinute={goalMinute} onOpenGoalModal={() => setModalVisible(true)} activeTimeForDate={activeTimeForDate} currentDate={currentDate} onNextDay={handleNextDay} onPreviousDay={handlePreviousDay} formatDisplayDate={formatDisplayDate} currentStyles={currentStyles} translation={translation} language={language}/> 
            <ChallengeCard onPress={handleNavigateToAchievements} currentChallengeDuration={currentChallengeDuration} remainingDays={remainingDays} currentStyles={currentStyles} translation={translation} language={language} /> 
            <WeekView 
              weeklyTimeData={weeklyTimeData} 
              onTestIncrement={handleTestIncrement}
              onResetData={handleResetData}
              currentStyles={currentStyles} 
              translation={translation} 
              language={language} />
          </ScrollView> 
        )} 

        {activeTab === 'week' && <WeeklyTime language={language} isDarkMode={isDarkMode} />} 
        {activeTab === 'month' && <MonthlyTime language={language} isDarkMode={isDarkMode} />}
      </View>

      <Modal visible={isTitleMenuVisible} transparent={true} animationType="fade" onRequestClose={closeTitleMenu}> <Pressable style={currentStyles.menuModalOverlay} onPress={closeTitleMenu}> <View style={[ currentStyles.titleMenuModalContent, { top: titleMenuPosition.top, left: I18nManager.isRTL ? undefined : titleMenuPosition.left, right: I18nManager.isRTL ? titleMenuPosition.right : undefined, } ]}> <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('steps')}><Text style={currentStyles.titleMenuItemText}>{translation.menuSteps}</Text>{currentScreenName === 'steps' && <MaterialCommunityIcon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}</TouchableOpacity><View style={currentStyles.titleMenuSeparator} /> <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('distance')}><Text style={currentStyles.titleMenuItemText}>{translation.menuDistance}</Text>{currentScreenName === 'distance' && <MaterialCommunityIcon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}</TouchableOpacity><View style={currentStyles.titleMenuSeparator} /> <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('calories')}><Text style={currentStyles.titleMenuItemText}>{translation.menuCalories}</Text>{currentScreenName === 'calories' && <MaterialCommunityIcon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}</TouchableOpacity><View style={currentStyles.titleMenuSeparator} /> <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('activeTime')}><Text style={currentStyles.titleMenuItemText}>{translation.menuActiveTime}</Text>{currentScreenName === 'activeTime' && <MaterialCommunityIcon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}</TouchableOpacity> </View> </Pressable> </Modal> </SafeAreaView> );
};

const lightStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FDF9' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, alignItems: 'center' },
  topBar: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'flex-start', alignItems: 'center', width: '100%', paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#F7FDF9' },
  titleGroup: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32' },
  menuModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)' },
  titleMenuModalContent: { position: 'absolute', backgroundColor: 'white', borderRadius: 12, paddingVertical: 8, minWidth: 240, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6 },
  menuItemButton: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, width: '100%' },
  titleMenuItemText: { fontSize: 16, color: '#2e7d32', fontWeight: 'bold', textAlign: I18nManager.isRTL ? 'right' : 'left' },
  titleMenuSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e0e0e0' },
  segmentedControlContainer: { paddingHorizontal: 16, paddingTop: 24 },
  segmentedControl: { flexDirection: 'row-reverse', backgroundColor: '#E8F5E9', borderRadius: 20, width: '100%', height: 40, overflow: 'hidden', alignSelf: 'center' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeTab: { backgroundColor: '#388e3c', borderRadius: 20 },
  tabText: { fontSize: 16, fontWeight: 'bold', color: '#388e3c' },
  activeTabText: { color: '#ffffff' },
  dayViewContainer: { width: '100%', alignItems: 'center', paddingTop: 30, marginBottom: 30 },
  card: { backgroundColor: '#FFF', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 10, width: '100%', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, alignItems: 'center', marginBottom: 20 },
  dayHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '60%', alignItems: 'center'},
  headerCenter: { flexDirection: 'row-reverse', alignItems: 'baseline' },
  dayHeaderTitle: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32' },
  dayHeaderArrow: { color: '#2e7d32' },
  disabledIcon: { color: '#a5d6a7' },
  progressContainer: { marginVertical: 20, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  progressCircleBackground: { stroke: '#e0f2f1' },
  progressCircleForeground: { stroke: '#4caf50' },
  progressTextContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  timerIcon: { color: '#388e3c'},
  timerText: { fontSize: 60, fontWeight: 'bold', color: '#388e3c', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', fontVariant: ['tabular-nums'] },
  goalContainer: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: 8, padding: 5 },
  goalText: { fontSize: 16, color: '#757575' },
  statsContainer: { flexDirection: 'row-reverse', justifyContent: 'space-around', width: '100%', marginTop: 20 },
  statItem: { alignItems: 'center', flex: 1 },
  statIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0f2f1', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  animatedStatIcon: { color: '#4caf50'},
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#388e3c', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 14, color: '#757575' },
  chartHeader: { width: '100%', alignItems: 'flex-end', marginBottom: 10, paddingRight: 10 },
  weekChartTitle: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32' },
  weekChartSubtitle: { fontSize: 18, fontWeight: 'normal', color: '#6B7280' },
  testButtonsContainer: { flexDirection: 'row-reverse', justifyContent: 'center', marginBottom: 20, width: '100%', flexWrap: 'wrap' },
  testButton: { backgroundColor: '#E8F5E9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginHorizontal: 5, marginVertical: 5, elevation: 1 },
  testButtonText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 13 },
  chartAreaContainer: { flexDirection: 'row-reverse', width: '100%', paddingRight: 5 },
  chartContent: { flex: 1, height: chartHeight, position: 'relative', marginLeft: 10 },
  barsAndLabelsContainer: { flexDirection: 'row-reverse', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%' },
  barColumn: { alignItems: 'center', justifyContent: 'flex-end', flex: 1, position: 'relative' },
  bar: { width: 12, backgroundColor: '#c8e6c9', borderRadius: 6 },
  barToday: { backgroundColor: '#66bb6a' },
  selectedBar: { backgroundColor: '#2E7D32' },
  yAxisLabels: { height: chartHeight, justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: 5 },
  axisLabelY: { color: '#757575', fontSize: 12 },
  axisLabelX: { color: '#757575', marginTop: 8, fontSize: 12 },
  activeDayLabel: { color: '#000000', fontWeight: 'bold' },
  tooltipPositioner: { position: 'absolute', alignSelf: 'center', alignItems: 'center', zIndex: 10, minWidth: 40 },
  tooltipBox: { backgroundColor: '#333333', borderRadius: 5, paddingVertical: 4, paddingHorizontal: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1 },
  tooltipText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  tooltipArrow: { position: 'absolute', bottom: -TOOLTIP_ARROW_HEIGHT, width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: TOOLTIP_ARROW_HEIGHT, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#333333', alignSelf: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  closeButton: { position: 'absolute', top: 15, left: 15, backgroundColor: '#F3F4F6', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  closeButtonText: { color: '#6B7280', fontSize: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#424242', marginBottom: 24 },
  pickersContainer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative', height: PICKER_CONTAINER_HEIGHT + 40 },
  pickerHighlight: { position: 'absolute', height: ITEM_HEIGHT, width: '100%', backgroundColor: '#e8f5e9', borderRadius: 16, top: 40 + (PICKER_CONTAINER_HEIGHT - ITEM_HEIGHT) / 2 },
  pickerColumn: { alignItems: 'center', flex: 1 },
  pickerLabel: { fontSize: 16, color: '#6B7280', marginBottom: 10, fontWeight: '500' },
  pickerView: { height: PICKER_CONTAINER_HEIGHT },
  pickerItemContainer: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  pickerItemText: { fontSize: 30, fontWeight: '600', color: '#388e3c' },
  colonContainer: { justifyContent: 'center', height: PICKER_CONTAINER_HEIGHT, marginTop: 40 },
  colonText: { fontSize: 30, fontWeight: 'bold', color: '#1F2937', marginHorizontal: 8 },
  saveButton: { backgroundColor: '#4caf50', width: '100%', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 24 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#f5f5f5', width: '100%', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 12 },
  cancelButtonText: { color: '#757575', fontSize: 16, fontWeight: 'bold' },
  challengeCardWrapper: { width: '100%', alignItems: 'center', marginBottom: 20 },
  summaryCard: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 15, padding: 15, width: '100%', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  summaryTextContainer: { alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start', flex: 1, marginHorizontal: 12 },
  summaryMainText: { fontSize: 18, fontWeight: 'bold', color: '#424242', textAlign: I18nManager.isRTL ? 'right' : 'left' },
  summarySubText: { fontSize: 14, color: '#757575', marginTop: 4, textAlign: I18nManager.isRTL ? 'right' : 'left' },
  summaryChevron: { color: "#bdbdbd" },
  badgeContainer: { width: BADGE_CONTAINER_SIZE, height: BADGE_CONTAINER_SIZE, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badgeBackgroundCircle: { stroke: "#e0f2f1" },
  badgeProgressCircle: { stroke: "#4caf50" },
  badgeTextContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 16, fontWeight: 'bold', color: '#4caf50', fontVariant: ['tabular-nums'] },
  movingDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#4caf50', borderWidth: 2, borderColor: '#F7FDF9' },
});

const darkStyles = StyleSheet.create({
  ...lightStyles,
  container: { ...lightStyles.container, backgroundColor: '#121212' },
  topBar: { ...lightStyles.topBar, backgroundColor: '#121212' },
  headerTitle: { ...lightStyles.headerTitle, color: '#A7FFEB' },
  menuModalOverlay: { ...lightStyles.menuModalOverlay, backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  titleMenuModalContent: { ...lightStyles.titleMenuModalContent, backgroundColor: '#2C2C2C' },
  titleMenuItemText: { ...lightStyles.titleMenuItemText, color: '#A7FFEB' },
  titleMenuSeparator: { ...lightStyles.titleMenuSeparator, backgroundColor: '#424242' },
  segmentedControl: { ...lightStyles.segmentedControl, backgroundColor: '#1E1E1E' },
  activeTab: { ...lightStyles.activeTab, backgroundColor: '#00796B' },
  tabText: { ...lightStyles.tabText, color: '#80CBC4' },
  activeTabText: { ...lightStyles.activeTabText, color: '#E0E0E0' },
  card: { ...lightStyles.card, backgroundColor: '#1E1E1E', shadowColor: '#000' },
  dayHeaderTitle: { ...lightStyles.dayHeaderTitle, color: '#80CBC4' },
  dayHeaderArrow: { color: '#80CBC4'},
  disabledIcon: { color: '#004D40' },
  progressCircleBackground: { stroke: '#333333' },
  progressCircleForeground: { stroke: '#80CBC4' },
  timerIcon: { color: '#80CBC4' },
  timerText: { ...lightStyles.timerText, color: '#80CBC4' },
  goalText: { ...lightStyles.goalText, color: '#B0B0B0' },
  statIconCircle: { ...lightStyles.statIconCircle, backgroundColor: '#2C2C2C' },
  animatedStatIcon: { color: '#80CBC4' },
  statValue: { ...lightStyles.statValue, color: '#E0E0E0' },
  statLabel: { ...lightStyles.statLabel, color: '#B0B0B0' },
  weekChartTitle: { ...lightStyles.weekChartTitle, color: '#80CBC4' },
  weekChartSubtitle: { ...lightStyles.weekChartSubtitle, color: '#B0B0B0' },
  testButton: { ...lightStyles.testButton, backgroundColor: '#2C2C2C' },
  testButtonText: { ...lightStyles.testButtonText, color: '#80CBC4' },
  bar: { ...lightStyles.bar, backgroundColor: '#004D40' },
  barToday: { ...lightStyles.barToday, backgroundColor: '#00796B' },
  selectedBar: { ...lightStyles.selectedBar, backgroundColor: '#A7FFEB' },
  axisLabelY: { ...lightStyles.axisLabelY, color: '#B0B0B0' },
  axisLabelX: { ...lightStyles.axisLabelX, color: '#B0B0B0' },
  activeDayLabel: { ...lightStyles.activeDayLabel, color: '#FFFFFF' },
  tooltipBox: { ...lightStyles.tooltipBox, backgroundColor: '#E0E0E0' },
  tooltipText: { ...lightStyles.tooltipText, color: '#121212' },
  tooltipArrow: { ...lightStyles.tooltipArrow, borderTopColor: '#E0E0E0' },
  modalOverlay: { ...lightStyles.modalOverlay, backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  modalContent: { ...lightStyles.modalContent, backgroundColor: '#2C2C2C' },
  closeButton: { ...lightStyles.closeButton, backgroundColor: '#424242' },
  closeButtonText: { ...lightStyles.closeButtonText, color: '#B0B0B0' },
  modalTitle: { ...lightStyles.modalTitle, color: '#E0E0E0' },
  pickerHighlight: { ...lightStyles.pickerHighlight, backgroundColor: '#1E1E1E' },
  pickerLabel: { ...lightStyles.pickerLabel, color: '#B0B0B0' },
  pickerItemText: { ...lightStyles.pickerItemText, color: '#80CBC4' },
  colonText: { ...lightStyles.colonText, color: '#E0E0E0' },
  saveButton: { ...lightStyles.saveButton, backgroundColor: '#00796B' },
  saveButtonText: { ...lightStyles.saveButtonText, color: '#E0E0E0' },
  cancelButton: { ...lightStyles.cancelButton, backgroundColor: '#424242' },
  cancelButtonText: { ...lightStyles.cancelButtonText, color: '#B0B0B0' },
  summaryCard: { ...lightStyles.summaryCard, backgroundColor: '#1E1E1E' },
  summaryMainText: { ...lightStyles.summaryMainText, color: '#E0E0E0' },
  summarySubText: { ...lightStyles.summarySubText, color: '#B0B0B0' },
  summaryChevron: { color: "#A0A0A0" },
  badgeBackgroundCircle: { stroke: "#333333" },
  badgeProgressCircle: { stroke: "#80CBC4" },
  badgeText: { ...lightStyles.badgeText, color: '#80CBC4' },
  movingDot: { ...lightStyles.movingDot, backgroundColor: '#80CBC4', borderColor: '#121212' },
});

export default ActiveTimeScreen;
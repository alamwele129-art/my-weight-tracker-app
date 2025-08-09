// reports.js (النسخة النهائية والمعدلة)
import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
    SafeAreaView, View, Text, StyleSheet, ScrollView,
    Dimensions, I18nManager, ActivityIndicator, TouchableOpacity,
    Alert
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

// --- الثوابت والمفاتيح والترجمات ---
const WEIGHT_HISTORY_KEY = '@WeightTracker:history';
const SETTINGS_KEY = '@Settings:generalSettings';
const STEPS_HISTORY_KEY = '@Steps:DailyHistory';
const FOOD_LOG_PREFIX = 'mealsData_';
const WATER_DATA_PREFIX = 'waterData_';
const translations = {
    ar: {
        title: 'التقارير الصحية', week: 'أسبوعي', month: 'شهري', weight: 'الوزن', bmi: 'مؤشر كتلة الجسم', avgDailySteps: 'متوسط الخطوات اليومي', avgDailyKm: 'متوسط المسافة اليومي', avgCaloriesBurned: 'متوسط حرق السعرات', avgActiveTime: 'متوسط الوقت النشط', avgDailyWater: 'متوسط استهلاك الماء', weeklyActivity: 'النشاط الأسبوعي', monthlyActivity: 'النشاط الشهري', steps: 'خطوات', caloriesConsumed: 'السعرات', kg: 'كجم', hrs: 'ساعة', mlUnit: 'مل', loading: 'جاري تحميل البيانات...', dayNames: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"], weekLabels: ["أسبوع 1", "أسبوع 2", "أسبوع 3", "أسبوع 4"], vsLastWeek: 'مقابل الأسبوع الماضي', vsLastMonth: 'مقابل الشهر الماضي', increase: 'زيادة', decrease: 'نقصان', stable: 'مستقر', shareReport: 'مشاركة التقرير', shareError: 'خطأ في المشاركة', shareMessage: 'إليك تقريري الصحي من تطبيقي!', sharingNotAvailable: 'المشاركة غير متاحة على هذا الجهاز',
    },
    en: {
        title: 'Health Reports', week: 'Weekly', month: 'Monthly', weight: 'WEIGHT', bmi: 'BODY MASS INDEX (BMI)', avgDailySteps: 'AVG DAILY STEPS', avgDailyKm: 'AVG DAILY KM', avgCaloriesBurned: 'AVG CALORIES BURNED', avgActiveTime: 'AVG ACTIVE TIME', avgDailyWater: 'AVG DAILY WATER', weeklyActivity: 'Weekly Activity', monthlyActivity: 'Monthly Activity', steps: 'Steps', caloriesConsumed: 'Calories', kg: 'kg', hrs: 'hrs', mlUnit: 'ml', loading: 'Loading data...', dayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], weekLabels: ["Week 1", "Week 2", "Week 3", "Week 4"], vsLastWeek: 'vs. Last Week', vsLastMonth: 'vs. Last Month', increase: 'Increase', decrease: 'Decrease', stable: 'Stable', shareReport: 'Share Report', shareError: 'Sharing Error', shareMessage: 'Here is my health report from my app!', sharingNotAvailable: 'Sharing is not available on this device',
    },
};
const getLocalDateString = (date) => { const d = new Date(date); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().split('T')[0]; };
const addDays = (date, days) => { const res = new Date(date); res.setDate(res.getDate() + days); return res; };

const ComparisonCard = React.memo(({ value, label, unit, comparisonText, changePercent, styles }) => {
    const isIncrease = changePercent > 0;
    const isDecrease = changePercent < 0;
    const changeColor = isIncrease ? '#4CAF50' : (isDecrease ? '#F44336' : styles.summaryLabel.color);
    const iconName = isIncrease ? 'arrow-top-right' : (isDecrease ? 'arrow-bottom-right' : 'minus');
    return (
        <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{value}{unit && <Text style={styles.summaryUnit}> {unit}</Text>}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
            {comparisonText && (
                <View style={[styles.changeBadge, { backgroundColor: changeColor }]}>
                    <Icon name={iconName} size={12} color="#fff" />
                    <Text style={styles.changeText}>{Math.abs(changePercent).toFixed(0)}%</Text>
                </View>
            )}
        </View>
    );
});

const ReportsScreen = ({ language, isDarkMode }) => {
    const t = useMemo(() => translations[language] || translations.en, [language]);
    const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState('week');
    const reportContainerRef = useRef(null);
    const [reportData, setReportData] = useState({ weight: '0.0', bmi: '0.0', avgSteps: '0', avgKm: '0.0', avgCaloriesBurned: '0', avgActiveHours: '0.0', avgWater: '0' });
    const [comparisonData, setComparisonData] = useState({ steps: 0, km: 0, caloriesBurned: 0, activeHours: 0, water: 0 });
    const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }, { data: [] }], legend: [] });
    const [tooltip, setTooltip] = useState(null);

    useFocusEffect(useCallback(() => { fetchData(); }, [language, t, isDarkMode, period]));
    
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const daysInPeriod = period === 'week' ? 7 : 30;
            const today = new Date();
            const currentPeriodDates = Array.from({ length: daysInPeriod }).map((_, i) => addDays(today, -i)).reverse();
            const previousPeriodDates = Array.from({ length: daysInPeriod }).map((_, i) => addDays(today, -(i + daysInPeriod))).reverse();
            const allDates = [...previousPeriodDates, ...currentPeriodDates];
            const allDateStrings = allDates.map(d => getLocalDateString(d));
            const foodLogKeys = allDateStrings.map(dateStr => `${FOOD_LOG_PREFIX}${dateStr}`);
            const waterLogKeys = allDateStrings.map(dateStr => `${WATER_DATA_PREFIX}${dateStr}`);
            const keysToFetch = [WEIGHT_HISTORY_KEY, SETTINGS_KEY, STEPS_HISTORY_KEY, ...foodLogKeys, ...waterLogKeys];
            const storedData = await AsyncStorage.multiGet(keysToFetch);
            const dataMap = new Map(storedData);

            const processPeriodData = (periodDates) => {
                const periodDateStrings = periodDates.map(d => getLocalDateString(d));
                const stepsHistory = JSON.parse(dataMap.get(STEPS_HISTORY_KEY) || '{}');
                const dailySteps = periodDateStrings.map(dateStr => stepsHistory[dateStr] || 0);
                const totalSteps = dailySteps.reduce((sum, s) => sum + s, 0);
                const foodLogs = periodDateStrings.map(dateStr => JSON.parse(dataMap.get(`${FOOD_LOG_PREFIX}${dateStr}`) || '{}'));
                const dailyCaloriesConsumed = foodLogs.map(log => log.totalCalories || 0);
                const waterLogs = periodDateStrings.map(dateStr => JSON.parse(dataMap.get(`${WATER_DATA_PREFIX}${dateStr}`) || '{}'));
                const dailyWaterConsumed = waterLogs.map(log => (log.waterHistory || []).reduce((sum, entry) => sum + (entry.amount || 0), 0));
                const totalWater = dailyWaterConsumed.reduce((sum, w) => sum + w, 0);
                return {
                    avgSteps: totalSteps / periodDates.length,
                    avgKm: ((totalSteps * 0.762) / 1000) / periodDates.length,
                    avgCaloriesBurned: (totalSteps * 0.04) / periodDates.length,
                    avgActiveHours: ((totalSteps / 100) / periodDates.length) / 60,
                    avgWater: totalWater / periodDates.length,
                    dailySteps,
                    dailyCaloriesConsumed,
                };
            };
            
            const currentData = processPeriodData(currentPeriodDates);
            const previousData = processPeriodData(previousPeriodDates);
            
            // --- START OF BMI FIX ---
            const weightHistory = JSON.parse(dataMap.get(WEIGHT_HISTORY_KEY) || '[]');
            let currentWeight = 0;
            if (weightHistory.length > 0) {
                currentWeight = [...weightHistory].sort((a, b) => new Date(b.date) - new Date(a.date))[0].weight || 0;
            }

            const settings = JSON.parse(dataMap.get(SETTINGS_KEY) || '{}');
            const heightFromSettings = settings.height; 

            let bmiDisplayValue = '---'; 

            if (currentWeight > 0 && heightFromSettings && !isNaN(parseFloat(heightFromSettings))) {
                const heightInMeters = parseFloat(heightFromSettings) / 100;
                if (heightInMeters > 0) {
                    const calculatedBmi = currentWeight / (heightInMeters * heightInMeters);
                    bmiDisplayValue = calculatedBmi.toFixed(1);
                }
            }
            
            setReportData({
                weight: currentWeight.toFixed(1),
                bmi: bmiDisplayValue,
                avgSteps: Math.round(currentData.avgSteps).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US'),
                avgKm: currentData.avgKm.toFixed(1),
                avgCaloriesBurned: Math.round(currentData.avgCaloriesBurned).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US'),
                avgActiveHours: currentData.avgActiveHours.toFixed(1),
                avgWater: Math.round(currentData.avgWater).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US'),
            });
            // --- END OF BMI FIX ---
            
            const calculateChange = (current, previous) => (previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0));
            
            setComparisonData({
                steps: calculateChange(currentData.avgSteps, previousData.avgSteps),
                km: calculateChange(currentData.avgKm, previousData.avgKm),
                caloriesBurned: calculateChange(currentData.avgCaloriesBurned, previousData.avgCaloriesBurned),
                activeHours: calculateChange(currentData.avgActiveHours, previousData.avgActiveHours),
                water: calculateChange(currentData.avgWater, previousData.avgWater),
            });

            let labels, stepsDataset, caloriesDataset;
            if (period === 'week') {
                labels = currentPeriodDates.map(date => t.dayNames[date.getDay()]);
                stepsDataset = currentData.dailySteps;
                caloriesDataset = currentData.dailyCaloriesConsumed;
            } else {
                labels = t.weekLabels;
                stepsDataset = [0, 0, 0, 0];
                caloriesDataset = [0, 0, 0, 0];
                for (let i = 0; i < 30; i++) {
                    const weekIndex = Math.floor(i / 7);
                    if (weekIndex < 4) {
                        stepsDataset[weekIndex] += currentData.dailySteps[i] || 0;
                        caloriesDataset[weekIndex] += currentData.dailyCaloriesConsumed[i] || 0;
                    }
                }
            }
            
            setChartData({
                labels,
                datasets: [
                    { data: stepsDataset, color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, strokeWidth: 3 },
                    { data: caloriesDataset, color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`, strokeWidth: 3 }
                ],
                legend: [t.steps, t.caloriesConsumed]
            });
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShareReport = useCallback(async () => {
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (!isSharingAvailable) {
            Alert.alert(t.shareError, t.sharingNotAvailable);
            return;
        }
        try {
            const uri = await reportContainerRef.current.capture();
            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: t.shareMessage,
            });
        } catch (error) {
            Alert.alert(t.shareError, error.message);
        }
    }, [t]);

    const chartConfig = {
        backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        backgroundGradientFrom: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        backgroundGradientTo: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(150, 150, 150, ${opacity})`,
        labelColor: (opacity = 1) => isDarkMode ? `rgba(200, 200, 200, ${opacity})` : `rgba(100, 100, 100, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: { r: '5' }
    };
    
    if (isLoading) {
        return (
            <SafeAreaView style={[styles.safeArea, {justifyContent: 'center', alignItems: 'center'}]}>
                <ActivityIndicator size="large" color={isDarkMode ? '#4CAF50' : '#388e3c'} />
                <Text style={styles.loadingText}>{t.loading}</Text>
            </SafeAreaView>
        );
    }
    
    const comparisonLabel = period === 'week' ? t.vsLastWeek : t.vsLastMonth;
    const isChartDataValid = chartData.datasets.every(ds => ds.data && ds.data.length > 0) && chartData.labels.length > 0;
    
    let tooltipStyle = {};
    let arrowStyle = {};

    if (tooltip) {
        const chartWidth = Dimensions.get('window').width - 40;
        const tooltipWidth = 110; 
        let idealLeftPosition;

        if (period === 'month' && tooltip.datasetIndex === 0) {
            idealLeftPosition = tooltip.x - (tooltipWidth / 1.5);
        } else if (period === 'month' && tooltip.datasetIndex === 1) {
            idealLeftPosition = tooltip.x - (tooltipWidth / 1.6);
        } else {
            idealLeftPosition = tooltip.x - (tooltipWidth / 1.6);
        }
        
        let leftPosition = idealLeftPosition;
        if (leftPosition < 5) { leftPosition = 5; }
        if (leftPosition + tooltipWidth > chartWidth - 5) { leftPosition = chartWidth - tooltipWidth - 5; }

        const shift = idealLeftPosition - leftPosition;
        arrowStyle = { marginLeft: shift };
        
        tooltipStyle = { top: tooltip.y - -50, left: leftPosition };
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView>
                <ViewShot ref={reportContainerRef} options={{ format: 'png', quality: 0.9 }}>
                    <View style={styles.reportContainer} collapsable={false}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{t.title}</Text>
                            <TouchableOpacity onPress={handleShareReport} style={styles.shareIcon}>
                                <Icon name="share-variant" size={24} color={isDarkMode ? '#E0E0E0' : '#2e7d32'} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.periodSelector}>
                            <TouchableOpacity style={[styles.periodButton, period === 'week' && styles.activePeriod]} onPress={() => setPeriod('week')}>
                                <Text style={[styles.periodText, period === 'week' && styles.activePeriodText]}>{t.week}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.periodButton, period === 'month' && styles.activePeriod]} onPress={() => setPeriod('month')}>
                                <Text style={[styles.periodText, period === 'month' && styles.activePeriodText]}>{t.month}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.summaryGrid}>
                            <ComparisonCard value={reportData.weight} label={t.weight} unit={t.kg} styles={styles} />
                            <ComparisonCard value={reportData.bmi} label={t.bmi} styles={styles} />
                            <ComparisonCard value={reportData.avgSteps} label={t.avgDailySteps} comparisonText={comparisonLabel} changePercent={comparisonData.steps} styles={styles} />
                            <ComparisonCard value={reportData.avgKm} label={t.avgDailyKm} comparisonText={comparisonLabel} changePercent={comparisonData.km} styles={styles} />
                            <ComparisonCard value={reportData.avgWater} label={t.avgDailyWater} unit={t.mlUnit} comparisonText={comparisonLabel} changePercent={comparisonData.water} styles={styles} />
                            <ComparisonCard value={reportData.avgCaloriesBurned} label={t.avgCaloriesBurned} comparisonText={comparisonLabel} changePercent={comparisonData.caloriesBurned} styles={styles} />
                            <ComparisonCard value={reportData.avgActiveHours} label={t.avgActiveTime} unit={t.hrs} comparisonText={comparisonLabel} changePercent={comparisonData.activeHours} styles={styles} />
                        </View>
                        <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>{period === 'week' ? t.weeklyActivity : t.monthlyActivity}</Text>
                            {isChartDataValid ? (
                                <>
                                    <LineChart
                                        data={chartData}
                                        width={Dimensions.get('window').width - 40}
                                        height={240}
                                        chartConfig={chartConfig}
                                        bezier
                                        style={{ borderRadius: 16 }}
                                        fromZero
                                        onDataPointClick={({ value, x, y, index, dataset }) => {
                                            const datasetIndex = chartData.datasets.indexOf(dataset);
                                            if (tooltip && tooltip.index === index && tooltip.datasetIndex === datasetIndex) {
                                                setTooltip(null);
                                            } else {
                                                const unit = datasetIndex === 0 ? ` ${t.steps}` : ` ${t.caloriesConsumed}`;
                                                setTooltip({ x, y, value, index, datasetIndex, unit });
                                            }
                                        }}
                                    />
                                    {tooltip && (
                                        <View style={[styles.tooltipWrapper, tooltipStyle]}>
                                            <View style={styles.tooltipContainer}>
                                                <Text style={styles.tooltipText} numberOfLines={1}>
                                                    {Math.round(tooltip.value).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                                                    {tooltip.unit}
                                                </Text>
                                            </View>
                                            <View style={[styles.tooltipArrow, arrowStyle]} />
                                        </View>
                                    )}
                                </>
                            ) : (
                                <View style={{height: 240, justifyContent: 'center'}}><Text style={{color: isDarkMode ? '#777' : '#999'}}>No Data Available</Text></View>
                            )}
                        </View>
                    </View>
                </ViewShot>
            </ScrollView>
        </SafeAreaView>
    );
};

const getStyles = (isDark) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#121212' : '#F7FDF9' },
    reportContainer: { padding: 20, paddingBottom: 40, backgroundColor: isDark ? '#121212' : '#F7FDF9' },
    header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16, position: 'relative' },
    title: { fontSize: 26, fontWeight: 'bold', color: isDark ? '#E0E0E0' : '#2e7d32', textAlign: 'center' },
    shareIcon: { position: 'absolute', [I18nManager.isRTL ? 'left' : 'right']: 0, padding: 5 },
    loadingText: { marginTop: 10, color: isDark ? '#999' : '#555' },
    periodSelector: { flexDirection: 'row', backgroundColor: isDark ? '#2C2C2C' : '#E8F5E9', borderRadius: 20, overflow: 'hidden', width: '80%', alignSelf: 'center', marginBottom: 24 },
    periodButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    activePeriod: { backgroundColor: isDark ? '#00796B' : '#388e3c', borderRadius: 20 },
    periodText: { fontSize: 16, fontWeight: 'bold', color: isDark ? '#80CBC4' : '#388e3c' },
    activePeriodText: { color: isDark ? '#E0E0E0' : '#FFFFFF' },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    summaryCard: { width: '48%', backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderRadius: 16, paddingVertical: 20, paddingHorizontal: 10, marginBottom: 16, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 4, elevation: 4 },
    summaryValue: { fontSize: 26, fontWeight: 'bold', color: isDark ? '#81C784' : '#388e3c', fontVariant: ['tabular-nums'] },
    summaryUnit: { fontSize: 14, fontWeight: 'normal', color: isDark ? '#81C784' : '#388e3c' },
    summaryLabel: { fontSize: 11, color: isDark ? '#B0B0B0' : '#757575', marginTop: 8, textAlign: 'center', textTransform: 'uppercase' },
    changeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 10 },
    changeText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 4 },
    chartContainer: { marginTop: 20, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderRadius: 16, paddingVertical: 20, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.2 : 0.08, shadowRadius: 4, elevation: 4 },
    chartTitle: { fontSize: 18, fontWeight: '600', color: isDark ? '#E0E0E0' : '#34495e', marginBottom: 15, alignSelf: 'flex-start', paddingLeft: 20 },
    tooltipWrapper: { position: 'absolute', alignItems: 'center', zIndex: 10 },
    tooltipContainer: { backgroundColor: 'black', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, elevation: 5 },
    tooltipText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
    tooltipArrow: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: 'black' },
});

export default ReportsScreen;
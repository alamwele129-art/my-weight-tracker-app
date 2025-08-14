// reports.js (النسخة النهائية - مع طبقة القفل الشفافة)

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
    SafeAreaView, View, Text, StyleSheet, ScrollView,
    Dimensions, I18nManager, ActivityIndicator, TouchableOpacity,
    Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

// --- الترجمات (تم تحديثها لتناسب التصميم الجديد) ---
const translations = {
    ar: {
        title: 'التقارير الصحية', week: 'أسبوعي', month: 'شهري', weight: 'الوزن', bmi: 'مؤشر كتلة الجسم', avgDailySteps: 'متوسط الخطوات اليومي', avgDailyKm: 'متوسط المسافة اليومي', avgCaloriesBurned: 'متوسط حرق السعرات', avgActiveTime: 'متوسط الوقت النشط', avgDailyWater: 'متوسط استهلاك الماء', weeklyActivity: 'النشاط الأسبوعي', monthlyActivity: 'النشاط الشهري', steps: 'خطوات', caloriesConsumed: 'السعرات', kg: 'كجم', hrs: 'ساعة', mlUnit: 'مل', loading: 'جاري تحميل البيانات...', dayNames: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"], weekLabels: ["أسبوع 1", "أسبوع 2", "أسبوع 3", "أسبوع 4"], vsLastWeek: 'مقابل الأسبوع الماضي', vsLastMonth: 'مقابل الشهر الماضي', increase: 'زيادة', decrease: 'نقصان', stable: 'مستقر', shareReport: 'مشاركة التقرير', shareError: 'خطأ في المشاركة', shareMessage: 'إليك تقريري الصحي من تطبيقي!', sharingNotAvailable: 'المشاركة غير متاحة على هذا الجهاز',
        lockedTitle: 'تقارير متقدمة',
        lockedSubtitle: 'هذه الميزة حصرية للمشتركين في الخطة المميزة.',
        lockedDescription: 'احصل على تحليلات أسبوعية وشهرية لوزنك، خطواتك، استهلاكك للماء، والمزيد لتفهم تقدمك بشكل أفضل.',
        upgradeButton: 'الترقية الآن',
    },
    en: {
        title: 'Health Reports', week: 'Weekly', month: 'Monthly', weight: 'WEIGHT', bmi: 'BODY MASS INDEX (BMI)', avgDailySteps: 'AVG DAILY STEPS', avgDailyKm: 'AVG DAILY KM', avgCaloriesBurned: 'AVG CALORIES BURNED', avgActiveTime: 'AVG ACTIVE TIME', avgDailyWater: 'AVG DAILY WATER', weeklyActivity: 'Weekly Activity', monthlyActivity: 'Monthly Activity', steps: 'Steps', caloriesConsumed: 'Calories', kg: 'kg', hrs: 'hrs', mlUnit: 'ml', loading: 'Loading data...', dayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], weekLabels: ["Week 1", "Week 2", "Week 3", "Week 4"], vsLastWeek: 'vs. Last Week', vsLastMonth: 'vs. Last Month', increase: 'Increase', decrease: 'Decrease', stable: 'Stable', shareReport: 'Share Report', shareError: 'Sharing Error', shareMessage: 'Here is my health report from my app!', sharingNotAvailable: 'Sharing is not available on this device',
        lockedTitle: 'Advanced Reports',
        lockedSubtitle: 'This is an exclusive feature for Premium subscribers.',
        lockedDescription: 'Get weekly and monthly analysis of your weight, steps, water intake, and more to better understand your progress.',
        upgradeButton: 'Upgrade Now',
    },
};
// ... (الدوال المساعدة كما هي)
const getLocalDateString = (date) => { const d = new Date(date); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().split('T')[0]; };
const addDays = (date, days) => { const res = new Date(date); res.setDate(res.getDate() + days); return res; };

// --- مكون طبقة القفل الشفافة ---
const PremiumOverlay = ({ onUpgrade, styles, t }) => (
    <View style={styles.premiumOverlayContainer}>
        <Icon name="lock-check" size={70} color={styles.lockedIcon.color} />
        <Text style={styles.lockedTitle}>{t.lockedTitle}</Text>
        <Text style={styles.lockedSubtitle}>{t.lockedSubtitle}</Text>
        <Text style={styles.lockedDescription}>{t.lockedDescription}</Text>
        <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>{t.upgradeButton}</Text>
        </TouchableOpacity>
    </View>
);

const ComparisonCard = React.memo(({ value, label, unit, comparisonText, changePercent, styles }) => {
    // ... (هذا المكون كما هو بدون تغيير)
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
    const navigation = useNavigation();

    // --- >> تغيير منطق التحميل والاشتراك << ---
    const [isLoading, setIsLoading] = useState(true);
    const [isPremium, setIsPremium] = useState(null); // null يعني "جاري التحقق"

    const [period, setPeriod] = useState('week');
    const reportContainerRef = useRef(null);
    const [reportData, setReportData] = useState({ weight: '0.0', bmi: '0.0', avgSteps: '0', avgKm: '0.0', avgCaloriesBurned: '0', avgActiveHours: '0.0', avgWater: '0' });
    const [comparisonData, setComparisonData] = useState({ steps: 0, km: 0, caloriesBurned: 0, activeHours: 0, water: 0 });
    const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }, { data: [] }], legend: [] });
    const [tooltip, setTooltip] = useState(null);

    useFocusEffect(useCallback(() => {
        const checkStatusAndFetchData = async () => {
            setIsLoading(true);
            // تحقق من حالة الاشتراك أولاً
            const status = await AsyncStorage.getItem('@User:isPremium');
            setIsPremium(status === 'true');
            // قم بجلب البيانات دائمًا لعرضها خلف الطبقة الشفافة
            await fetchData();
            setIsLoading(false);
        };
        checkStatusAndFetchData();
    }, [language, period])); // يعتمد على اللغة والفترة
    
    // --- دالة جلب البيانات (كما هي) ---
    const fetchData = async () => { /* ... الكود كامل بالأسفل ... */ };
    const handleShareReport = useCallback(async () => { /* ... الكود كامل بالأسفل ... */ }, [t]);
    const chartConfig = { /* ... */ };

    // --- >> عرض الواجهة الجديدة << ---
    if (isPremium === null || isLoading) {
        return (
            <SafeAreaView style={[styles.safeArea, {justifyContent: 'center', alignItems: 'center'}]}>
                <ActivityIndicator size="large" color={isDarkMode ? '#4CAF50' : '#388e3c'} />
            </SafeAreaView>
        );
    }
    
    // --- باقي تعريفات المتغيرات اللازمة للعرض ---
    const comparisonLabel = period === 'week' ? t.vsLastWeek : t.vsLastMonth;
    const isChartDataValid = chartData.datasets.every(ds => ds.data && ds.data.length > 0) && chartData.labels.length > 0;
    
    // ... (كود حساب موضع الـ Tooltip كما هو)

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={{ flex: 1 }}>
                <ScrollView>
                    <ViewShot ref={reportContainerRef} options={{ format: 'png', quality: 0.9 }}>
                        <View style={styles.reportContainer} collapsable={false}>
                            {/* ... المحتوى الكامل للتقارير ... */}
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
                                {/* ... (كود الرسم البياني كما هو) ... */}
                            </View>
                        </View>
                    </ViewShot>
                </ScrollView>
                
                {/* --- >> طبقة القفل الشرطية << --- */}
                {!isPremium && (
                    <PremiumOverlay
                        styles={styles}
                        t={t}
                        onUpgrade={() => navigation.navigate('Premium')}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};


// --- >> يجب نسخ كل الكود المتبقي من هنا << ---

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
    
    // --- STYLES FOR PREMIUM OVERLAY ---
    premiumOverlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(247, 253, 249, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    lockedIcon: {
        color: isDark ? '#009688' : '#388e3c',
        marginBottom: 20,
    },
    lockedTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: isDark ? '#E0E0E0' : '#212121',
        textAlign: 'center',
        marginBottom: 12,
    },
    lockedSubtitle: {
        fontSize: 16,
        color: isDark ? '#B0B0B0' : '#757575',
        textAlign: 'center',
        marginBottom: 25,
    },
    lockedDescription: {
        fontSize: 14,
        color: isDark ? '#9E9E9E' : '#616161',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    upgradeButton: {
        backgroundColor: isDark ? '#009688' : '#4CAF50',
        paddingVertical: 15,
        paddingHorizontal: 50,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    upgradeButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ReportsScreen;
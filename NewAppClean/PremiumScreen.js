// PremiumScreen.js (النسخة الكاملة والصحيحة)

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
  I18nManager,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

// --- الترجمة | Translations ---
const translations = {
  ar: {
    title: 'ارتقِ برحلتك الصحية',
    subtitle: 'افتح الميزات الحصرية واستمتع بالتجربة الكاملة.',
    feature: 'الميزة',
    free: 'مجاني',
    premium: 'مميز',
    feature_history: 'سجل متقدم ورسوم بيانية\nلتتبع الوزن',
    feature_ads: 'إزالة جميع الإعلانات',
    feature_dark_mode: 'الوضع الداكن',
    feature_reports: 'تقارير وتحليلات متقدمة',
    feature_tips: 'نصائح يومية عبر الإشعارات',
    monthly: 'شهرياً',
    monthly_price: '$4.99 / شهر',
    annually: 'سنوياً',
    annually_price: '$29.99 / سنة',
    best_value: 'أفضل قيمة',
    save_50: 'وفر 50%',
    button_use_trial: 'استخدم التجربة المجانية 7 أيام',
    button_upgrade: 'الترقية إلى المميز',
    trial_checkbox_label: 'استخدم التجربة المجانية 7 أيام',
    footer_text: 'سيتم خصم المبلغ من حساب App Store الخاص بك. يمكنك إدارة أو إلغاء اشتراكك في أي وقت من إعدادات حسابك.',
    purchase_success_title: "نجاح!",
    purchase_success_message: "تهانينا! تم فتح جميع الميزات المميزة.",
    purchase_continue: "متابعة",
    purchase_error_title: "خطأ",
    purchase_error_message: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    already_premium_title: "أنت مشترك بالفعل!",
    already_premium_subtitle: "جميع الميزات المميزة متاحة لك. استمر في رحلتك الصحية!",
    go_back_button: "العودة",
  },
  en: {
    title: 'Elevate Your Health Journey',
    subtitle: 'Unlock exclusive features and enjoy the full experience.',
    feature: 'Feature',
    free: 'Free',
    premium: 'Premium',
    feature_history: 'Advanced history and graphs\nfor weight tracking',
    feature_ads: 'Remove all ads',
    feature_dark_mode: 'Dark Mode',
    feature_reports: 'Advanced reports and analysis',
    feature_tips: 'Daily tips via notifications',
    monthly: 'Monthly',
    monthly_price: '$4.99 / month',
    annually: 'Annually',
    annually_price: '$29.99 / year',
    best_value: 'Best Value',
    save_50: 'Save 50%',
    button_use_trial: 'Use 7-day free trial',
    button_upgrade: 'Upgrade to Premium',
    trial_checkbox_label: 'Use 7-day free trial',
    footer_text: 'Payment will be charged to your App Store account. You can manage or cancel your subscription at any time in your account settings.',
    purchase_success_title: "Success!",
    purchase_success_message: "Congratulations! All premium features are now unlocked.",
    purchase_continue: "Continue",
    purchase_error_title: "Error",
    purchase_error_message: "Something went wrong. Please try again.",
    already_premium_title: "You're Already a Premium Member!",
    already_premium_subtitle: "All premium features are available to you. Keep up the great work!",
    go_back_button: "Go Back",
  },
};

// --- تعريف ألوان الثيم | Theme Color Definitions ---
const lightTheme = {
    background: '#F7FBF7', card: '#ffffff', text: '#333333', subtleText: '#888888',
    border: '#e0e0e0', primary: '#5cb85c', primaryText: '#ffffff', selectedPlanBg: '#e9f5e9',
    bestValueText: '#ffffff', iconColor: '#5cb85c', iconDisabledColor: '#888888',
    shimmerEffectColor: 'rgba(255, 255, 255, 0.4)',
};
const darkTheme = {
    background: '#121212', card: '#1E1E1E', text: '#E0E0E0', subtleText: '#A0A0A0',
    border: '#444444', primary: '#66bb6a', primaryText: '#121212', selectedPlanBg: '#2C3E2D',
    bestValueText: '#E0E0E0', iconColor: '#66bb6a', iconDisabledColor: '#A0A0A0',
    shimmerEffectColor: 'rgba(255, 255, 255, 0.3)',
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const { width: screenWidth } = Dimensions.get('window');


// --- واجهة "أنت مشترك بالفعل" ---
const AlreadyPremiumView = ({ styles, t, onGoBack }) => (
    <View style={styles.alreadyPremiumContainer}>
        <Ionicons name="shield-checkmark" size={90} color={styles.alreadyPremiumIcon.color} />
        <Text style={styles.alreadyPremiumTitle}>{t.already_premium_title}</Text>
        <Text style={styles.alreadyPremiumSubtitle}>{t.already_premium_subtitle}</Text>
        <TouchableOpacity style={styles.goBackButton} onPress={onGoBack}>
            <Text style={styles.goBackButtonText}>{t.go_back_button}</Text>
        </TouchableOpacity>
    </View>
);

// --- المكون الرئيسي | Main Component ---
const PremiumScreen = ({ language: propLanguage, darkMode: propDarkMode }) => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [isAlreadyPremium, setIsAlreadyPremium] = useState(null); // null, true, or false
  const [selectedPlan, setSelectedPlan] = useState('annually');
  const [useTrial, setUseTrial] = useState(false);
  const shimmerTranslateX = useRef(new Animated.Value(-150)).current;
  const isTrialActiveRef = useRef(useTrial);

  const language = propLanguage || (I18nManager.isRTL ? 'ar' : 'en');
  const isDarkMode = propDarkMode === true;
  const themeMode = isDarkMode ? 'dark' : 'light';
  
  const t = useMemo(() => translations[language] || translations.en, [language]);
  const styles = useMemo(() => getStyles(themeMode), [themeMode]);
  const theme = useMemo(() => (isDarkMode ? darkTheme : lightTheme), [isDarkMode]);

  const featuresData = useMemo(() => [
    { name: t.feature_history, free: true, premium: true },
    { name: t.feature_ads, free: false, premium: true },
    { name: t.feature_dark_mode, free: false, premium: true },
    { name: t.feature_reports, free: false, premium: true },
    { name: t.feature_tips, free: false, premium: true },
  ], [t]);

  useFocusEffect(
    useCallback(() => {
        const checkStatus = async () => {
            const status = await AsyncStorage.getItem('@User:isPremium');
            setIsAlreadyPremium(status === 'true');
        };
        checkStatus();
    }, [])
  );
  
  useEffect(() => { isTrialActiveRef.current = useTrial; }, [useTrial]);

  const runAnimation = () => {
    shimmerTranslateX.setValue(-150);
    Animated.timing(shimmerTranslateX, {
      toValue: screenWidth, duration: 1500, useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && isTrialActiveRef.current) runAnimation();
    });
  };

  useEffect(() => {
    if (useTrial) runAnimation(); else shimmerTranslateX.stopAnimation();
    return () => shimmerTranslateX.stopAnimation();
  }, [useTrial]);

  const handleTrialToggle = () => setUseTrial(p => !p);
  const handleCloseOrBack = () => navigation.goBack();

  const handlePurchase = async () => {
    try {
      await AsyncStorage.setItem('@User:isPremium', 'true');
      Alert.alert(
        t('purchase_success_title'),
        t('purchase_success_message'),
        [ { text: t('purchase_continue'), onPress: () => navigation.goBack() } ],
        { cancelable: false }
      );
    } catch (e) {
      Alert.alert(t('purchase_error_title'), t('purchase_error_message'));
    }
  };
  
  const isMonthlySelected = selectedPlan === 'monthly';
  const isAnnuallySelected = selectedPlan === 'annually';

  if (isAlreadyPremium === null) {
    return (
        <SafeAreaView style={[styles.safeArea, {justifyContent: 'center', alignItems: 'center'}]}>
            <ActivityIndicator size="large" color={theme.primary} />
        </SafeAreaView>
    );
  }

  if (isAlreadyPremium) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <AlreadyPremiumView styles={styles} t={t} onGoBack={handleCloseOrBack} />
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleCloseOrBack}>
            <Ionicons 
              name={route.params?.fromLogin ? 'close' : (I18nManager.isRTL ? 'arrow-forward' : 'arrow-back')} 
              size={route.params?.fromLogin ? 30 : 28}
              color={styles.headerTitle.color} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <View style={{ width: 38 }} /> 
        </View>

        <Text style={styles.subtitle}>{t.subtitle}</Text>
        <View style={styles.featuresTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, { flex: 1 }]}>{t.feature}</Text>
            <Text style={[styles.headerText, { width: 70, textAlign: 'center' }]}>{t.free}</Text>
            <Text style={[styles.headerText, styles.premiumHeader]}>{t.premium}</Text>
          </View>
          {featuresData.map((feature, index) => (
             <FeatureRow key={index} styles={styles} {...feature} />
          ))}
        </View>

        <View style={styles.plansContainer}>
          <TouchableOpacity
            style={[styles.planBox, isMonthlySelected ? styles.selectedPlanBox : styles.unselectedPlanBox]}
            onPress={() => setSelectedPlan('monthly')}>
            <Text style={[styles.planTitle, isMonthlySelected ? styles.selectedPlanTitle : styles.unselectedPlanTitle]}>{t.monthly}</Text>
            <Text style={styles.planPrice}>{t.monthly_price}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.planBox, isAnnuallySelected ? styles.selectedPlanBox : styles.unselectedPlanBox]}
            onPress={() => setSelectedPlan('annually')}>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>{t.best_value}</Text>
            </View>
            <Text style={[styles.planTitle, isAnnuallySelected ? styles.selectedPlanTitle : styles.unselectedPlanTitle]}>{t.annually}</Text>
            <Text style={styles.planPrice}>{t.annually_price}</Text>
            <Text style={styles.planSave}>{t.save_50}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.upgradeButton} onPress={handlePurchase}>
          {useTrial && (
            <AnimatedLinearGradient
              colors={['transparent', theme.shimmerEffectColor, 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[ styles.shimmerEffect, { transform: [{ translateX: shimmerTranslateX }] }]} 
            />
          )}
          <Text style={styles.upgradeButtonText}>{useTrial ? t.button_use_trial : t.button_upgrade}</Text>
        </TouchableOpacity>
        
        <View style={styles.trialContainer}>
            <Text style={styles.trialText}>{t.trial_checkbox_label}</Text>
            <Pressable onPress={handleTrialToggle} style={[styles.checkboxBase, useTrial && styles.checkboxChecked]}>
                {useTrial && <Ionicons name="checkmark" size={16} color={theme.primaryText} />}
            </Pressable>
        </View>
        
        <Text style={styles.footerText}>{t.footer_text}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const FeatureRow = React.memo(({ name, free, premium, styles }) => (
  <View style={styles.featureRow}>
    <Text style={styles.featureName}>{name}</Text>
    <View style={styles.iconColumn}>
      {free ? <Ionicons name="checkmark-circle-outline" size={28} color={styles.iconColumn.color} /> : <Ionicons name="close-circle-outline" size={28} color={styles.iconColumn.disabledColor} />}
    </View>
    <View style={styles.iconColumn}>
      {premium ? <Ionicons name="checkmark-circle-outline" size={28} color={styles.iconColumn.color} /> : <Ionicons name="close-circle-outline" size={28} color={styles.iconColumn.disabledColor} />}
    </View>
  </View>
));

const getStyles = (themeMode) => {
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.background },
    container: { paddingHorizontal: 20, paddingBottom: 40 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
    backButton: { padding: 5, width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, fontSize: 22, fontWeight: 'bold', color: theme.text, textAlign: 'center' },
    subtitle: { fontSize: 16, color: theme.subtleText, textAlign: 'center', marginTop: 4, marginBottom: 20 },
    featuresTable: { width: '100%', backgroundColor: theme.card, borderRadius: 10, paddingHorizontal: 15, paddingTop: 15, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: themeMode === 'dark' ? 0.3 : 0.05, shadowRadius: 2, elevation: 2 },
    tableHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
    headerText: { fontSize: 16, fontWeight: 'bold', color: theme.text, textAlign: I18nManager.isRTL ? 'right' : 'left' },
    premiumHeader: { width: 70, textAlign: 'center', color: theme.primary },
    featureRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.border, minHeight: 70, },
    featureName: { flex: 1, fontSize: 14, color: theme.text, lineHeight: 20, paddingRight: I18nManager.isRTL ? 0 : 10, paddingLeft: I18nManager.isRTL ? 10 : 0, textAlign: I18nManager.isRTL ? 'right' : 'left'},
    iconColumn: { width: 70, alignItems: 'center', justifyContent: 'center', color: theme.iconColor, disabledColor: theme.iconDisabledColor },
    plansContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', width: '100%', marginTop: 30 },
    planBox: { width: '48%', borderWidth: 2, borderRadius: 10, padding: 15, alignItems: 'center', position: 'relative', height: 110, justifyContent: 'center' },
    selectedPlanBox: { backgroundColor: theme.selectedPlanBg, borderColor: theme.primary, },
    unselectedPlanBox: { backgroundColor: theme.card, borderColor: theme.border, },
    planTitle: { fontSize: 16, fontWeight: 'bold' },
    selectedPlanTitle: { color: theme.primary },
    unselectedPlanTitle: { color: theme.text },
    planPrice: { fontSize: 14, color: theme.text, marginTop: 5 },
    planSave: { fontSize: 12, color: theme.primary, fontWeight: 'bold', marginTop: 5 },
    bestValueBadge: { position: 'absolute', top: -14, backgroundColor: theme.primary, borderRadius: 15, paddingHorizontal: 10, paddingVertical: 4 },
    bestValueText: { color: theme.bestValueText, fontWeight: 'bold', fontSize: 12 },
    upgradeButton: { width: '100%', backgroundColor: theme.primary, padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 30, overflow: 'hidden' },
    shimmerEffect: { position: 'absolute', top: 0, left: 0, height: '100%', width: 150, transform: [{ skewX: '-20deg' }] },
    upgradeButtonText: { color: theme.primaryText, fontSize: 18, fontWeight: 'bold' },
    trialContainer: { width: '100%', flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    trialText: { fontSize: 16, color: theme.text, marginHorizontal: 10 },
    checkboxBase: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center', borderRadius: 4, borderWidth: 2, borderColor: theme.primary, backgroundColor: 'transparent' },
    checkboxChecked: { backgroundColor: theme.primary, borderColor: theme.primary },
    footerText: { fontSize: 12, color: theme.subtleText, textAlign: 'center', marginTop: 30 },
    alreadyPremiumContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    alreadyPremiumIcon: {
        color: theme.primary,
        marginBottom: 25,
    },
    alreadyPremiumTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        textAlign: 'center',
        marginBottom: 15,
    },
    alreadyPremiumSubtitle: {
        fontSize: 16,
        color: theme.subtleText,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    goBackButton: {
        backgroundColor: theme.primary,
        paddingVertical: 15,
        paddingHorizontal: 60,
        borderRadius: 30,
    },
    goBackButtonText: {
        color: theme.primaryText,
        fontSize: 18,
        fontWeight: 'bold',
    },
  });
};

export default PremiumScreen;
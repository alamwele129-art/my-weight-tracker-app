// ResultsScreen.js

import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
// *** إضافة جديدة: استيراد AsyncStorage ***
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===================================================================
// --- 1. الثوابت والألوان (Theme) ---
// ===================================================================
const COLORS = {
  primary: '#388E3C',
  textAndIcons: '#2E7D32',
  background: '#F9FBFA',
  white: '#FFFFFF',
  cardBorder: '#EFF2F1',
  grayText: '#888888',
  disabled: '#A5D6A7',
};

const SIZES = {
  padding: 24,
  radius: 16,
};

// ===================================================================
// --- 2. المكونات الاحترافية القابلة لإعادة الاستخدام ---
// ===================================================================
const PrimaryButton = ({ title, onPress, disabled = false }) => (
  <Pressable
    style={({ pressed }) => [
      styles.button,
      disabled ? styles.buttonDisabled : styles.buttonEnabled,
      pressed && !disabled && styles.buttonPressed,
    ]}
    onPress={() => {
        if (!disabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onPress();
        }
    }}
    disabled={disabled}>
    <Text style={styles.buttonText}>{title}</Text>
  </Pressable>
);

// ===================================================================
// --- 3. دالة حساب السعرات الحرارية ---
// ===================================================================
const calculateCalories = (userData) => {
  if (!userData || !userData.birthDate || !userData.weight || !userData.height || !userData.gender || !userData.activityLevel || !userData.goal) {
    return 2000; 
  }

  const { birthDate, gender, weight, height, activityLevel, goal } = userData;
  const age = new Date().getFullYear() - new Date(birthDate).getFullYear();

  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityMultipliers = { sedentary: 1.2, light: 1.375, active: 1.55, very_active: 1.725 };
  const multiplier = activityMultipliers[activityLevel] || 1.2;
  const tdee = bmr * multiplier;

  let finalCalories;
  switch (goal) {
    case 'lose': finalCalories = tdee - 500; break;
    case 'gain': finalCalories = tdee + 500; break;
    default: finalCalories = tdee; break;
  }

  return Math.max(1200, Math.round(finalCalories));
};

// ===================================================================
// --- 4. شاشة عرض الخطة (ResultsScreen) ---
// ===================================================================
const ResultsScreen = ({ route, navigation }) => {
  const userData = route?.params?.userData;
  const calculatedCalories = useMemo(() => calculateCalories(userData), [userData]);
  
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animation, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const animatedStyle = {
    opacity: animation,
    transform: [{ scale: animation.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
  };

  // *** دالة جديدة للتعامل مع الضغط على الزر ***
  const handleStartJourney = async () => {
    try {
      // 1. إنشاء كائن بيانات المستخدم لحفظه
      const userProfile = {
        dailyGoal: calculatedCalories,
        ...userData // حفظ كل بيانات المستخدم
      };

      // 2. حفظ البيانات في الذاكرة الدائمة
      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));

      // 3. الانتقال إلى الشاشة الرئيسية واستبدال شاشة النتائج
      // تأكد من أن اسم شاشة الواجهة الرئيسية في مكدس التنقل هو 'MainUI' أو قم بتغييره
      navigation.replace('MainUI', { 
        screen: 'Diary', 
        params: { dailyGoal: calculatedCalories } 
      });

    } catch (e) {
      console.error("فشل في حفظ بيانات المستخدم أو التنقل:", e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        <View />

        <View style={styles.mainContent}>
          <Icon name="check-decagram" size={60} color={COLORS.primary} />
          <Text style={styles.title}>خطتك المخصصة جاهزة!</Text>

          <Animated.View style={[styles.resultCard, animatedStyle]}>
            <Text style={styles.resultNumber}>{calculatedCalories}</Text>
            <Text style={styles.resultUnit}>سعر حراري يومياً</Text>
          </Animated.View>

          <Text style={styles.infoText}>
            هذا هو هدفك اليومي المقترح للوصول إلى وزنك المستهدف. يمكنك تعديل هذا الهدف لاحقاً من إعدادات حسابك.
          </Text>
        </View>

        <View style={styles.footer}>
          {/* *** استخدام الدالة الجديدة في الزر *** */}
          <PrimaryButton
            title="لنبدأ!"
            onPress={handleStartJourney}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

// ===================================================================
// --- 5. الأنماط (StyleSheet) ---
// ===================================================================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flex: 1,
    padding: SIZES.padding,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textAndIcons,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#B0BEC5',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  resultNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  resultUnit: {
    fontSize: 18,
    color: COLORS.textAndIcons,
    marginTop: 8,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.grayText,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 30,
    paddingHorizontal: 10,
  },
  footer: {
    width: '100%',
    paddingTop: 10,
  },
  button: { paddingVertical: 18, borderRadius: SIZES.radius, alignItems: 'center', justifyContent: 'center', width: '100%', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
  buttonEnabled: { backgroundColor: COLORS.primary },
  buttonPressed: { transform: [{ scale: 0.98 }], shadowOpacity: 0.15 },
  buttonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
});

// ===================================================================
// --- 6. التصدير الافتراضي (Default Export) ---
// ===================================================================
export default ResultsScreen;
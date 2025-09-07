// In MeasurementsScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Slider from '@react-native-community/slider';

// ===================================================================
// --- 1. الثوابت والألوان ---
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
const ProgressBar = ({ step, totalSteps }) => (
  <View style={styles.progressBarContainer}>
    <View style={[styles.progressBar, { width: `${(step / totalSteps) * 100}%` }]} />
  </View>
);

const PrimaryButton = ({ title, onPress, disabled = false }) => (
  <TouchableOpacity
    style={[styles.button, disabled ? styles.buttonDisabled : styles.buttonEnabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const ScreenHeader = ({ title, subtitle }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
);

const MeasurementSlider = ({ label, unit, value, onValueChange, min, max, step }) => (
  <View style={styles.sliderComponentContainer}>
    <View style={styles.sliderLabelContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueBubble}>
        <Text style={styles.sliderValue}>{value.toFixed(label === 'الوزن الحالي' ? 1 : 0)}</Text>
        <Text style={styles.sliderUnit}>{unit}</Text>
      </View>
    </View>
    <Slider
      style={styles.sliderStyle}
      minimumValue={min}
      maximumValue={max}
      step={step}
      value={value}
      onValueChange={onValueChange}
      minimumTrackTintColor={COLORS.primary}
      maximumTrackTintColor="#D1E7D3"
      thumbTintColor={COLORS.primary}
    />
  </View>
);

// ===================================================================
// --- 3. شاشة القياسات (MeasurementsScreen) ---
// ===================================================================

// ***** 1. تم حذف كلمة 'export' من هنا *****
const MeasurementsScreen = ({ navigation, route }) => {
  const { gender, birthDate } = route.params || {};

  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70.0);

  const handleNextPress = () => {
    const collectedData = {
      gender,
      birthDate,
      height: Math.round(height),
      weight: parseFloat(weight.toFixed(1)),
    };
    navigation.navigate('Goal', collectedData);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        <ProgressBar step={2} totalSteps={4} />
        <ScreenHeader
          title="ما هي قياساتك الحالية؟"
          subtitle="لا تقلق، هذه المعلومات خاصة بك وحدك وتساعدنا في تحديد نقطة البداية."
        />
        <View style={styles.formContainer}>
          <MeasurementSlider
            label="الطول"
            unit="سم"
            value={height}
            onValueChange={setHeight}
            min={120}
            max={220}
            step={1}
          />
          <MeasurementSlider
            label="الوزن الحالي"
            unit="كجم"
            value={weight}
            onValueChange={setWeight}
            min={40}
            max={150}
            step={0.5}
          />
        </View>
        <View style={styles.footer}>
          <PrimaryButton title="التالي" onPress={handleNextPress} />
        </View>
      </View>
    </SafeAreaView>
  );
};

// ===================================================================
// --- 4. الأنماط (StyleSheet) ---
// ===================================================================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: SIZES.padding },
  progressBarContainer: { height: 8, width: '100%', backgroundColor: '#E8F5E9', borderRadius: 4, marginBottom: 20, },
  progressBar: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4, },
  headerContainer: { alignItems: 'center', marginVertical: 20, paddingHorizontal: 10, },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textAndIcons, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: COLORS.grayText, textAlign: 'center', lineHeight: 24, },
  formContainer: { flex: 1, justifyContent: 'center' },
  label: { fontSize: 18, color: COLORS.textAndIcons, marginBottom: 12, fontWeight: '600', textAlign: 'right', },
  footer: { paddingBottom: 20, paddingTop: 10, },
  button: { paddingVertical: 18, borderRadius: SIZES.radius, alignItems: 'center', justifyContent: 'center', width: '100%', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6, },
  buttonEnabled: { backgroundColor: COLORS.primary },
  buttonDisabled: { backgroundColor: COLORS.disabled, elevation: 0, shadowColor: 'transparent', },
  buttonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold', },
  sliderComponentContainer: { width: '100%', marginBottom: 40, },
  sliderLabelContainer: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', },
  valueBubble: { flexDirection: 'row-reverse', alignItems: 'baseline', backgroundColor: '#E8F5E9', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, },
  sliderValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, fontVariant: ['tabular-nums'], },
  sliderUnit: { fontSize: 14, color: COLORS.textAndIcons, fontWeight: '600', marginRight: 5, },
  sliderStyle: { width: '100%', height: 40, marginTop: 15, },
});

// ===================================================================
// --- 5. التصدير الافتراضي (Default Export) ---
// ===================================================================
// ***** 2. هذا هو السطر الذي طلبته بالضبط *****
export default MeasurementsScreen;
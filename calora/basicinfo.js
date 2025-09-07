// In BasicInfoScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import DateTimePicker from '@react-native-community/datetimepicker';

// ===================================================================
// --- 1. الثوابت والألوان ---
// ===================================================================
const COLORS = {
  primary: '#388E3C',
  textAndIcons: '#2E7D32',
  background: '#F7FDF9',
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
// --- 2. المكونات القابلة لإعادة الاستخدام ---
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
    activeOpacity={0.7}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

// ===================================================================
// --- 3. الشاشة الرئيسية (مع تعديلات الربط) ---
// ===================================================================
const BasicInfoScreen = ({ navigation }) => { // <-- استقبال navigation
  const [gender, setGender] = useState(null);
  const [date, setDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };
  
  // --- دالة للانتقال مع حفظ البيانات ---
  const handleNextPress = () => {
    if (gender) {
      // انتقل إلى شاشة 'Measurements' وأرسل البيانات معها
      navigation.navigate('Measurements', {
        gender: gender,
        birthDate: date.toISOString(), // إرسال التاريخ كنص لضمان التوافق
      });
    }
  };

  const isNextButtonDisabled = !gender;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        <ProgressBar step={1} totalSteps={4} />

        <View style={styles.headerContainer}>
          <Text style={styles.title}>لنبدأ بالأساسيات</Text>
          <Text style={styles.subtitle}>
            نحتاج لبعض المعلومات البسيطة لحساب خطتك بدقة.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>الجنس</Text>
          <View style={styles.genderSelector}>
            <TouchableOpacity
              style={[styles.genderBox, gender === 'male' && styles.genderBoxSelected]}
              onPress={() => setGender('male')}>
              <Icon name="mars" size={40} color={gender === 'male' ? COLORS.white : COLORS.textAndIcons} />
              <Text style={[styles.genderText, gender === 'male' && styles.genderTextSelected]}>ذكر</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderBox, gender === 'female' && styles.genderBoxSelected]}
              onPress={() => setGender('female')}>
              <Icon name="venus" size={40} color={gender === 'female' ? COLORS.white : COLORS.textAndIcons} />
              <Text style={[styles.genderText, gender === 'female' && styles.genderTextSelected]}>أنثى</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 30 }]}>تاريخ الميلاد</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>
              {date.toLocaleDateString('ar-EG', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <Icon name="calendar-alt" size={20} color={COLORS.grayText} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 12))}
              locale="ar-EG"
            />
          )}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title="التالي"
            onPress={handleNextPress} // <-- استدعاء دالة الانتقال
            disabled={isNextButtonDisabled}
          />
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
  progressBarContainer: {
    height: 8,
    width: '100%',
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  headerContainer: { alignItems: 'center', marginVertical: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textAndIcons, marginBottom: 10 },
  subtitle: { fontSize: 16, color: COLORS.grayText, textAlign: 'center', paddingHorizontal: 20 },
  formContainer: { flex: 1, justifyContent: 'center' },
  label: { fontSize: 18, color: COLORS.textAndIcons, marginBottom: 12, fontWeight: '600', textAlign: 'right' },
  genderSelector: { flexDirection: 'row', justifyContent: 'space-around' },
  genderBox: {
    flex: 1,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginHorizontal: 8,
    shadowColor: '#B0BEC5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  genderBoxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    elevation: 8,
  },
  genderText: { marginTop: 12, fontSize: 16, color: COLORS.textAndIcons, fontWeight: 'bold' },
  genderTextSelected: { color: COLORS.white },
  dateInput: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  dateText: { fontSize: 16, color: COLORS.textAndIcons, fontWeight: '500' },
  footer: { paddingBottom: 20, paddingTop: 10 },
  button: {
    paddingVertical: 18,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  buttonEnabled: {
    backgroundColor: COLORS.primary,
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled,
    shadowColor: 'transparent',
    elevation: 0,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BasicInfoScreen;
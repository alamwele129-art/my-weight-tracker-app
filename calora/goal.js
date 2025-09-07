// In GoalScreen.js

import React, { useState } from 'react'; // <-- تم تصحيح هذا السطر
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
const ProgressBar = ({ step, totalSteps }) => (
  <View style={styles.progressBarContainer}>
    <View style={[styles.progressBar, { width: `${(step / totalSteps) * 100}%` }]} />
  </View>
);

const PrimaryButton = ({ title, onPress, disabled = false }) => (
  <Pressable
    style={({ pressed }) => [
      styles.button,
      disabled ? styles.buttonDisabled : styles.buttonEnabled,
      pressed && !disabled && styles.buttonPressed,
    ]}
    onPress={() => {
        if (!disabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }
    }}
    disabled={disabled}>
    <Text style={styles.buttonText}>{title}</Text>
  </Pressable>
);

const ScreenHeader = ({ title, subtitle }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
);

const GoalCard = ({ title, iconName, isSelected, onPress }) => (
  <Pressable
    style={({ pressed }) => [
      styles.goalCard,
      isSelected && styles.goalCardSelected,
      pressed && styles.cardPressed,
    ]}
    onPress={onPress}
  >
    <Icon name={iconName} size={28} color={isSelected ? COLORS.white : COLORS.textAndIcons} />
    <Text style={[styles.goalCardText, isSelected && styles.goalCardTextSelected]}>
      {title}
    </Text>
  </Pressable>
);

// ===================================================================
// --- 3. شاشة تحديد الهدف (GoalScreen) ---
// ===================================================================
const GoalScreen = ({ navigation, route }) => {
  const previouslyCollectedData = route.params || {};

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [targetWeight, setTargetWeight] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);

  const handleGoalSelection = (goal) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGoal(goal);
  };

  const handleNextPress = () => {
    // تجميع البيانات من هذه الشاشة مع البيانات السابقة
    const updatedUserData = {
      ...previouslyCollectedData,
      goal: selectedGoal,
      targetWeight: targetWeight ? parseFloat(targetWeight) : null,
    };

    // الانتقال إلى شاشة 'ActivityLevel' مع إرسال كل البيانات المجمعة
    navigation.navigate('ActivityLevel', updatedUserData);
  };

  const isButtonDisabled =
    !selectedGoal ||
    ((selectedGoal === 'lose' || selectedGoal === 'gain') && !targetWeight);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        <ProgressBar step={3} totalSteps={4} />
        <ScreenHeader
          title="ما هو هدفك الرئيسي؟"
          subtitle="اختر الهدف الذي تسعى لتحقيقه."
        />
        <View style={styles.formContainer}>
          <Text style={styles.label}>الهدف</Text>
          <GoalCard title="فقدان الوزن" iconName="arrow-down-thin-circle-outline" isSelected={selectedGoal === 'lose'} onPress={() => handleGoalSelection('lose')} />
          <GoalCard title="الحفاظ على وزني" iconName="minus-circle-outline" isSelected={selectedGoal === 'maintain'} onPress={() => handleGoalSelection('maintain')} />
          <GoalCard title="زيادة الوزن" iconName="arrow-up-thin-circle-outline" isSelected={selectedGoal === 'gain'} onPress={() => handleGoalSelection('gain')} />

          {(selectedGoal === 'lose' || selectedGoal === 'gain') && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.label}>الوزن المستهدف</Text>
              <View style={[styles.inputWrapper, isInputFocused && styles.inputWrapperFocused]}>
                <TextInput
                  style={styles.targetWeightInput}
                  placeholder="75"
                  placeholderTextColor={COLORS.grayText}
                  keyboardType="numeric"
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                />
                <Text style={styles.unitText}>كجم</Text>
              </View>
            </View>
          )}
        </View>
        <View style={styles.footer}>
          <PrimaryButton
            title="التالي"
            onPress={handleNextPress}
            disabled={isButtonDisabled}
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
  buttonPressed: { transform: [{ scale: 0.98 }], shadowOpacity: 0.15 },
  buttonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold', },
  goalCard: { backgroundColor: COLORS.white, paddingVertical: 18, paddingHorizontal: 20, borderRadius: SIZES.radius, marginBottom: 15, borderWidth: 2, borderColor: COLORS.cardBorder, flexDirection: 'row-reverse', alignItems: 'center', shadowColor: '#B0BEC5', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, },
  goalCardSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, elevation: 6, shadowColor: COLORS.primary, shadowOpacity: 0.2, },
  cardPressed: { transform: [{ scale: 0.99 }] },
  goalCardText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textAndIcons, marginRight: 15, },
  goalCardTextSelected: { color: COLORS.white, },
  inputWrapper: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: SIZES.radius, borderWidth: 2, borderColor: COLORS.cardBorder, paddingHorizontal: 15, },
  inputWrapperFocused: { borderColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  targetWeightInput: { flex: 1, paddingVertical: 18, fontSize: 18, color: COLORS.textAndIcons, textAlign: 'right', fontWeight: '500' },
  unitText: { fontSize: 16, color: COLORS.grayText, marginLeft: 8, },
});

// ===================================================================
// --- 5. التصدير الافتراضي (Default Export) ---
// ===================================================================
export default GoalScreen;
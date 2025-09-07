// In ActivityLevelScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

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
        if (!disabled) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }
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

const ActivityCard = ({ title, description, icon, isSelected, onPress }) => {
  const renderIcon = () => {
    if (icon.type === 'image') {
      return (
        <Image
          source={icon.source}
          style={[
            styles.activityCardImage,
            icon.style,
            { tintColor: isSelected ? COLORS.white : COLORS.primary },
          ]}
        />
      );
    }
    return (
      <Icon name={icon.name} size={30} color={isSelected ? COLORS.white : COLORS.primary} style={styles.activityCardIcon} />
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.activityCard,
        isSelected && styles.activityCardSelected,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}>
      {renderIcon()}
      <View style={styles.activityTextContainer}>
        <Text style={[styles.activityCardTitle, isSelected && styles.activityCardTextSelected]}>{title}</Text>
        <Text style={[styles.activityCardDescription, isSelected && styles.activityCardTextSelected]}>{description}</Text>
      </View>
    </Pressable>
  );
};

// ===================================================================
// --- 4. بيانات الخيارات ---
// ===================================================================
const ACTIVITY_LEVELS = [
  {
    key: 'sedentary',
    title: 'خامل',
    description: 'عمل مكتبي، معظم اليوم جلوس، بدون تمارين.',
    icon: {
      type: 'image',
      source: require('./assets/idleman.png'),
      style: { width: 40, height: 40 },
    },
  },
  {
    key: 'light',
    title: 'قليل النشاط',
    description: 'حركة خفيفة أو تمارين 1-2 مرة أسبوعياً.',
    icon: { type: 'icon', name: 'walk' },
  },
  {
    key: 'active',
    title: 'نشيط',
    description: 'تمارين متوسطة الشدة 3-5 مرات أسبوعياً.',
    icon: { type: 'icon', name: 'run' },
  },
  {
    key: 'very_active',
    title: 'نشيط جداً',
    description: 'تمارين يومية عنيفة أو عمل يتطلب مجهوداً بدنياً.',
    icon: {
      type: 'image',
      source: require('./assets/veryactiveman.png'),
      style: { width: 50, height: 50 },
    },
  },
];

// ===================================================================
// --- 5. شاشة مستوى النشاط (ActivityLevelScreen) ---
// ===================================================================
const ActivityLevelScreen = ({ navigation, route }) => {
  const previouslyCollectedData = route.params || {};
  const [selectedActivity, setSelectedActivity] = useState(null);

  const handleSelection = (activityKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedActivity(activityKey);
  };

  // --- *** تعديل مهم: هذه الدالة تنتقل الآن لشاشة النتائج *** ---
  const handleCalculatePlan = () => {
    // تجميع كل البيانات في كائن واحد نهائي
    const finalUserData = {
      ...previouslyCollectedData,
      activityLevel: selectedActivity, // إضافة المعلومة الأخيرة
    };

    // --- الانتقال لشاشة النتائج النهائية مع إرسال كل البيانات ---
    navigation.navigate('Results', { userData: finalUserData });
  };

  const isButtonDisabled = !selectedActivity;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View>
          <ProgressBar step={4} totalSteps={4} />
          <ScreenHeader
            title="كيف تصف مستوى نشاطك؟"
            subtitle="هذا يساعدنا على حساب عدد السعرات التي يحرقها جسمك يومياً."
          />
        </View>

        <View style={styles.cardsContainer}>
          {ACTIVITY_LEVELS.map((level) => (
            <ActivityCard
              key={level.key}
              title={level.title}
              description={level.description}
              icon={level.icon}
              isSelected={selectedActivity === level.key}
              onPress={() => handleSelection(level.key)}
            />
          ))}
        </View>
        
        <View style={styles.footer}>
          <PrimaryButton
            title="احسب خطتي"
            onPress={handleCalculatePlan}
            disabled={isButtonDisabled}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

// ===================================================================
// --- 6. الأنماط (StyleSheet) ---
// ===================================================================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: SIZES.padding, justifyContent: 'space-between', },
  progressBarContainer: { height: 8, width: '100%', backgroundColor: '#E8F5E9', borderRadius: 4 },
  progressBar: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  headerContainer: { alignItems: 'center', marginTop: 15, paddingHorizontal: 10, marginBottom: 15 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.textAndIcons, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 15, color: COLORS.grayText, textAlign: 'center', lineHeight: 22 },
  cardsContainer: {},
  footer: { paddingTop: 10 },
  button: { paddingVertical: 18, borderRadius: SIZES.radius, alignItems: 'center', justifyContent: 'center', width: '100%', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
  buttonEnabled: { backgroundColor: COLORS.primary },
  buttonDisabled: { backgroundColor: COLORS.disabled, elevation: 0, shadowColor: 'transparent' },
  buttonPressed: { transform: [{ scale: 0.98 }], shadowOpacity: 0.15 },
  buttonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  activityCard: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 12, borderRadius: SIZES.radius, marginBottom: 12, borderWidth: 2, borderColor: COLORS.cardBorder, alignItems: 'flex-end', shadowColor: '#B0BEC5', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, },
  activityCardSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, elevation: 6, shadowColor: COLORS.primary, shadowOpacity: 0.2, },
  cardPressed: { transform: [{ scale: 0.99 }], },
  activityCardImage: { marginBottom: 8, resizeMode: 'contain', },
  activityCardIcon: { marginBottom: 8, },
  activityTextContainer: { alignItems: 'flex-end' },
  activityCardTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.textAndIcons, textAlign: 'right', },
  activityCardDescription: { fontSize: 13, color: COLORS.grayText, textAlign: 'right', marginTop: 3, lineHeight: 18, },
  activityCardTextSelected: { color: COLORS.white, },
});

// ===================================================================
// --- 7. التصدير الافتراضي (Default Export) ---
// ===================================================================
export default ActivityLevelScreen;
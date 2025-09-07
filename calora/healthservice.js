// services/HealthService.js

import { Platform } from 'react-native';
import AppleHealthKit from 'react-native-health';
import GoogleFit, { Scopes } from 'react-native-google-fit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// الأذونات التي سنطلبها من المستخدم
const IOS_PERMISSIONS = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.Weight,
    ],
    write: [],
  },
};

const ANDROID_SCOPES = [
  Scopes.FITNESS_ACTIVITY_READ,
  Scopes.BODY_READ,
];

// دالة الربط الرئيسية
const authorize = async () => {
  if (Platform.OS === 'ios') {
    return new Promise((resolve, reject) => {
      AppleHealthKit.initHealthKit(IOS_PERMISSIONS, (error) => {
        if (error) {
          console.error("[HealthService] Error initializing HealthKit:", error);
          return reject(error);
        }
        AsyncStorage.setItem('isHealthKitConnected', 'true');
        resolve(true);
      });
    });
  } else {
    const options = { scopes: ANDROID_SCOPES };
    const authResult = await GoogleFit.authorize(options);
    if (authResult.success) {
      AsyncStorage.setItem('isHealthKitConnected', 'true');
      return true;
    } else {
      console.error("[HealthService] Google Fit Authorization failed:", authResult.message);
      throw new Error(authResult.message);
    }
  }
};

// دالة لجلب السعرات الحرارية المحروقة لليوم الحالي
const getDailyCaloriesBurned = async () => {
  const isConnected = await AsyncStorage.getItem('isHealthKitConnected');
  if (isConnected !== 'true') return 0; // إذا لم يكن متصلاً، لا تفعل شيئاً

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const options = {
    startDate: today.toISOString(),
    endDate: new Date().toISOString(),
  };

  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      AppleHealthKit.getActiveEnergyBurned(options, (err, results) => {
        if (err) {
          console.error("[HealthService] Error getting calories (iOS):", err);
          return resolve(0);
        }
        const totalCalories = results.reduce((sum, entry) => sum + entry.value, 0);
        console.log(`Calories Burned (iOS): ${Math.round(totalCalories)}`);
        resolve(Math.round(totalCalories));
      });
    });
  } else {
    try {
      const res = await GoogleFit.getDailyCalorieSamples(options);
      const entry = res.find(e => e.source === 'com.google.android.gms:estimated_steps');
      const calories = entry ? Math.round(entry.calorie) : 0;
      console.log(`Calories Burned (Android): ${calories}`);
      return calories;
    } catch (err) {
      console.error("[HealthService] Error getting calories (Android):", err);
      return 0;
    }
  }
};

export default {
  authorize,
  getDailyCaloriesBurned,
};
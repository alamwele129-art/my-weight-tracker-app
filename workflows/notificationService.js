// services/notificationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Alert, Platform } from 'react-native';
import allTipsDataFromFile from './tips'; // Make sure path is correct

// --- Constants (Imported from constants.js or ensure they match) ---
// These should match App.js and constants.js
import {
  USER_SETTINGS_KEY,
  APP_LANGUAGE_KEY, // If needed directly here, otherwise passed as param
  DAILY_TIP_NOTIFICATION_TASK, // Should be _V4
  DAILY_NOTIFICATION_ID,       // Should be _V4
  LAST_TIP_INDEX_KEY,          // Should be _V4
  // appTranslations as globalAppTranslations // This will be passed as a parameter now
} from './constants'; // Adjust path to your constants.js

// --- Core Notification Logic ---

// Function to schedule the first tip if needed, or re-schedule if language changes etc.
// This function is now more generic and checks settings before scheduling.
async function scheduleDailyTipNotification(currentLanguage, allTranslations) {
  const translations = allTranslations[currentLanguage] || allTranslations.en;
  try {
    const settingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
    const settings = settingsString ? JSON.parse(settingsString) : {};

    if (settings.notifications === 'off') {
      console.log('[NotificationService] scheduleDailyTip: Notifications are OFF. Cancelling any scheduled.');
      await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_ID);
      return;
    }

    console.log('[NotificationService] scheduleDailyTip: Attempting to schedule/re-schedule...');
    const tipsForCurrentLanguage = allTipsDataFromFile[currentLanguage] || allTipsDataFromFile.en;
    if (!tipsForCurrentLanguage || tipsForCurrentLanguage.length === 0) {
      console.error(`[NotificationService] scheduleDailyTip: No tips for lang ${currentLanguage}`);
      return;
    }

    // Determine next tip
    const lastTipIndexString = await AsyncStorage.getItem(LAST_TIP_INDEX_KEY);
    let lastTipIndex = lastTipIndexString ? parseInt(lastTipIndexString, 10) : -1;
    // If lastTipIndex is invalid or not found, start from 0.
    // This covers the "first tip" scenario and ensures continuity.
    const nextTipIndex = (lastTipIndex === -1 || isNaN(lastTipIndex)) ? 0 : (lastTipIndex + 1) % tipsForCurrentLanguage.length;
    const tipToSend = tipsForCurrentLanguage[nextTipIndex];

    const now = new Date();
    let triggerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0); // 9 AM
    // If 9 AM today has passed, schedule for 9 AM tomorrow
    if (now.getHours() >= 9) { // Simplified: if current hour is 9 or later, schedule for tomorrow
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_ID); // Clear previous
    await Notifications.scheduleNotificationAsync({
      content: {
        title: translations.dailyTipNotificationTitle,
        body: tipToSend,
        data: { screenToNavigate: 'Weight' } // Or your desired screen
      },
      trigger: { date: triggerDate },
      identifier: DAILY_NOTIFICATION_ID,
    });
    // Only update lastTipIndex if we actually schedule one (e.g., for the first time or after a language change)
    // The background task will handle updating the index for subsequent daily tips.
    // However, for consistency when enabling notifications or changing language,
    // we should set the index for the tip we just scheduled.
    await AsyncStorage.setItem(LAST_TIP_INDEX_KEY, nextTipIndex.toString());
    console.log(`[NotificationService] scheduleDailyTip: Scheduled for lang ${currentLanguage} at ${triggerDate.toLocaleString()}. Index: ${nextTipIndex}`);

  } catch (error) {
    console.error("[NotificationService] scheduleDailyTip Error:", error);
    Alert.alert(translations.errorAlertTitle, translations.enableErrorAlertMessage); // Generic error
  }
}


export async function registerDailyTipBackgroundTask(allTranslations, currentLanguage) {
  const translations = allTranslations[currentLanguage] || allTranslations.en;
  try {
    const settingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
    const settings = settingsString ? JSON.parse(settingsString) : {};

    const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_TIP_NOTIFICATION_TASK);

    if (settings.notifications === 'off') {
      console.log('[NotificationService] registerTask: Notifications OFF. Unregistering task if exists.');
      if (isRegistered) {
        await BackgroundFetch.unregisterTaskAsync(DAILY_TIP_NOTIFICATION_TASK);
        console.log('[NotificationService] Background task unregistered because notifications are off.');
      }
      return;
    }

    // If notifications are ON
    if (!isRegistered || __DEV__) {
        if(isRegistered && __DEV__) {
            console.log('[NotificationService - DEV] Unregistering existing task for re-registration.');
            await BackgroundFetch.unregisterTaskAsync(DAILY_TIP_NOTIFICATION_TASK);
        }
      await BackgroundFetch.registerTaskAsync(DAILY_TIP_NOTIFICATION_TASK, {
        minimumInterval: __DEV__ ? (1 * 60) : (15 * 60), // 1 min in dev, 15 mins in prod (BackgroundFetch minimum)
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('[NotificationService] Background task (re)registered successfully.');
    } else {
      console.log('[NotificationService] Background task already registered and notifications are ON.');
    }
  } catch (error) {
    console.error('[NotificationService] Failed to register background task:', error);
    Alert.alert(translations.errorAlertTitle, translations.enableErrorAlertMessage); // Generic error
  }
}


// --- Functions to be called from SettingsScreen via App.js ---
export async function enableDailyNotifications(currentLanguage, allTranslations) {
  const translations = allTranslations[currentLanguage] || allTranslations.en;
  console.log("[NotificationService] Enabling daily notifications...");
  try {
    // SettingsScreen already saves USER_SETTINGS_KEY with notifications: 'on'
    // So, we assume it's 'on' when this function is called.

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
            Alert.alert(translations.permissionRequiredTitle, translations.permissionRequiredMessage);
            // Update settings to 'off' if permission is denied after trying to enable
            let currentSettings = JSON.parse(await AsyncStorage.getItem(USER_SETTINGS_KEY) || '{}');
            currentSettings.notifications = 'off';
            await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(currentSettings));
            console.warn("[NotificationService] Permission denied. Setting notifications to 'off'.");
            return; // Stop if permission denied
        }
    }
    
    // Schedule the *next* tip (could be the first one if new, or next in sequence)
    // This will also handle the 9 AM logic.
    await scheduleDailyTipNotification(currentLanguage, allTranslations);
    await registerDailyTipBackgroundTask(allTranslations, currentLanguage); // Register task

    Alert.alert(translations.notificationsEnabledAlert, translations.notificationsEnabledMessage);
  } catch (error) {
    console.error("[NotificationService] Error enabling notifications:", error);
    Alert.alert(translations.errorAlertTitle, translations.enableErrorAlertMessage);
  }
}

export async function disableDailyNotifications(currentLanguage, allTranslations) {
  const translations = allTranslations[currentLanguage] || allTranslations.en;
  console.log("[NotificationService] Disabling daily notifications...");
  try {
    // SettingsScreen already saves USER_SETTINGS_KEY with notifications: 'off'

    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("[NotificationService] All scheduled notifications cancelled.");

    const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_TIP_NOTIFICATION_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(DAILY_TIP_NOTIFICATION_TASK);
      console.log("[NotificationService] Daily tip background task unregistered.");
    }
    Alert.alert(translations.notificationsDisabledAlert, translations.notificationsDisabledMessage);
  } catch (error) {
    console.error("[NotificationService] Error disabling notifications:", error);
    Alert.alert(translations.errorAlertTitle, translations.disableErrorAlertMessage);
  }
}

// --- Initial Setup Function (to be called from App.js) ---
export async function initializeNotificationsAndTasks(currentLanguage, navigation, allTranslations) {
  const translations = allTranslations[currentLanguage] || allTranslations.en; // Get translations for alerts

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // We only ask for permission here if it's 'undetermined'. If 'denied', user has to go to system settings.
  if (existingStatus === 'undetermined') {
    console.log("[NotificationService] Requesting notification permissions (undetermined).");
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    // Only show this alert if user explicitly tried to enable or if it's the first time (undetermined and then denied)
    // For general startup, just log it. Settings screen will handle specific alerts.
    console.warn(`[NotificationService] Notification permissions status: ${finalStatus}. User may need to enable via system settings.`);
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  Notifications.removeAllNotificationListeners(); // Clear existing listeners
  Notifications.addNotificationReceivedListener(notification => {
    console.log('[NotificationService] Notification Received (foreground):', notification.request.content.title);
  });

  Notifications.addNotificationResponseReceivedListener(response => {
    console.log('[NotificationService] Notification Tapped:', response.notification.request.content.title);
    const screen = response.notification.request.content.data?.screenToNavigate;
    if (screen && navigation?.navigate) {
      navigation.navigate(screen);
    } else {
        console.warn("[NotificationService] Navigation or screen data not available on tap.");
    }
  });

  const settingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
  const settings = settingsString ? JSON.parse(settingsString) : {};

  if (settings.notifications !== 'off') { // If 'on' or undefined (treat undefined as 'on' by default)
    console.log("[NotificationService] Initial setup: Notifications are ON or undefined. Scheduling/Registering.");
    if (finalStatus === 'granted') { // Only proceed if permissions are actually granted
      await scheduleDailyTipNotification(currentLanguage, allTranslations); // Will schedule if needed
      await registerDailyTipBackgroundTask(allTranslations, currentLanguage);
    } else {
      console.warn("[NotificationService] Initial setup: Notifications setting is ON, but permissions not granted. Skipping schedule/register.");
      // Optionally, update settings to 'off' if permissions are denied.
      // settings.notifications = 'off';
      // await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
    }
  } else {
    console.log("[NotificationService] Initial setup: Notifications are OFF by user. No tasks scheduled/registered.");
    const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_TIP_NOTIFICATION_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(DAILY_TIP_NOTIFICATION_TASK);
      console.log("[NotificationService] Unregistered lingering background task as notifications are off.");
    }
    await Notifications.cancelAllScheduledNotificationsAsync(); // Also cancel any stragglers
  }
}
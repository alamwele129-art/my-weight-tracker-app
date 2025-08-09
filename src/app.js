// App.js
import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import React, { useState, useEffect, useCallback, useRef } from "react";
import { NavigationContainer, CommonActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, useColorScheme, ActivityIndicator, View, Alert, Platform, Button, Text } from 'react-native';
import RNRestart from 'react-native-restart';

// --- Screen Imports ---
import IndexScreen from "./Index";
import WeightTracker from "./weighttracker";
import FoodScreen from "./food"; 
import WaterTrackingScreen from "./water";
import StepsScreen from "./steps";
import WeeklyStepsScreen from "./weeklysteps";
import MonthlyStepsScreen from "./Monthlysteps";
import SettingsScreen from "./setting";
import ReportsScreen from "./reports";
import AboutScreen from "./about";
import SignUp from "./signup";
import LoginScreen from "./LoginScreen";
import VerificationCodeScreen from "./VerificationCodeScreen";
import ForgotPasswordScreen from "./ForgotPasswordScreen";
import ResetPasswordScreen from "./ResetPasswordScreen";
import SplashScreen from "./SplashScreen";
import TipsScreen from "./tips";
import ProfileScreen from "./profile";
import EditProfileScreen from "./editprofile";
import AchievementsScreen from "./Achievements";
import DistanceDetailsScreen from '../Distance'; 
import CaloriesDetailsScreen from '../Calories';
import ActiveTimeDetailsScreen from './ActiveTime';    

// --- Service and Constants Imports ---
import {
  initializeNotificationsAndTasks,
  enableDailyNotifications,
  disableDailyNotifications
} from './notificationService';
import {
  APP_LANGUAGE_KEY,
  APP_DARK_MODE_KEY,
  INTENDED_ROUTE_AFTER_RESTART_KEY,
  USER_SETTINGS_KEY,
  LAST_TIP_INDEX_KEY,
  DAILY_TIP_NOTIFICATION_TASK,
  DAILY_NOTIFICATION_ID,
  appTranslations as globalAppTranslations,
} from './constants'; 

// --- Notification Lib Imports ---
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import allTipsDataFromFile from './tips'; 

const Stack = createNativeStackNavigator();

const defaultGlobalAppTranslations = {
  en: {
    restartTitle: "Restart Required",
    restartMessage: "The app needs to restart to apply changes.",
    okButton: "OK",
    manualRestartMessage: "Please restart the app manually.",
    dailyTipNotificationTitle: "Daily Tip"
  },
  ar: {
    restartTitle: "إعادة تشغيل مطلوبة",
    restartMessage: "يحتاج التطبيق إلى إعادة التشغيل لتطبيق التغييرات.",
    okButton: "موافق",
    manualRestartMessage: "يرجى إعادة تشغيل التطبيق يدويًا.",
    dailyTipNotificationTitle: "نصيحة اليوم"
  }
};

const effectiveGlobalAppTranslations = globalAppTranslations || defaultGlobalAppTranslations;

TaskManager.defineTask(DAILY_TIP_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error(`[${DAILY_TIP_NOTIFICATION_TASK} - App.js Define] Error:`, error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
  try {
    console.log(`[${DAILY_TIP_NOTIFICATION_TASK} - App.js Define] Task running: ${new Date().toLocaleString()}`);
    const settingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
    const settings = settingsString ? JSON.parse(settingsString) : {};
    if (settings.notifications === 'off') {
      console.log(`[${DAILY_TIP_NOTIFICATION_TASK} - App.js Define] Notifications OFF in settings. Aborting task.`);
      await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_ID);
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    let currentAppLanguage = 'ar'; 
    try {
        const storedLang = await AsyncStorage.getItem(APP_LANGUAGE_KEY);
        if (storedLang && ['ar', 'en'].includes(storedLang)) currentAppLanguage = storedLang;
    } catch (e) { console.warn(`[${DAILY_TIP_NOTIFICATION_TASK} - App.js Define] Lang fetch error`, e); }
    if (!allTipsDataFromFile || typeof allTipsDataFromFile !== 'object' || !allTipsDataFromFile[currentAppLanguage]) {
        console.error(`[${DAILY_TIP_NOTIFICATION_TASK} - App.js Define] allTipsDataFromFile is not loaded, not an object, or no tips for lang ${currentAppLanguage}.`);
        const fallbackTips = allTipsDataFromFile && allTipsDataFromFile.en;
        if (!fallbackTips || fallbackTips.length === 0) {
            return BackgroundFetch.BackgroundFetchResult.Failed;
        }
    }
    const tipsForCurrentLanguage = allTipsDataFromFile[currentAppLanguage] || allTipsDataFromFile.en;
    if (!tipsForCurrentLanguage || tipsForCurrentLanguage.length === 0) {
      console.error(`[${DAILY_TIP_NOTIFICATION_TASK} - App.js Define] No tips available for lang ${currentAppLanguage} or fallback.`);
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    const lastTipIndexString = await AsyncStorage.getItem(LAST_TIP_INDEX_KEY);
    let lastTipIndex = lastTipIndexString ? parseInt(lastTipIndexString, 10) : -1;
    const nextTipIndex = (lastTipIndex + 1) % tipsForCurrentLanguage.length;
    const tipToSend = tipsForCurrentLanguage[nextTipIndex];
    const taskTranslations = (effectiveGlobalAppTranslations[currentAppLanguage])
                           ? effectiveGlobalAppTranslations[currentAppLanguage]
                           : effectiveGlobalAppTranslations.en; 
    const now = new Date();
    let triggerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0); // Trigger at 9 AM
    if (now.getHours() >= 9) { 
        triggerDate.setDate(triggerDate.getDate() + 1);
    }
    await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_ID);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: taskTranslations.dailyTipNotificationTitle,
        body: tipToSend,
        data: { screenToNavigate: 'Weight' }
      },
      trigger: { date: triggerDate },
      identifier: DAILY_NOTIFICATION_ID,
    });
    await AsyncStorage.setItem(LAST_TIP_INDEX_KEY, nextTipIndex.toString());
    console.log(`[${DAILY_TIP_NOTIFICATION_TASK} - App.js Define] Tip scheduled for ${currentAppLanguage} at ${triggerDate.toLocaleString()}. Index: ${nextTipIndex}`);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error(`[${DAILY_TIP_NOTIFICATION_TASK} - App.js Define] Execution Error:`, err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [appLanguage, setAppLanguage] = useState(I18nManager.isRTL ? 'ar' : 'en');
  const systemColorScheme = useColorScheme();
  const [isAppDarkMode, setIsAppDarkMode] = useState(systemColorScheme === 'dark');
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const navigationRef = useRef(null);

  useEffect(() => {
    const loadPreferencesAndSetupRTL = async () => {
      let currentLang = I18nManager.isRTL ? 'ar' : 'en';
      try {
        const storedLang = await AsyncStorage.getItem(APP_LANGUAGE_KEY);
        if (storedLang && ['ar', 'en'].includes(storedLang)) {
          currentLang = storedLang;
        } else {
          await AsyncStorage.setItem(APP_LANGUAGE_KEY, currentLang);
        }
      } catch (e) { console.error("App.js: Failed to load/set language", e); }
      
      if (appLanguage !== currentLang) {
          setAppLanguage(currentLang);
      }
      const isRTL = currentLang === 'ar';
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
      }
      let currentIsDark = systemColorScheme === 'dark';
      try {
        const storedDarkMode = await AsyncStorage.getItem(APP_DARK_MODE_KEY);
        if (storedDarkMode !== null) {
          currentIsDark = storedDarkMode === 'true';
        } else {
          await AsyncStorage.setItem(APP_DARK_MODE_KEY, String(currentIsDark));
        }
      } catch (e) {
        console.error("App.js: Failed to load/set dark mode preference", e);
      }
      if (isAppDarkMode !== currentIsDark) {
          setIsAppDarkMode(currentIsDark);
      }
      
      setIsLoadingPreferences(false);
    };
    loadPreferencesAndSetupRTL();
  }, []);

  useEffect(() => {
    if (!isLoadingPreferences) {
      const timer = setTimeout(() => setShowSplash(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoadingPreferences]);

  useEffect(() => {
    if (!isLoadingPreferences && navigationRef.current) {
        console.log(`App.js: Preferences loaded. Lang: ${appLanguage}, DarkMode: ${isAppDarkMode}. Initializing notifications.`);
        initializeNotificationsAndTasks(appLanguage, navigationRef.current, effectiveGlobalAppTranslations);
    }
  }, [isLoadingPreferences, appLanguage, isAppDarkMode]); 
  
  const handleChangeLanguage = useCallback(async (newLang) => {
    if (newLang === appLanguage) return;
    const translations = effectiveGlobalAppTranslations[newLang] || effectiveGlobalAppTranslations.en;
    try {
      await AsyncStorage.setItem(APP_LANGUAGE_KEY, newLang);
      setAppLanguage(newLang);
      const isNewRTL = newLang === 'ar';
      if (I18nManager.isRTL !== isNewRTL) {
        I18nManager.forceRTL(isNewRTL);
        Alert.alert(
          translations.restartTitle,
          translations.restartMessage,
          [{ text: translations.okButton, onPress: () => {
              if (RNRestart && typeof RNRestart.Restart === 'function') {
                RNRestart.Restart();
              } else {
                console.warn("RNRestart is not available. Please restart the app manually.");
                Alert.alert(translations.restartTitle, translations.manualRestartMessage || "Please restart manually.");
              }
          }}]
        );
      } else {
        console.log("App.js: Language changed without RTL switch. Re-initializing notifications.");
        if (navigationRef.current) {
            initializeNotificationsAndTasks(newLang, navigationRef.current, effectiveGlobalAppTranslations);
        }
      }
    } catch (e) { console.error("App.js: Failed to save language or restart", e); }
  }, [appLanguage]);

  const handleToggleDarkMode = useCallback(async (newDarkModeState) => {
    if (newDarkModeState === isAppDarkMode) return;
    try {
      await AsyncStorage.setItem(APP_DARK_MODE_KEY, String(newDarkModeState));
      setIsAppDarkMode(newDarkModeState);
    } catch (e) { console.error("App.js: Failed to save dark mode preference", e); }
  }, [isAppDarkMode]);

  const onNavigationReady = useCallback(async () => {
    console.log("App.js: Navigation is ready.");
    if (!isLoadingPreferences && navigationRef.current) {
        initializeNotificationsAndTasks(appLanguage, navigationRef.current, effectiveGlobalAppTranslations);
    }
    if (isLoadingPreferences || showSplash) return;
    try {
      const intendedRouteName = await AsyncStorage.getItem(INTENDED_ROUTE_AFTER_RESTART_KEY);
      if (intendedRouteName) {
        await AsyncStorage.removeItem(INTENDED_ROUTE_AFTER_RESTART_KEY);
        if (navigationRef.current) {
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [ { name: 'Index' }, { name: intendedRouteName } ],
            })
          );
        }
      }
    } catch (error) {
      console.error("[App.js] Error handling intended route after restart:", error);
    }
  }, [isLoadingPreferences, showSplash, appLanguage, isAppDarkMode]);

  if (isLoadingPreferences || showSplash) {
    if (showSplash) {
        return <SplashScreen />;
    }
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isAppDarkMode ? '#121212' : '#FFF' }}>
            <ActivityIndicator size="large" color={isAppDarkMode ? '#FFFFFF' : '#000000'}/>
        </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Index">
              {(props) => <IndexScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
            </Stack.Screen>
            <Stack.Screen name="SignUp">
                 {(props) => <SignUp {...props} language={appLanguage} darkMode={isAppDarkMode} />}
            </Stack.Screen>
            <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
            </Stack.Screen>
             <Stack.Screen name="ForgotPassword">
                 {(props) => <ForgotPasswordScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
              </Stack.Screen>
              <Stack.Screen name="VerificationCode">
                {(props) => <VerificationCodeScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
              </Stack.Screen>
              <Stack.Screen name="ResetPassword">
                 {(props) => <ResetPasswordScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
              </Stack.Screen>
              
              {/* --- >>>>> تعديل رئيسي هنا <<<<< --- */}
              {/* هذا هو الترتيب الصحيح للشاشات لضمان عمل الملاحة بشكل سليم */}
              
              <Stack.Screen name="Weight">
                 {(props) => <WeightTracker {...props} language={appLanguage} darkMode={isAppDarkMode} />}
              </Stack.Screen>

              <Stack.Screen name="profile">
                 {(props) => <ProfileScreen
                                {...props}
                                language={appLanguage}
                                darkMode={isAppDarkMode}
                                navigateToSettings={() => props.navigation.navigate('Setting')}
                                navigateToAbout={() => props.navigation.navigate('About')}
                                navigateToEditProfile={() => props.navigation.navigate('editprofile')}
                                goBack={() => props.navigation.canGoBack() && props.navigation.goBack()}
                              />}
              </Stack.Screen>

              <Stack.Screen name="editprofile">
                 {(props) => <EditProfileScreen
                                {...props}
                                language={appLanguage}
                                darkMode={isAppDarkMode}
                                goBack={() => props.navigation.canGoBack() && props.navigation.goBack()}
                                onSaveSuccess={(savedData) => {
                                  console.log("App.js: Profile saved, navigating back.", savedData);
                                  if(props.navigation.canGoBack()) props.navigation.goBack();
                                }}
                              />}
              </Stack.Screen>
              
              <Stack.Screen name="Food">
                 {(props) => <FoodScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
              </Stack.Screen>
              <Stack.Screen name="Water">
                 {(props) => <WaterTrackingScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
              </Stack.Screen>
              <Stack.Screen name="Steps">
                {(props) => <StepsScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
              </Stack.Screen>
              <Stack.Screen name="WeeklySteps">
                {(props) => <WeeklyStepsScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
              </Stack.Screen>
              <Stack.Screen name="MonthlySteps">
                {(props) => <MonthlyStepsScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
              </Stack.Screen>
              <Stack.Screen name="Reports">
                 {(props) => <ReportsScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
              </Stack.Screen>
              <Stack.Screen name="Tips">
                {(props) => <TipsScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
              </Stack.Screen>
              <Stack.Screen name="Achievements">
                {(props) => <AchievementsScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
              </Stack.Screen>
            
            <Stack.Screen name="Distance">
              {(props) => <DistanceDetailsScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
            </Stack.Screen>
            <Stack.Screen name="Calories">
              {(props) => <CaloriesDetailsScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
            </Stack.Screen>
            <Stack.Screen name="ActiveTime">
              {(props) => <ActiveTimeDetailsScreen {...props} language={appLanguage} darkMode={isAppDarkMode} />}
            </Stack.Screen>
            
            <Stack.Screen name="Setting">
              {(props) => (
                <SettingsScreen
                  {...props}
                  languageProp={appLanguage}
                  changeLanguageProp={handleChangeLanguage} // الاسم الصحيح
                  darkModeProp={isAppDarkMode}
                  toggleDarkModeProp={handleToggleDarkMode} // الاسم الصحيح
                  enableNotifications={async () => {
                      if (effectiveGlobalAppTranslations) await enableDailyNotifications(appLanguage, effectiveGlobalAppTranslations);
                  }}
                  disableNotifications={async () => {
                      if (effectiveGlobalAppTranslations) await disableDailyNotifications(appLanguage, effectiveGlobalAppTranslations);
                  }}
                  goBack={() => props.navigation.canGoBack() && props.navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="About">
                 {(props) => <AboutScreen 
                                {...props} 
                                language={appLanguage} 
                                darkMode={isAppDarkMode}
                                // تمرير دالة الرجوع الصحيحة
                                goBack={() => props.navigation.canGoBack() && props.navigation.goBack()}
                              />}
            </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>

      {__DEV__ && (
        <View style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 1000, backgroundColor:'rgba(200,200,200,0.7)', padding:5, borderRadius:5 }}>
            <Text style={{fontWeight:'bold'}}>Dev Controls (App.js):</Text>
            <Button title="Enable Notifs (Svc)" onPress={async () => {
                if (effectiveGlobalAppTranslations) await enableDailyNotifications(appLanguage, effectiveGlobalAppTranslations);
            }} />
            <View style={{height:2}}/>
            <Button title="Disable Notifs (Svc)" onPress={async () => {
                if (effectiveGlobalAppTranslations) await disableDailyNotifications(appLanguage, effectiveGlobalAppTranslations);
            }} />
            <View style={{height:2}}/>
            <Button title="Clear Tip Data & Notifs" onPress={async () => {
                await AsyncStorage.removeItem(LAST_TIP_INDEX_KEY);
                await Notifications.cancelAllScheduledNotificationsAsync();
                console.log("Cleared last tip index and cancelled all scheduled notifications.");
                Alert.alert("Cleared", "Tip data and scheduled notifications cleared.");
            }} />
            <View style={{height:2}}/>
            <Button title="Force Run Task (DEV)" onPress={async () => {
                console.log("Attempting to manually trigger BackgroundFetch task");
                Alert.alert("DEV: Trigger Task", "Check console for task logs.");
            }} />
             <Text style={{fontSize:10}}>Lang: {appLanguage}, Dark: {isAppDarkMode ? 'On' : 'Off'}</Text>
        </View>
      )}
    </SafeAreaProvider>
  );
};
export default App;
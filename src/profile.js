// ProfileScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet, View, Text, Image, TouchableOpacity, ScrollView,
  StatusBar, Platform, Alert, I18nManager, ActivityIndicator // Added ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';

// --- Translation Strings (remains the same) ---
const translations = {
  en: {
    profile: 'Profile', settings: 'Settings', aboutApp: 'About App', logout: 'Logout',
    loadingEmail: 'Loading email...', emailNotFound: 'Email not found', errorLoadingData: 'Error loading data',
    userNamePlaceholder: 'User Name', edit: 'Edit', logoutConfirmTitle: 'Logout',
    logoutConfirmMessage: 'Are you sure you want to log out?', logoutErrorTitle: 'Logout Error',
    logoutErrorMessage: 'Could not clear session data.', ok: 'OK', cancel: 'Cancel',
    editProfile: 'Edit Profile', editProfileNotSetup: 'Navigation to edit profile screen is not set up.',
    languageChangeAlertTitle: "Language Change",
    languageChangeAlertMessage: "Please restart the app for language changes to take full effect.",
    loadingProfile: "Loading Profile...",
  },
  ar: {
    profile: 'الملف الشخصي', settings: 'الإعدادات', aboutApp: 'حول التطبيق', logout: 'تسجيل الخروج',
    loadingEmail: 'جار تحميل البريد...', emailNotFound: 'لم يتم العثور على البريد الإلكتروني', errorLoadingData: 'خطأ في تحميل البيانات',
    userNamePlaceholder: 'اسم المستخدم', edit: 'تعديل', logoutConfirmTitle: 'تسجيل الخروج',
    logoutConfirmMessage: 'هل أنت متأكد أنك تريد تسجيل الخروج؟', logoutErrorTitle: 'خطأ في تسجيل الخروج',
    logoutErrorMessage: 'لم يتم مسح بيانات الجلسة.', ok: 'موافق', cancel: 'إلغاء',
    editProfile: 'تعديل الملف الشخصي', editProfileNotSetup: 'الانتقال إلى شاشة تعديل الملف الشخصي غير مجهز.',
    languageChangeAlertTitle: "تغيير اللغة",
    languageChangeAlertMessage: "يرجى إعادة تشغيل التطبيق لتطبيق تغييرات اللغة بشكل كامل.",
    loadingProfile: "جار تحميل الملف الشخصي...",
  },
};

// --- Theme Color Definitions (remains the same) ---
const colors = {
    primaryGreen: '#4CAF50', white: '#ffffff', black: '#000000', lightGrey: '#f0f0f0', mediumGrey: '#777777', darkGrey: '#333333',
    darkBackground: '#121212', darkCard: '#1e1e1e', darkText: '#e0e0e0', darkSubtleText: '#a0a0a0', lightRed: '#d9534f',
    darkRed: '#ff6b6b', lightPlaceholderBg: '#eeeeee', darkPlaceholderBg: '#444444',
};
const lightTheme = {
    background: colors.lightGrey, cardBackground: colors.white, text: colors.darkGrey, subtleText: colors.mediumGrey, primary: colors.primaryGreen,
    headerText: colors.white, iconOnCard: colors.primaryGreen, arrowOnCard: colors.mediumGrey, logoutText: colors.lightRed, statusBar: 'dark-content',
    statusBarBg: colors.primaryGreen, shadow: colors.black, profileBorder: colors.white, placeholderBg: colors.lightPlaceholderBg, headerIconColor: colors.white,
    activityIndicator: colors.primaryGreen,
};
const darkTheme = {
    background: colors.darkBackground, cardBackground: colors.darkCard, text: colors.darkText, subtleText: colors.darkSubtleText, primary: colors.primaryGreen,
    headerText: colors.white, iconOnCard: colors.primaryGreen, arrowOnCard: colors.darkSubtleText, logoutText: colors.darkRed, statusBar: 'light-content',
    statusBarBg: colors.primaryGreen, shadow: colors.black, profileBorder: colors.darkCard, placeholderBg: colors.darkPlaceholderBg, headerIconColor: colors.white,
    activityIndicator: colors.white,
};

// --- Constants (remains the same) ---
const ICON_SIZE = 24;
const HEADER_ICON_SIZE = 28;
const DEFAULT_PROFILE_IMAGE_URI = 'https://via.placeholder.com/150/DDDDDD/808080?text=User';
const DEFAULT_PROFILE_ASSET = require('./assets/profile.png');

// --- AsyncStorage Keys (remains the same) ---
const APP_LANGUAGE_KEY = '@App:language';
// APP_DARK_MODE_KEY is not read here directly anymore, passed as prop
const USER_PROFILE_DATA_KEY = '@Profile:userProfileData';
const LOGGED_IN_EMAIL_KEY = 'loggedInUserEmail';

// --- Dynamic Style Generation Function (remains the same) ---
const getStyles = (themeMode) => {
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;
  return StyleSheet.create({
    screenContainer: { flex: 1, backgroundColor: theme.background },
    header: {
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
      paddingBottom: 20, paddingHorizontal: 15,
      borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: theme.primary,
    },
    backButton: { padding: 5 },
    headerTitle: {
      fontSize: 22, fontWeight: 'bold', color: theme.headerText,
      flex: 1, textAlign: 'center',
    },
    scrollContainer: { flex: 1, marginTop: -30 },
    scrollContentContainer: { paddingHorizontal: 15, paddingBottom: 30, paddingTop: 40 },
    card: {
      backgroundColor: theme.cardBackground, borderRadius: 20,
      paddingVertical: 20, paddingHorizontal: 15,
      shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
      alignItems: 'center', position: 'relative',
    },
    cardTopIcons: {
      position: 'absolute', top: 15, left: 15, right: 15,
      flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center', zIndex: 1,
    },
    iconPlaceholder: { width: ICON_SIZE + 10, height: ICON_SIZE + 10 },
    iconButton: { padding: 5 },
    profilePicContainer: {
      marginTop: 25, marginBottom: 15,
      width: 110, height: 110, borderRadius: 55, overflow: 'hidden',
      borderWidth: 3, borderColor: theme.profileBorder,
      shadowColor: theme.shadow, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15, shadowRadius: 3, elevation: 3,
      backgroundColor: theme.placeholderBg,
    },
    profilePic: { width: '100%', height: '100%' },
    userInfoContainer: { alignItems: 'center', marginBottom: 25 },
    userName: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 4, textAlign: 'center' },
    userEmail: { fontSize: 14, color: theme.subtleText, textAlign: 'center' },
    menuContainer: { width: '100%' },
    menuItem: {
      flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
      alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 15, width: '100%',
    },
    menuItemContent: {
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
        alignItems: 'center'
    },
    menuIcon: {
        marginRight: I18nManager.isRTL ? 0 : 15,
        marginLeft: I18nManager.isRTL ? 15 : 0,
    },
    menuText: {
        fontSize: 16, color: theme.text,
        textAlign: I18nManager.isRTL ? 'right' : 'left',
    },
    logoutText: { color: theme.logoutText },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background, // Use theme background for loading
    },
    loadingText: {
        fontSize: 18,
        marginTop: 10,
        color: theme.text, // Use theme text for loading
    }
  });
};

// --- Main Component ---
const ProfileScreen = ({
  navigation, // Directly use navigation from props if passed by Stack.Screen
  language,   // language prop from App.js
  darkMode,   // darkMode prop from App.js
  // Navigation functions passed from App.js
  navigateToSettings,
  navigateToAbout,
  navigateToEditProfile,
  goBack,
}) => {
  // const navigation = useNavigation(); // Can be removed if navigation prop is used consistently

  // Use props for language and darkMode
  const [currentLanguage, setCurrentLanguage] = useState(language || (I18nManager.isRTL ? 'ar' : 'en'));
  const [currentThemeMode, setCurrentThemeMode] = useState(darkMode ? 'dark' : 'light');

  useEffect(() => {
    if (language && language !== currentLanguage) {
        setCurrentLanguage(language);
    }
  }, [language, currentLanguage]);

  useEffect(() => {
    const newThemeMode = darkMode ? 'dark' : 'light';
    if (newThemeMode !== currentThemeMode) {
        setCurrentThemeMode(newThemeMode);
    }
  }, [darkMode, currentThemeMode]);


  const t = useCallback((key) => {
     return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  }, [currentLanguage]);

  const [displayedUsername, setDisplayedUsername] = useState(() => t('userNamePlaceholder'));
  const [displayedEmail, setDisplayedEmail] = useState(() => t('loadingEmail'));
  const [profileImageUri, setProfileImageUri] = useState(DEFAULT_PROFILE_IMAGE_URI);
  const [isInitialized, setIsInitialized] = useState(false); // To show loading indicator initially

  const loadProfileData = useCallback(async () => {
    console.log("ProfileScreen: loadProfileData triggered. Language:", currentLanguage, "Theme:", currentThemeMode);
    // Language and Theme are now managed by props and state sync
    let loadedUsername = null;
    let loadedImageUrl = null;
    let loggedInUserEmail = null;

    try {
      // Load profile specific data
      const userProfileDataString = await AsyncStorage.getItem(USER_PROFILE_DATA_KEY);
      if (userProfileDataString) {
        try {
          const profileData = JSON.parse(userProfileDataString);
          loadedUsername = profileData.username || null;
          loadedImageUrl = profileData.profileImageUrl || null;
        } catch (parseError) {
          console.error("[ProfileScreen] Failed to parse userProfileData:", parseError);
        }
      }

      loggedInUserEmail = await AsyncStorage.getItem(LOGGED_IN_EMAIL_KEY);

      // Use the currentLanguage from state for translations
      const localT = (key) => translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
      setDisplayedUsername(loadedUsername || localT('userNamePlaceholder'));
      setDisplayedEmail(loggedInUserEmail || localT('emailNotFound'));
      setProfileImageUri(loadedImageUrl || DEFAULT_PROFILE_IMAGE_URI);

    } catch (error) {
      console.error("[ProfileScreen] Error loading profile data:", error);
      // Fallback to English if error
      const errorLang = 'en';
      const errorT = (key) => translations[errorLang]?.[key] || key;
      setCurrentLanguage(errorLang); // Potentially set to English on error
      setDisplayedUsername(errorT('userNamePlaceholder'));
      setDisplayedEmail(errorT('errorLoadingData'));
      setProfileImageUri(DEFAULT_PROFILE_IMAGE_URI);
    } finally {
        setIsInitialized(true);
    }
  }, [currentLanguage, currentThemeMode]); // Dependencies for re-running if lang/theme changes externally

  useEffect(() => {
      loadProfileData();
  }, [loadProfileData]); // Initial load and when loadProfileData changes (due to lang/theme)

  useFocusEffect(
    useCallback(() => {
      console.log("ProfileScreen focused, reloading profile data.");
      setIsInitialized(false); // Show loading indicator on focus
      loadProfileData(); // Reload data when screen comes into focus
      return () => {};
    }, [loadProfileData]) // loadProfileData has currentLanguage and currentThemeMode as dependencies
  );


  const handleSettingsPress = () => {
    if (navigateToSettings) navigateToSettings();
    // else navigation.navigate('Setting'); // Fallback if not passed
  };

  const handleAboutPress = () => {
    if (navigateToAbout) navigateToAbout();
    // else Alert.alert("Info", "About App screen not implemented yet.");
  };

  const handleEditProfilePress = () => {
    if (navigateToEditProfile) navigateToEditProfile();
    // else Alert.alert("Info", t('editProfileNotSetup'));
  };

  const handleGoBack = () => {
    if (goBack) goBack();
    // else if (navigation.canGoBack()) navigation.goBack();
  };

  const handleLogoutPress = () => {
    Alert.alert(
      t('logoutConfirmTitle'),
      t('logoutConfirmMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('ok'),
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([LOGGED_IN_EMAIL_KEY, USER_PROFILE_DATA_KEY]);

              setDisplayedEmail(t('emailNotFound'));
              setDisplayedUsername(t('userNamePlaceholder'));
              setProfileImageUri(DEFAULT_PROFILE_IMAGE_URI);

              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [ { name: 'Index' } ], // Make sure 'Index' is your initial auth/splash screen
                })
              );
            } catch (error) {
              console.error("[ProfileScreen] Logout error:", error);
              Alert.alert(t('logoutErrorTitle'), t('logoutErrorMessage'));
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const styles = getStyles(currentThemeMode);
  const currentThemeColors = currentThemeMode === 'dark' ? darkTheme : lightTheme;

  const profileImageSource = (profileImageUri === DEFAULT_PROFILE_IMAGE_URI || !profileImageUri)
    ? DEFAULT_PROFILE_ASSET
    : { uri: profileImageUri };
  const imageKey = (profileImageUri === DEFAULT_PROFILE_IMAGE_URI || !profileImageUri) ? 'default_asset' : profileImageUri;

  if (!isInitialized) {
    // Use currentThemeMode for loading screen as well
    const loadingStyles = getStyles(currentThemeMode);
    return (
        <View style={[loadingStyles.loadingContainer]}>
            <StatusBar
                barStyle={currentThemeColors.statusBar}
                backgroundColor={currentThemeColors.statusBarBg}
            />
            <ActivityIndicator size="large" color={currentThemeColors.activityIndicator} />
            <Text style={loadingStyles.loadingText}>{t('loadingProfile')}</Text>
        </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <StatusBar
          barStyle={currentThemeColors.statusBar}
          backgroundColor={currentThemeColors.statusBarBg}
      />
      <View style={styles.header}>
         <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
           <Icon name={I18nManager.isRTL ? "arrow-forward-outline" : "arrow-back-outline"} size={HEADER_ICON_SIZE} color={currentThemeColors.headerIconColor} />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>{t('profile')}</Text>
         <View style={{ width: HEADER_ICON_SIZE + (styles.backButton?.padding || 0) * 2 }} />
       </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        key={`${currentLanguage}-${currentThemeMode}`} // Re-render if lang or theme changes
      >
        <View style={styles.card}>
           <View style={styles.cardTopIcons}>
             <View style={styles.iconPlaceholder} />
             <TouchableOpacity style={styles.iconButton} onPress={handleEditProfilePress}>
               <Icon name="create-outline" size={ICON_SIZE} color={currentThemeColors.iconOnCard} />
             </TouchableOpacity>
           </View>

           <View style={styles.profilePicContainer}>
             <Image
                source={profileImageSource}
                style={styles.profilePic}
                key={imageKey}
                resizeMode="cover"
                onError={(e) => {
                    console.warn("[ProfileScreen] Failed to load profile image URI:", e.nativeEvent.error);
                    if (profileImageUri !== DEFAULT_PROFILE_IMAGE_URI) {
                       setProfileImageUri(DEFAULT_PROFILE_IMAGE_URI); // Fallback to default placeholder
                    }
                }}
             />
           </View>

           <View style={styles.userInfoContainer}>
             <Text style={styles.userName} numberOfLines={1}>{displayedUsername}</Text>
             <Text style={styles.userEmail} numberOfLines={1}>{displayedEmail}</Text>
           </View>

           <View style={styles.menuContainer}>
             <TouchableOpacity style={styles.menuItem} onPress={handleSettingsPress} activeOpacity={0.6}>
               <View style={styles.menuItemContent}>
                 <Icon name="settings-outline" size={ICON_SIZE} color={currentThemeColors.iconOnCard} style={styles.menuIcon} />
                 <Text style={styles.menuText}>{t('settings')}</Text>
               </View>
               <Icon name={I18nManager.isRTL ? "chevron-back-outline" : "chevron-forward-outline"} size={ICON_SIZE - 2} color={currentThemeColors.arrowOnCard} />
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={handleAboutPress} activeOpacity={0.6}>
               <View style={styles.menuItemContent}>
                 <Icon name="information-circle-outline" size={ICON_SIZE} color={currentThemeColors.iconOnCard} style={styles.menuIcon} />
                 <Text style={styles.menuText}>{t('aboutApp')}</Text>
               </View>
               <Icon name={I18nManager.isRTL ? "chevron-back-outline" : "chevron-forward-outline"} size={ICON_SIZE - 2} color={currentThemeColors.arrowOnCard} />
             </TouchableOpacity>

             <TouchableOpacity style={styles.menuItem} onPress={handleLogoutPress} activeOpacity={0.6}>
               <View style={styles.menuItemContent}>
                 <Icon name="log-out-outline" size={ICON_SIZE} color={currentThemeColors.logoutText} style={styles.menuIcon} />
                 <Text style={[styles.menuText, styles.logoutText]}>{t('logout')}</Text>
               </View>
               <Icon name={I18nManager.isRTL ? "chevron-back-outline" : "chevron-forward-outline"} size={ICON_SIZE - 2} color={currentThemeColors.arrowOnCard} />
             </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
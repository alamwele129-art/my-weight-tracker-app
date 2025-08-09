// SettingsScreen.js (الكود الكامل والمعدل)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  I18nManager,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

// --- AsyncStorage Keys ---
const USER_SETTINGS_KEY = '@Settings:generalSettings';
const USER_PROFILE_DATA_KEY = '@Profile:userProfileData';

const SettingsScreen = ({
  navigation,
  languageProp,
  changeLanguageProp,
  darkModeProp,
  toggleDarkModeProp,
  goBack,
  updateGoalWeightInParent,
  enableNotifications,
  disableNotifications,
}) => {
  const [username, setUsername] = useState('');
  const [height, setHeight] = useState('');
  const [weightGoal, setWeightGoal] = useState('');
  const [notifications, setNotifications] = useState('on');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languageProp);
  const [isDarkMode, setIsDarkMode] = useState(darkModeProp);

  useEffect(() => {
    setSelectedLanguage(languageProp);
    setIsDarkMode(darkModeProp);
  }, [languageProp, darkModeProp]);

  // Translations object
  const translations = {
    ar: {
      settingsTitle: 'الإعدادات',
      usernameLabel: 'اسم المستخدم:',
      heightLabel: 'الطول (سم):',
      weightGoalLabel: 'هدف الوزن (كجم):',
      languageLabel: 'اللغة:',
      notificationsLabel: 'الإشعارات:',
      notificationsOn: 'تشغيل',
      notificationsOff: 'إيقاف',
      saveButton: 'حفظ الإعدادات',
      modalMessage: 'تم حفظ الإعدادات بنجاح!',
      modalButton: 'موافق',
      darkModeLabel: 'الوضع الداكن:',
      backArrow: '←',
      saveErrorTitle: 'خطأ',
      saveErrorMessage: 'فشل حفظ الإعدادات.',
      loadErrorTitle: 'خطأ',
      loadErrorMessage: 'فشل تحميل الإعدادات.',
      placeholderUsername: 'أدخل اسم المستخدم',
      placeholderHeight: 'أدخل الطول',
      placeholderWeightGoal: 'أدخل الوزن المستهدف',
      languageChangeAlertTitle: "تغيير اللغة",
      languageChangeAlertMessage: "يرجى إعادة تشغيل التطبيق لتطبيق تغييرات اللغة بشكل كامل.",
    },
    en: {
      settingsTitle: 'Settings',
      usernameLabel: 'Username:',
      heightLabel: 'Height (cm):',
      weightGoalLabel: 'Weight Goal (kg):',
      languageLabel: 'Language:',
      notificationsLabel: 'Notifications:',
      notificationsOn: 'On',
      notificationsOff: 'Off',
      saveButton: 'Save Settings',
      modalMessage: 'Settings saved successfully!',
      modalButton: 'OK',
      darkModeLabel: 'Dark Mode:',
      backArrow: '←',
      saveErrorTitle: 'Error',
      saveErrorMessage: 'Failed to save settings.',
      loadErrorTitle: 'Error',
      loadErrorMessage: 'Failed to load settings.',
      placeholderUsername: 'Enter username',
      placeholderHeight: 'Enter height',
      placeholderWeightGoal: 'Enter weight goal',
      languageChangeAlertTitle: "Language Change",
      languageChangeAlertMessage: "Please restart the app for language changes to take full effect.",
    }
  };
  
  const t = translations[selectedLanguage] || translations.en;

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const generalSettingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
        if (generalSettingsString) {
          const gs = JSON.parse(generalSettingsString);
          setHeight(gs.height ? String(gs.height) : ''); // Always convert to string for TextInput
          setWeightGoal(gs.weightGoal ? String(gs.weightGoal) : ''); // Always convert to string for TextInput
          setNotifications(gs.notifications === undefined ? 'on' : gs.notifications);
        }
        const profileDataString = await AsyncStorage.getItem(USER_PROFILE_DATA_KEY);
        if (profileDataString) {
          const pd = JSON.parse(profileDataString);
          setUsername(pd.username || '');
        }
      } catch (error) {
        console.error("[SettingsScreen] Failed to load form data:", error);
        Alert.alert(t.loadErrorTitle, t.loadErrorMessage);
      }
    };
    loadFormData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAllSettings = async () => {
    try {
      // --- START: MODIFICATION FOR DATA INTEGRITY ---
      // Use parseFloat to convert text input to a floating-point number.
      // If the input is empty or invalid, it will store `null`.
      const parsedHeight = parseFloat(height) || null;
      const parsedWeightGoal = parseFloat(weightGoal) || null;

      const generalSettingsToSave = {
        height: parsedHeight,
        weightGoal: parsedWeightGoal,
        notifications,
      };
      // --- END: MODIFICATION FOR DATA INTEGRITY ---

      await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(generalSettingsToSave));
      
      let userProfileData = {};
      const existingProfileDataString = await AsyncStorage.getItem(USER_PROFILE_DATA_KEY);
      if (existingProfileDataString) {
        userProfileData = JSON.parse(existingProfileDataString);
      }
      userProfileData.username = username.trim() || null;
      await AsyncStorage.setItem(USER_PROFILE_DATA_KEY, JSON.stringify(userProfileData));

      if (selectedLanguage !== languageProp) {
        if (changeLanguageProp) await changeLanguageProp(selectedLanguage);
      }

      if (isDarkMode !== darkModeProp) {
        if (toggleDarkModeProp) await toggleDarkModeProp(isDarkMode);
      }

      if (notifications === 'on') {
        if (enableNotifications) await enableNotifications();
      } else if (notifications === 'off') {
        if (disableNotifications) await disableNotifications();
      }

      if (updateGoalWeightInParent && weightGoal) {
        // Pass the parsed number, not the string
        updateGoalWeightInParent(parsedWeightGoal);
      }
      
      setModalVisible(true);
    } catch (error) {
      console.error("[SettingsScreen] Failed to save settings:", error);
      Alert.alert(t.saveErrorTitle, t.saveErrorMessage);
    }
  };

  const handleGoBack = () => {
    if (goBack) goBack();
    else if (navigation) navigation.goBack();
  };

  const handleLanguageChange = (newLang) => setSelectedLanguage(newLang);
  const handleDarkModeToggle = (newDarkModeValue) => setIsDarkMode(newDarkModeValue === 'true');
  
  const dynamicStyles = styles(isDarkMode);

  return (
    <ScrollView
      style={dynamicStyles.outerContainer}
      contentContainerStyle={dynamicStyles.scrollContentContainer}
      keyboardShouldPersistTaps="handled"
      key={`${selectedLanguage}-${isDarkMode}`} 
    >
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={handleGoBack} style={dynamicStyles.backButtonWrapper}>
            <Text style={dynamicStyles.backButton}>{t.backArrow}</Text>
          </TouchableOpacity>
          <Text style={dynamicStyles.title}>{t.settingsTitle}</Text>
          <View style={dynamicStyles.headerPlaceholder} />
        </View>

        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.label}>{t.usernameLabel}</Text>
          <TextInput
            style={dynamicStyles.input}
            value={username}
            onChangeText={setUsername}
            placeholder={t.placeholderUsername}
            placeholderTextColor={isDarkMode ? '#aaa' : '#999'}
          />
        </View>

        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.label}>{t.heightLabel}</Text>
          <TextInput
            style={dynamicStyles.input}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
            placeholder={t.placeholderHeight}
            placeholderTextColor={isDarkMode ? '#aaa' : '#999'}
          />
        </View>

        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.label}>{t.weightGoalLabel}</Text>
          <TextInput
            style={dynamicStyles.input}
            value={weightGoal}
            onChangeText={setWeightGoal}
            keyboardType="numeric"
            placeholder={t.placeholderWeightGoal}
            placeholderTextColor={isDarkMode ? '#aaa' : '#999'}
          />
        </View>
        
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.label}>{t.languageLabel}</Text>
          <View style={dynamicStyles.pickerContainer}>
            <Picker
              selectedValue={selectedLanguage}
              style={dynamicStyles.picker}
              onValueChange={handleLanguageChange}
              dropdownIconColor={isDarkMode ? '#ffffff' : '#555'}
              itemStyle={dynamicStyles.pickerItem}
              mode="dropdown"
            >
              <Picker.Item label="العربية" value="ar" />
              <Picker.Item label="English" value="en" />
            </Picker>
          </View>
        </View>
    
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.label}>{t.notificationsLabel}</Text>
          <View style={dynamicStyles.pickerContainer}>
            <Picker
              selectedValue={notifications}
              style={dynamicStyles.picker}
              onValueChange={(itemValue) => setNotifications(itemValue)}
              dropdownIconColor={isDarkMode ? '#ffffff' : '#555'}
              itemStyle={dynamicStyles.pickerItem}
              mode="dropdown"
            >
              <Picker.Item label={t.notificationsOn} value="on" />
              <Picker.Item label={t.notificationsOff} value="off" />
            </Picker>
          </View>
        </View>
        
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.label}>{t.darkModeLabel}</Text>
          <View style={dynamicStyles.pickerContainer}>
            <Picker
              selectedValue={String(isDarkMode)}
              style={dynamicStyles.picker}
              onValueChange={handleDarkModeToggle}
              dropdownIconColor={isDarkMode ? '#ffffff' : '#555'}
              itemStyle={dynamicStyles.pickerItem}
              mode="dropdown"
            >
              <Picker.Item label={t.notificationsOn} value="true" />
              <Picker.Item label={t.notificationsOff} value="false" />
            </Picker>
          </View>
        </View>

        <View style={dynamicStyles.saveButtonContainer}>
          <Button
            title={t.saveButton}
            onPress={saveAllSettings}
            color={isDarkMode ? '#4CAF50' : '#388e3c'}
          />
        </View>

        <Modal
          visible={modalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={dynamicStyles.modalOverlay}>
            <View style={dynamicStyles.modalContent}>
              <Text style={dynamicStyles.modalMessage}>{t.modalMessage}</Text>
              <Button
                title={t.modalButton}
                onPress={() => setModalVisible(false)}
                color={isDarkMode ? '#4CAF50' : '#388e3c'}
              />
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

const styles = (isDarkMode) => StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: isDarkMode ? '#121212' : '#e8f5e9' },
  scrollContentContainer: { padding: 20, flexGrow: 1 },
  container: { flex: 1, backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff', borderRadius: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDarkMode ? 0.6 : 0.25, shadowRadius: 3.84, elevation: 5, padding: 20 },
  header: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#333' : '#eee' },
  backButtonWrapper: { padding: 5 },
  backButton: { fontSize: 28, color: isDarkMode ? '#FFFFFF' : '#388e3c', fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: isDarkMode ? '#e0e0e0' : '#004d40', textAlign: 'center', flex: 1 },
  headerPlaceholder: { width: 38 },
  settingItem: { marginBottom: 18 },
  label: { marginBottom: 8, fontSize: 15, fontWeight: '600', color: isDarkMode ? '#bdbdbd' : '#004d40', textAlign: I18nManager.isRTL ? 'right' : 'left' },
  input: { height: 50, width: '100%', paddingHorizontal: 15, borderWidth: 1, borderColor: isDarkMode ? '#444' : '#ccc', borderRadius: 8, fontSize: 16, color: isDarkMode ? '#ffffff' : '#333333', backgroundColor: isDarkMode ? '#333333' : '#f8f8f8', textAlignVertical: 'center', textAlign: I18nManager.isRTL ? 'right' : 'left' },
  pickerContainer: { height: 50, width: '100%', backgroundColor: isDarkMode ? '#333333' : '#f8f8f8', borderRadius: 8, borderWidth: 1, borderColor: isDarkMode ? '#444' : '#ccc', justifyContent: 'center', overflow: 'hidden' },
  picker: { width: '100%', height: '100%', color: isDarkMode ? '#ffffff' : '#333333', backgroundColor: 'transparent' },
  pickerItem: Platform.select({ android: { color: isDarkMode ? '#ffffff' : '#333333', backgroundColor: isDarkMode ? '#333333' : '#f8f8f8' }, ios: { color: isDarkMode ? '#ffffff' : '#333333' } }),
  saveButtonContainer: { marginTop: 10 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  modalContent: { backgroundColor: isDarkMode ? '#333333' : '#ffffff', padding: 30, borderRadius: 10, width: '85%', maxWidth: 320, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 },
  modalMessage: { fontSize: 18, marginBottom: 30, color: isDarkMode ? '#e0e0e0' : '#333333', textAlign: 'center', fontWeight: '500' },
});

export default SettingsScreen;
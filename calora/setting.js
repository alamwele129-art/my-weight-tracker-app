// SettingsScreen.js

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  Animated,
  I18nManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HealthService from './healthservice'; // استيراد الخدمة الجديدة

const translations = {
  en: {
    settings: 'Settings', notifications: 'Notifications', language: 'Language', darkMode: 'Dark Mode',
    connectedApps: 'Connected Apps',
    connectWith: (os) => `Connect with ${os === 'ios' ? 'Apple Health' : 'Google Fit'}`,
    connectedWith: (os) => `Connected with ${os === 'ios' ? 'Apple Health' : 'Google Fit'}`,
    exportData: 'Export Data', deleteAccount: 'Delete Account', mealReminders: 'MEAL REMINDERS',
    breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks',
    generalReminders: 'GENERAL REMINDERS', waterReminder: 'Water Reminder', weighInReminder: 'Weigh-in Reminder',
    save: 'Save', languageSaved: 'Language Saved', languageSettingsUpdated: 'The language has been updated successfully.',
    deleteAccountTitle: 'Delete Account Permanently', deleteAccountMessage: 'Are you sure? This action cannot be undone...',
    cancel: 'Cancel', delete: 'Delete', success: 'Success!', connectionSuccessful: 'The app has been connected successfully.',
    connectionFailed: 'Connection Failed', connectionFailedMessage: 'Could not connect to the health service. Please try again.',
  },
  ar: {
    settings: 'الإعدادات', notifications: 'الإشعارات', language: 'اللغة', darkMode: 'الوضع الداكن',
    connectedApps: 'التطبيقات المرتبطة',
    connectWith: (os) => `الربط مع ${os === 'ios' ? 'Apple Health' : 'Google Fit'}`,
    connectedWith: (os) => `مرتبط بـ ${os === 'ios' ? 'Apple Health' : 'Google Fit'}`,
    exportData: 'تصدير البيانات', deleteAccount: 'حذف الحساب', mealReminders: 'تذكيرات الوجبات',
    breakfast: 'الفطور', lunch: 'الغداء', dinner: 'العشاء', snacks: 'وجبات خفيفة',
    generalReminders: 'تذكيرات عامة', waterReminder: 'تذكير شرب الماء', weighInReminder: 'تذكير قياس الوزن',
    save: 'حفظ', languageSaved: 'تم حفظ اللغة', languageSettingsUpdated: 'تم تحديث إعدادات اللغة بنجاح.',
    deleteAccountTitle: 'حذف الحساب نهائياً', deleteAccountMessage: 'هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء...',
    cancel: 'إلغاء', delete: 'حذف', success: 'نجاح!', connectionSuccessful: 'تم ربط التطبيق بنجاح.',
    connectionFailed: 'فشل الاتصال', connectionFailedMessage: 'لم نتمكن من الاتصال بالخدمة الصحية. يرجى المحاولة مرة أخرى.',
  },
};
const lightTheme = { background: '#F5FBF5', surface: '#FFFFFF', text: '#1C1C1E', secondaryText: '#8A8A8E', iconContainer: '#E8F5E9', separator: '#EAEAEA', iconColor: '#1C1C1E', danger: '#D32F2F', statusBar: 'dark-content', };
const darkTheme = { background: '#121212', surface: '#1E1E1E', text: '#FFFFFF', secondaryText: '#A5A5A5', iconContainer: '#3A3A3C', separator: '#38383A', iconColor: '#FFFFFF', danger: '#EF5350', statusBar: 'light-content', };

const DarkModeToggle = ({ value, onValueChange }) => { const animation = useRef(new Animated.Value(value ? 1 : 0)).current; useEffect(() => { Animated.timing(animation, { toValue: value ? 1 : 0, duration: 250, useNativeDriver: false }).start(); }, [value, animation]); const trackColor = animation.interpolate({ inputRange: [0, 1], outputRange: ['#767577', '#4CAF50'] }); const thumbColor = animation.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#FFFFFF'] }); const translateX = animation.interpolate({ inputRange: [0, 1], outputRange: [3, 29] }); return ( <TouchableOpacity onPress={() => onValueChange(!value)} activeOpacity={0.8}> <Animated.View style={[styles.toggleContainer, { backgroundColor: trackColor }]}> <Animated.View style={[styles.toggleThumb, { backgroundColor: thumbColor, transform: [{ translateX }] }]} /> </Animated.View> </TouchableOpacity> ); };
const SettingsActionItem = ({ icon, label, onPress, color, theme, isRTL }) => ( <TouchableOpacity onPress={onPress} style={[styles.settingsItem, { backgroundColor: theme.surface, flexDirection: isRTL ? 'row-reverse' : 'row' }]}> <View style={[styles.itemContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> <View style={[styles.iconContainer, { backgroundColor: theme.iconContainer }, isRTL ? { marginLeft: 16 } : { marginRight: 16 }]}> <Icon name={icon} size={22} color={color || theme.iconColor} /> </View> <Text style={[styles.label, { color: color || theme.text }]}>{label}</Text> </View> <Icon name={isRTL ? "chevron-left" : "chevron-right"} size={24} color="#B0B0B0" /> </TouchableOpacity> );
const ConnectAppItem = ({ icon, label, onPress, isConnected, theme, isRTL }) => ( <TouchableOpacity onPress={onPress} style={[styles.settingsItem, { backgroundColor: theme.surface, flexDirection: isRTL ? 'row-reverse' : 'row' }]}> <View style={[styles.itemContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> <View style={[styles.iconContainer, { backgroundColor: theme.iconContainer }, isRTL ? { marginLeft: 16 } : { marginRight: 16 }]}> <Icon name={icon} size={22} color={isConnected ? '#4CAF50' : theme.iconColor} /> </View> <Text style={[styles.label, { color: isConnected ? '#4CAF50' : theme.text, fontWeight: isConnected ? 'bold' : 'normal' }]}>{label}</Text> </View> </TouchableOpacity> );
const SettingsToggleItem = ({ icon, label, value, onValueChange, theme, isRTL }) => ( <View style={[styles.settingsItem, { backgroundColor: theme.surface, flexDirection: isRTL ? 'row-reverse' : 'row' }]}> <View style={[styles.itemContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> <View style={[styles.iconContainer, { backgroundColor: theme.iconContainer }, isRTL ? { marginLeft: 16 } : { marginRight: 16 }]}> <Icon name={icon} size={22} color={theme.iconColor} /> </View> <Text style={[styles.label, { color: theme.text }]}>{label}</Text> </View> <DarkModeToggle value={value} onValueChange={onValueChange} /> </View> );
const LanguageSelectionItem = ({ label, isSelected, onPress, theme, isRTL }) => ( <TouchableOpacity onPress={onPress} style={[styles.settingsItem, { backgroundColor: theme.surface, flexDirection: isRTL ? 'row-reverse' : 'row' }]}> <Text style={[styles.label, { color: theme.text, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text> {isSelected && <Icon name="check-circle" size={24} color="#4CAF50" />} </TouchableOpacity> );
const SettingsSectionHeader = ({ title, theme, isRTL }) => ( <Text style={[styles.sectionHeader, { color: theme.secondaryText, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text> );


const SettingsScreen = ({ navigation }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('main');
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isHealthKitConnected, setIsHealthKitConnected] = useState(false); 
  const [reminders, setReminders] = useState({ breakfast: true, lunch: true, dinner: false, snacks: false, water: true, weighIn: false });

  const theme = isDarkMode ? darkTheme : lightTheme;
  const isRTL = activeLanguage === 'ar';

  const t = (key, ...args) => { const string = translations[activeLanguage][key] || translations['en'][key]; return typeof string === 'function' ? string(...args) : string; };

  useEffect(() => {
    const loadSettings = async () => {
      const savedLang = await AsyncStorage.getItem('appLanguage');
      if (savedLang) {
        setActiveLanguage(savedLang); setSelectedLanguage(savedLang); I18nManager.forceRTL(savedLang === 'ar');
      }
      const savedConnectionStatus = await AsyncStorage.getItem('isHealthKitConnected');
      if (savedConnectionStatus === 'true') {
        setIsHealthKitConnected(true);
      }
    };
    loadSettings();
  }, []);
  
  const handleConnectApp = async () => {
    if (isHealthKitConnected) { Alert.alert(t('connectedWith', Platform.OS)); return; }
    try {
      const isAuthorized = await HealthService.authorize();
      if (isAuthorized) { setIsHealthKitConnected(true); Alert.alert(t('success'), t('connectionSuccessful')); }
    } catch (error) { setIsHealthKitConnected(false); Alert.alert(t('connectionFailed'), t('connectionFailedMessage')); }
  };

  const handleToggleReminder = (key) => setReminders(prev => ({ ...prev, [key]: !prev[key] }));
  const handleSaveLanguage = async () => { await AsyncStorage.setItem('appLanguage', selectedLanguage); setActiveLanguage(selectedLanguage); I18nManager.forceRTL(selectedLanguage === 'ar'); Alert.alert(t('languageSaved'), t('languageSettingsUpdated')); setCurrentView('main'); };
  const handleDeleteAccount = () => Alert.alert(t('deleteAccountTitle'), t('deleteAccountMessage'), [{ text: t('cancel'), style: 'cancel' }, { text: t('delete'), style: 'destructive', onPress: () => console.log("Account deleted") }]);
  const handleBackPress = () => { if (currentView !== 'main') { setCurrentView('main'); } else { navigation.goBack(); } };

  const renderContent = () => {
    if (currentView === 'notifications') {
      return (
        <>
          <SettingsSectionHeader title={t('mealReminders')} theme={theme} isRTL={isRTL} />
          <SettingsToggleItem icon="food-croissant" label={t('breakfast')} value={reminders.breakfast} onValueChange={() => handleToggleReminder('breakfast')} theme={theme} isRTL={isRTL} />
          <SettingsToggleItem icon="food-turkey" label={t('lunch')} value={reminders.lunch} onValueChange={() => handleToggleReminder('lunch')} theme={theme} isRTL={isRTL} />
          <SettingsToggleItem icon="food-steak" label={t('dinner')} value={reminders.dinner} onValueChange={() => handleToggleReminder('dinner')} theme={theme} isRTL={isRTL} />
          <SettingsToggleItem icon="food-apple-outline" label={t('snacks')} value={reminders.snacks} onValueChange={() => handleToggleReminder('snacks')} theme={theme} isRTL={isRTL} />
          <SettingsSectionHeader title={t('generalReminders')} theme={theme} isRTL={isRTL} />
          <SettingsToggleItem icon="cup-water" label={t('waterReminder')} value={reminders.water} onValueChange={() => handleToggleReminder('water')} theme={theme} isRTL={isRTL} />
          <SettingsToggleItem icon="scale-bathroom" label={t('weighInReminder')} value={reminders.weighIn} onValueChange={() => handleToggleReminder('weighIn')} theme={theme} isRTL={isRTL} />
        </>
      );
    }
    if (currentView === 'language') {
      return (
        <>
          <LanguageSelectionItem label="English" isSelected={selectedLanguage === 'en'} onPress={() => setSelectedLanguage('en')} theme={theme} isRTL={isRTL} />
          <LanguageSelectionItem label="العربية" isSelected={selectedLanguage === 'ar'} onPress={() => setSelectedLanguage('ar')} theme={theme} isRTL={isRTL} />
        </>
      );
    }
    return (
      <>
        <SettingsToggleItem icon="theme-light-dark" label={t('darkMode')} value={isDarkMode} onValueChange={setIsDarkMode} theme={theme} isRTL={isRTL} />
        <SettingsActionItem icon="bell-outline" label={t('notifications')} onPress={() => setCurrentView('notifications')} theme={theme} isRTL={isRTL} />
        <SettingsActionItem icon="translate" label={t('language')} onPress={() => setCurrentView('language')} theme={theme} isRTL={isRTL} />
        <View style={{ height: 20 }} />
        <SettingsSectionHeader title={t('connectedApps')} theme={theme} isRTL={isRTL} />
        <ConnectAppItem icon={Platform.OS === 'ios' ? 'heart-pulse' : 'google-fit'} label={isHealthKitConnected ? t('connectedWith', Platform.OS) : t('connectWith', Platform.OS)} onPress={handleConnectApp} isConnected={isHealthKitConnected} theme={theme} isRTL={isRTL} />
        <View style={{ height: 20 }} />
        <SettingsActionItem icon="export-variant" label={t('exportData')} onPress={() => {}} theme={theme} isRTL={isRTL} />
        <SettingsActionItem icon="account-remove-outline" label={t('deleteAccount')} onPress={handleDeleteAccount} color={theme.danger} theme={theme} isRTL={isRTL} />
      </>
    );
  };
  
  const headerTitles = { main: t('settings'), notifications: t('notifications'), language: t('language') };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.surface} />
      <View style={[styles.headerContainer, { backgroundColor: theme.surface, borderBottomColor: theme.separator, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={handleBackPress} style={styles.headerButton}>
          <Icon name={isRTL ? "arrow-right" : "arrow-left"} size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{headerTitles[currentView]}</Text>
        {currentView === 'language' ? (
          <TouchableOpacity onPress={handleSaveLanguage} style={styles.headerButton}>
            <Text style={{color: '#4CAF50', fontWeight: 'bold', fontSize: 16}}>{t('save')}</Text>
          </TouchableOpacity>
        ) : ( <View style={styles.headerButton} /> )}
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ height: 20 }} />
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerButton: { width: 50, alignItems: 'center' },
  scrollContent: { paddingBottom: 20 },
  settingsItem: { alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, padding: 12, marginHorizontal: 16, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  itemContent: { alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 16 },
  sectionHeader: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: 28, paddingVertical: 10, marginTop: 10 },
  toggleContainer: { width: 52, height: 26, borderRadius: 13, justifyContent: 'center', padding: 3 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
});

export default SettingsScreen;
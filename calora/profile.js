// profile.js (الكود الكامل والمعدل)

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Image, ImageBackground, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, RefreshControl, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import EditProfileScreen from './editprofile'; 

const COLORS = { background: '#E8F5E9', surface: '#FFFFFF', primaryText: '#1C1C1E', secondaryText: '#8A8A8E', separator: '#E5E5EA', logout: '#FF3B30' };

const SettingsItem = ({ icon, name, onPress, color = COLORS.primaryText }) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <View style={styles.settingsItemContent}>
      {icon}
      <Text style={[styles.settingsItemText, { color }]}>{name}</Text>
    </View>
    <Icon name="chevron-right" size={22} color="#C7C7CC" />
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const [userData, setUserData] = useState({ firstName: 'مستخدم', lastName: 'جديد', profileImage: null });
  const [isEditing, setIsEditing] = useState(false);
  const isFocused = useIsFocused();
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const loadProfileData = useCallback(async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('userProfile');
      if (jsonValue != null) {
        setUserData(JSON.parse(jsonValue));
      }
    } catch (e) { console.error("Failed to load profile data.", e); }
  }, []);

  useEffect(() => {
    if (isFocused && !isEditing) {
      loadProfileData();
    }
  }, [isFocused, isEditing, loadProfileData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  }, [loadProfileData]);
  
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userProfile');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Index', params: { initialSlideIndex: 2 } }],
      });
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الخروج.');
    }
  };

  if (isEditing) {
    return <EditProfileScreen onGoBack={() => setIsEditing(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto-format&fit=crop&w=1171&q=80' }}
          style={styles.header}
          imageStyle={{ borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
        />
        <View style={styles.profileContainer}>
          <Image
            source={userData.profileImage ? { uri: userData.profileImage } : require('./assets/profile.png')} 
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>
            {userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : 'مستخدم جديد'}
          </Text>
        </View>
        <View style={styles.menuContainer}>
          <View style={styles.menuSection}>
            <SettingsItem icon={<Icon name="user" size={22} color={COLORS.secondaryText} />} name="Edit Profile" onPress={() => setIsEditing(true)} />
            <View style={styles.separator} />

            {/* ===== تم تعديل هذا السطر لينتقل إلى شاشة الإعدادات ===== */}
            <SettingsItem 
              icon={<Ionicons name="settings-outline" size={22} color={COLORS.secondaryText} />} 
              name="Settings" 
              onPress={() => navigation.navigate('Settings')} 
            />

          </View>
          <View style={styles.menuSection}>
            <SettingsItem icon={<Icon name="info" size={22} color={COLORS.secondaryText} />} name="About" onPress={() => console.log('About pressed')} />
            <View style={styles.separator} />
            <SettingsItem icon={<Ionicons name="log-out-outline" size={24} color={COLORS.logout} />} name="Logout" onPress={handleLogout} color={COLORS.logout} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: COLORS.background }, header: { height: 200 }, profileContainer: { alignItems: 'center', marginTop: -70 }, profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: COLORS.surface, backgroundColor: '#E0E0E0' }, profileName: { fontSize: 22, fontWeight: 'bold', color: COLORS.primaryText, marginTop: 12 }, menuContainer: { paddingHorizontal: 20, marginTop: 40 }, menuSection: { backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 20, overflow: 'hidden' }, settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15 }, settingsItemContent: { flexDirection: 'row', alignItems: 'center' }, settingsItemText: { fontSize: 17, marginLeft: 15 }, separator: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.separator, marginLeft: 54 }, });
export default ProfileScreen;
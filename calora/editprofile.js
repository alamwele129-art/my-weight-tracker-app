// editprofile.js (الكود الكامل والنهائي)

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity,
  Image, TextInput, Alert, Platform, Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const COLORS = { background: '#F7FDF9', white: '#FFFFFF', textGray: '#888888', textDark: '#1D1D1D', primary: '#388E3C', border: '#EFEFEF', disabledBackground: '#F7F7F7' };
const calculateCalories = (userData) => { if (!userData || !userData.birthDate || !userData.weight || !userData.height || !userData.gender || !userData.activityLevel || !userData.goal) return 2000; const { birthDate, gender, weight, height, activityLevel, goal } = userData; const age = new Date().getFullYear() - new Date(birthDate).getFullYear(); let bmr = (gender === 'male') ? (10 * weight + 6.25 * height - 5 * age + 5) : (10 * weight + 6.25 * height - 5 * age - 161); const activityMultipliers = { sedentary: 1.2, light: 1.375, active: 1.55, very_active: 1.725 }; const tdee = bmr * (activityMultipliers[activityLevel] || 1.2); let finalCalories; switch (goal) { case 'lose': finalCalories = tdee - 500; break; case 'gain': finalCalories = tdee + 500; break; default: finalCalories = tdee; break; } return Math.max(1200, Math.round(finalCalories)); };
const InfoInput = React.memo(({ label, value, onChangeText, keyboardType = 'default' }) => ( <View style={styles.inputContainer}> <View> <Text style={styles.inputLabel}>{label}</Text> <TextInput style={styles.textInput} value={value} onChangeText={onChangeText} keyboardType={keyboardType} /> </View> {value && value.trim().length > 0 && <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.primary} />} </View> ));
const OptionSelector = React.memo(({ label, options, selectedValue, onSelect }) => ( <View style={styles.optionContainer}> <Text style={styles.inputLabel}>{label}</Text> <View style={styles.optionsWrapper}> {options.map((option) => ( <TouchableOpacity key={option.value} style={[ styles.optionButton, selectedValue === option.value && styles.optionButtonSelected ]} onPress={() => onSelect(option.value)}> <Text style={[ styles.optionText, selectedValue === option.value && styles.optionTextSelected ]}>{option.label}</Text> </TouchableOpacity> ))} </View> </View> ));

const EditProfileScreen = ({ onGoBack }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [gender, setGender] = useState(null);
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState(null);
  const [targetWeight, setTargetWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState(null);
  const [keyboardPadding, setKeyboardPadding] = useState(50);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => { setKeyboardPadding(e.endCoordinates.height); });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => { setKeyboardPadding(50); });
    return () => { keyboardDidHideListener.remove(); keyboardDidShowListener.remove(); };
  }, []);

  useEffect(() => { const loadCurrentData = async () => { const jsonValue = await AsyncStorage.getItem('userProfile'); if (jsonValue != null) { const data = JSON.parse(jsonValue); setFirstName(data.firstName || ''); setLastName(data.lastName || ''); setEmail(data.email || ''); setProfileImage(data.profileImage || null); setGender(data.gender || null); setBirthDate(data.birthDate ? new Date(data.birthDate) : new Date()); setHeight(data.height ? String(data.height) : ''); setWeight(data.weight ? String(data.weight) : ''); setGoal(data.goal || null); setTargetWeight(data.targetWeight ? String(data.targetWeight) : ''); setActivityLevel(data.activityLevel || null); } }; loadCurrentData(); }, []);
  const handleImagePicker = useCallback(() => { Alert.alert('صورة الملف الشخصي', 'اختر صورتك الجديدة', [ { text: 'التقاط صورة', onPress: () => launchCamera({ mediaType: 'photo', quality: 0.5 }, (r) => { if (!r.didCancel && r.assets) setProfileImage(r.assets[0].uri); }) }, { text: 'اختيار من المعرض', onPress: () => launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (r) => { if (!r.didCancel && r.assets) setProfileImage(r.assets[0].uri); }) }, { text: 'إلغاء', style: 'cancel' } ]); }, []);
  const onDateChange = useCallback((event, selectedDate) => { setShowDatePicker(Platform.OS === 'ios'); if (selectedDate) { setBirthDate(selectedDate); } }, []);
  
  const handleSave = useCallback(async () => {
    const updatedUserData = { firstName, lastName, email, profileImage, gender, birthDate: birthDate.toISOString(), height: parseFloat(height), weight: parseFloat(weight), goal, targetWeight: goal === 'maintain' ? null : parseFloat(targetWeight), activityLevel };
    const newDailyGoal = calculateCalories(updatedUserData);
    const finalProfileData = { ...updatedUserData, dailyGoal: newDailyGoal };
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(finalProfileData));
      Alert.alert('نجاح', 'تم حفظ التغييرات بنجاح!');
      onGoBack();
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ البيانات.');
    }
  }, [ firstName, lastName, email, profileImage, gender, birthDate, height, weight, goal, targetWeight, activityLevel, onGoBack ]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: keyboardPadding }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack}>
            <Ionicons name="chevron-back" size={28} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EDIT PROFILE</Text>
          <TouchableOpacity onPress={handleSave}>
            <Ionicons name="checkmark-outline" size={30} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person-outline" size={50} color={COLORS.textGray} />
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handleImagePicker}>
              <Ionicons name="camera" size={18} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.formSection}><Text style={styles.sectionTitle}>PUBLIC INFORMATION</Text><InfoInput label="First name" value={firstName} onChangeText={setFirstName} /><InfoInput label="Last name" value={lastName} onChangeText={setLastName} /><View style={[styles.inputContainer, styles.disabledInputContainer]}><View><Text style={styles.inputLabel}>Mail</Text><TextInput style={[styles.textInput, styles.disabledTextInput]} value={email} editable={false} /></View><Ionicons name="lock-closed-outline" size={22} color={COLORS.textGray} /></View></View>
        <View style={styles.formSection}><Text style={styles.sectionTitle}>PHYSICAL METRICS</Text><OptionSelector label="Gender" options={[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }]} selectedValue={gender} onSelect={setGender} /><TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)}><View><Text style={styles.inputLabel}>Date of Birth</Text><Text style={styles.textInput}>{birthDate.toLocaleDateString('en-GB')}</Text></View><Ionicons name="calendar-outline" size={22} color={COLORS.textGray} /></TouchableOpacity>{showDatePicker && <DateTimePicker value={birthDate} mode="date" display="spinner" onChange={onDateChange} />}<InfoInput label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" /><InfoInput label="Current Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" /></View>
        <View style={styles.formSection}><Text style={styles.sectionTitle}>GOALS</Text><OptionSelector label="Main Goal" options={[{ label: 'Lose', value: 'lose' }, { label: 'Maintain', value: 'maintain' }, { label: 'Gain', value: 'gain' }]} selectedValue={goal} onSelect={setGoal} />{goal !== 'maintain' && <InfoInput label="Target Weight (kg)" value={targetWeight} onChangeText={setTargetWeight} keyboardType="numeric" />}<OptionSelector label="Activity Level" options={[{ label: 'Sedentary', value: 'sedentary' }, { label: 'Light', value: 'light' }, { label: 'Active', value: 'active' }, { label: 'Very Active', value: 'very_active' }]} selectedValue={activityLevel} onSelect={setActivityLevel} /></View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: COLORS.background }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 }, headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark }, profileSection: { alignItems: 'center', marginVertical: 20 }, profileImageContainer: { position: 'relative' }, profileImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E0E0E0' }, profileImagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', }, cameraButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.white, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, elevation: 3 }, formSection: { paddingHorizontal: 20, marginBottom: 10 }, sectionTitle: { fontSize: 13, color: COLORS.textGray, fontWeight: '600', marginBottom: 15, textTransform: 'uppercase' }, inputContainer: { backgroundColor: COLORS.white, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }, inputLabel: { fontSize: 12, color: COLORS.textGray, marginBottom: 4 }, textInput: { fontSize: 16, fontWeight: '600', color: COLORS.textDark, padding: 0 }, disabledInputContainer: { backgroundColor: COLORS.disabledBackground }, disabledTextInput: { color: COLORS.textGray }, optionContainer: { marginBottom: 15 }, optionsWrapper: { flexDirection: 'row', justifyContent: 'space-between' }, optionButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', marginHorizontal: 4, backgroundColor: COLORS.white }, optionButtonSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary }, optionText: { color: COLORS.textDark, fontWeight: '600' }, optionTextSelected: { color: COLORS.white }, });

export default EditProfileScreen;
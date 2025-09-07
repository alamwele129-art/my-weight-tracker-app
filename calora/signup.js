// SignUpScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Alert 
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
// 🔽 1. استدعاء AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#4CAF50',
  background: '#F8F9FA',
  white: '#FFFFFF',
  darkText: '#212529',
  grayText: '#6C757D',
  borderColor: '#E9ECEF',
};

const SignUpScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isPasswordSecure, setIsPasswordSecure] = useState(true);
  const [isConfirmPasswordSecure, setIsConfirmPasswordSecure] = useState(true);

  const handleEmailChange = (text) => {
    const englishEmailRegex = /^[a-zA-Z0-9@._-]*$/;
    if (englishEmailRegex.test(text)) {
      setEmail(text);
    }
  };

  // 🔽 2. تعديل دالة إنشاء الحساب لتكون async وتقوم بالحفظ
  const handleSignUp = async () => {
    // التحقق من المدخلات
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('خطأ', 'الرجاء ملء جميع الحقول.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
        Alert.alert('خطأ', 'الرجاء إدخال بريد إلكتروني صحيح.');
        return;
    }
    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين.');
      return;
    }

    try {
      // إنشاء كائن بيانات المستخدم الجديد
      const userProfile = {
        firstName: username, // يمكنك تقسيمه لاسم أول وأخير لاحقاً
        lastName: '',
        email: email.toLowerCase(), // حفظ الإيميل بحروف صغيرة لتوحيده
        phone: '',
        profileImage: null,
      };

      // حفظ بيانات المستخدم في AsyncStorage
      await AsyncStorage.setItem('userProfileData', JSON.stringify(userProfile));
      
      Alert.alert('نجاح', 'تم إنشاء حسابك بنجاح!');

      // الانتقال إلى شاشة البروفايل بعد النجاح
      // ملاحظة: من الأفضل الانتقال إلى stack جديد بعد التسجيل بدلاً من شاشة واحدة
      navigation.navigate('Profile');

    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء الحساب.');
      console.error(error);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.header}>
        <Image 
          source={require('./assets/palmleaf1.png')} 
          style={styles.headerImageLeft}
          resizeMode="contain"
        />
        <Image 
          source={require('./assets/palmleaf.png')} 
          style={styles.headerImageRight}
          resizeMode="contain"
        />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join our community</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.titleContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={28} color={COLORS.darkText} />
            </TouchableOpacity>
            <Text style={styles.cardTitle}>Sign Up</Text>
          </View>
          
          {/* Inputs... */}
          <View style={styles.inputContainer}>
            <Icon name="user" size={20} color={COLORS.grayText} style={styles.inputIcon} />
            <TextInput
              placeholder="Username"
              placeholderTextColor={COLORS.grayText}
              style={styles.input}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="mail" size={20} color={COLORS.grayText} style={styles.inputIcon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor={COLORS.grayText}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={handleEmailChange}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={COLORS.grayText} style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor={COLORS.grayText}
              style={styles.input}
              secureTextEntry={isPasswordSecure}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setIsPasswordSecure(!isPasswordSecure)}>
              <Icon 
                name={isPasswordSecure ? 'eye-off' : 'eye'} 
                size={20} 
                color={COLORS.grayText} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={COLORS.grayText} style={styles.inputIcon} />
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor={COLORS.grayText}
              style={styles.input}
              secureTextEntry={isConfirmPasswordSecure}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setIsConfirmPasswordSecure(!isConfirmPasswordSecure)}>
              <Icon 
                name={isConfirmPasswordSecure ? 'eye-off' : 'eye'} 
                size={20} 
                color={COLORS.grayText} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
};

// ... نفس الـ styles السابقة بدون تغيير
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { backgroundColor: COLORS.primary, height: height * 0.3, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, justifyContent: 'center', paddingHorizontal: 30, paddingTop: 20, position: 'relative', overflow: 'hidden' },
    headerImageLeft: { position: 'absolute', top: -40, left: -40, width: 200, height: 200, transform: [{ rotate: '10deg' }] },
    headerImageRight: { position: 'absolute', top: -40, right: -40, width: 200, height: 200, transform: [{ rotate: '-9deg' }] },
    title: { fontSize: 42, fontWeight: 'bold', color: COLORS.white },
    subtitle: { fontSize: 18, color: COLORS.white, marginTop: 5 },
    card: { position: 'absolute', top: height * 0.25, left: 20, right: 20, bottom: 20, backgroundColor: COLORS.white, borderRadius: 30, paddingHorizontal: 25, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15 },
    cardContent: { flex: 1, justifyContent: 'center', paddingTop: 10 },
    titleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    backButton: { padding: 5, marginRight: 10 },
    cardTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.darkText },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 15, paddingHorizontal: 20, marginVertical: 6, borderWidth: 1, borderColor: COLORS.borderColor, height: 55 },
    inputIcon: { marginRight: 15 },
    input: { flex: 1, fontSize: 16, color: COLORS.darkText },
    signUpButton: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 30, alignItems: 'center', marginTop: 12 },
    signUpButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
    dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.borderColor },
    dividerText: { marginHorizontal: 15, color: COLORS.grayText },
    socialContainer: { flexDirection: 'row', justifyContent: 'center', gap: 25 },
    socialButton: { alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: 15, borderWidth: 1, borderColor: COLORS.borderColor },
    googleIcon: { width: 28, height: 28 },
});

export default SignUpScreen;
// File: resetpassword.js

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, StatusBar, Dimensions, Image, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#4CAF50',
  secondary: '#2ECC71',
  background: '#FFFFFF',
  white: '#FFFFFF',
  darkText: '#212529',
  grayText: '#6C757D',
  borderColor: '#E9ECEF',
  lightGray: '#F7F8F9',
};

// =========================================================
// *** تم إعطاء التدرج اللوني معرّفاً فريداً هنا ***
// =========================================================
const HeaderCurve = () => (
  <View style={styles.headerCurveContainer}>
    <Svg height={height * 0.18} width={width} viewBox={`0 0 ${width} ${height * 0.18}`}>
      <Defs>
        {/* الخطوة 1: تغيير المعرّف (ID) إلى اسم فريد */}
        <LinearGradient id="grad-reset" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={COLORS.primary} />
          <Stop offset="1" stopColor={COLORS.secondary} />
        </LinearGradient>
      </Defs>
      <Path
        d={`M0,0 L${width},0 L${width},${height * 0.12} Q${width / 2},${height * 0.18} 0,${height * 0.12} Z`}
        // الخطوة 2: استخدام المعرّف الفريد هنا
        fill="url(#grad-reset)"
      />
    </Svg>
  </View>
);

const ResetPasswordScreen = ({ navigation }) => {
  // ... باقي كود الشاشة بدون تغيير
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);
  const [isConfirmSecure, setIsConfirmSecure] = useState(true);

  const handleResetPassword = () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    Alert.alert('Success', 'Your password has been changed successfully!', [
      { text: 'OK', onPress: () => navigation.navigate('SignIn') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <HeaderCurve />
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Password</Text>
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Reset Your Password</Text>
        <Text style={styles.subtitle}>
          Your new password must be different from previously used passwords.
        </Text>
        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color={COLORS.grayText} style={styles.inputIcon} />
          <TextInput placeholder="New Password" placeholderTextColor={COLORS.grayText} style={styles.input} secureTextEntry={isPasswordSecure} value={password} onChangeText={setPassword} />
          <TouchableOpacity onPress={() => setIsPasswordSecure(!isPasswordSecure)}>
            <Icon name={isPasswordSecure ? 'eye-off' : 'eye'} size={20} color={COLORS.grayText} />
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color={COLORS.grayText} style={styles.inputIcon} />
          <TextInput placeholder="Confirm New Password" placeholderTextColor={COLORS.grayText} style={styles.input} secureTextEntry={isConfirmSecure} value={confirmPassword} onChangeText={setConfirmPassword} />
          <TouchableOpacity onPress={() => setIsConfirmSecure(!isConfirmSecure)}>
            <Icon name={isConfirmSecure ? 'eye-off' : 'eye'} size={20} color={COLORS.grayText} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.resetButton} onPress={handleResetPassword}>
          <Text style={styles.resetButtonText}>Reset Password</Text>
        </TouchableOpacity>
      </View>
      <Image source={require('./assets/leavesdecoration.png')} style={styles.footerImage} />
    </SafeAreaView>
  );
};

// الأنماط تبقى كما هي
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerCurveContainer: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerContent: { marginTop: StatusBar.currentHeight || 40, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 60 },
  backButton: { padding: 10, position: 'absolute', left: 15, zIndex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white, textAlign: 'center', flex: 1 },
  formContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 100 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.darkText, textAlign: 'center', marginBottom: 15 },
  subtitle: { fontSize: 15, color: COLORS.grayText, textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: COLORS.borderColor, height: 58 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: COLORS.darkText },
  resetButton: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  resetButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  footerImage: { position: 'absolute', bottom: 0, width: width, height: 80, resizeMode: 'cover' },
});

export default ResetPasswordScreen;
// File: forgotpassword.js

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, StatusBar, Dimensions, Image, Alert } from 'react-native';
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
};

// هذا الهيدر خاص بهذه الشاشة فقط
const HeaderCurve = () => {
  const pathData = `M0,0 L${width},0 L${width},${height * 0.12} Q${width / 2},${height * 0.18} 0,${height * 0.12} Z`;
  return (
    <View style={styles.headerCurveContainer}>
      <Svg height={height * 0.18} width={width} viewBox={`0 0 ${width} ${height * 0.18}`}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={COLORS.primary} />
            <Stop offset="1" stopColor={COLORS.secondary} />
          </LinearGradient>
        </Defs>
        <Path d={pathData} fill="url(#grad)" />
      </Svg>
    </View>
  );
};

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const validateEmail = (emailToValidate) => {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(emailToValidate);
  };

  const handleRecover = () => {
    if (validateEmail(email)) {
      navigation.navigate('EmailVerification');
    } else {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <HeaderCurve />
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgot Password</Text>
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Forgot Your Password?</Text>
        <Text style={styles.subtitle}>Enter the email address associated with your account.</Text>
        <View style={styles.inputContainer}>
          <Icon name="mail" size={20} color={COLORS.grayText} style={styles.inputIcon} />
          <TextInput
            placeholder="Email"
            placeholderTextColor={COLORS.grayText}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <TouchableOpacity style={styles.recoverButton} onPress={handleRecover}>
          <Text style={styles.recoverButtonText}>Recover Password</Text>
        </TouchableOpacity>
      </View>
      <Image
        source={require('./assets/leavesdecoration.png')}
        style={styles.footerImage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerCurveContainer: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerContent: { marginTop: StatusBar.currentHeight || 40, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 60 },
  backButton: { padding: 10, position: 'absolute', left: 15, zIndex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white, textAlign: 'center', flex: 1 },
  formContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.darkText, textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: COLORS.grayText, textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F8F9', borderRadius: 12, paddingHorizontal: 15, marginBottom: 25, borderWidth: 1, borderColor: COLORS.borderColor, height: 58 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: COLORS.darkText },
  recoverButton: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  recoverButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  footerImage: { position: 'absolute', bottom: 0, width: width, height: 80, resizeMode: 'cover' },
});

// *** تأكد من أن هذا السطر هو الوحيد للتصدير في الملف ***
export default ForgotPasswordScreen;
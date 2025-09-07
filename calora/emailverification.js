// File: emailverification.js

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
// الخطوة 1: تحديث الاستيراد ليشمل مكونات التدرج اللوني
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
// *** الخطوة 2: استبدال الهيدر بالنسخة التي تحتوي على التدرج اللوني بمعرّف فريد ***
// =========================================================
const HeaderCurve = () => (
  <View style={styles.headerCurveContainer}>
    <Svg height={height * 0.18} width={width} viewBox={`0 0 ${width} ${height * 0.18}`}>
      <Defs>
        <LinearGradient id="grad-verify" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={COLORS.primary} />
          <Stop offset="1" stopColor={COLORS.secondary} />
        </LinearGradient>
      </Defs>
      <Path
        d={`M0,0 L${width},0 L${width},${height * 0.12} Q${width / 2},${height * 0.18} 0,${height * 0.12} Z`}
        fill="url(#grad-verify)"
      />
    </Svg>
  </View>
);

const EmailVerificationScreen = ({ navigation }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = useRef([]);
  const scaleAnim = useRef(otp.map(() => new Animated.Value(1))).current;

  const animateBox = (index) => { Animated.sequence([ Animated.timing(scaleAnim[index], { toValue: 1.1, duration: 100, useNativeDriver: true }), Animated.timing(scaleAnim[index], { toValue: 1, duration: 100, useNativeDriver: true }), ]).start(); };
  const handleOtpChange = (text, index) => { if (text.length > 1) { const fullCode = text.slice(0, 4).split(''); setOtp(fullCode.concat(['', '', '', '']).slice(0, 4)); inputs.current[3]?.focus(); return; } const newOtp = [...otp]; newOtp[index] = text; setOtp(newOtp); animateBox(index); if (text && index < 3) { inputs.current[index + 1].focus(); } };
  const handleBackspace = (nativeEvent, index) => { if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) { inputs.current[index - 1].focus(); } };
  const handleVerify = () => { navigation.navigate('ResetPassword'); };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <HeaderCurve />

      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email Verification</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Get Your Code</Text>
        <Text style={styles.subtitle}>
          Please enter the 4 digit code that was sent to your email address.
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <Animated.View key={index} style={{ transform: [{ scale: scaleAnim[index] }] }}>
              <TextInput
                ref={(input) => (inputs.current[index] = input)}
                style={styles.otpBox}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent, index)}
                value={digit}
              />
            </Animated.View>
          ))}
        </View>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>If you didn't receive a code? </Text>
          <TouchableOpacity>
            <Text style={styles.resendButtonText}>Resend</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
          <Text style={styles.verifyButtonText}>Verify and Proceed</Text>
        </TouchableOpacity>
      </View>

      <Image source={require('./assets/leavesdecoration.png')} style={styles.footerImage} />
    </SafeAreaView>
  );
};

// الأنماط تبقى كما هي، لا حاجة للتعديل هنا
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerCurveContainer: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerContent: {
    marginTop: StatusBar.currentHeight || 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
  },
  backButton: { padding: 10, position: 'absolute', left: 15, zIndex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white, textAlign: 'center', flex: 1 },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 80,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.darkText, textAlign: 'center', marginBottom: 15 },
  subtitle: { fontSize: 15, color: COLORS.grayText, textAlign: 'center', marginBottom: 40, lineHeight: 22, maxWidth: '90%', alignSelf: 'center'},
  otpContainer: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', marginBottom: 20 },
  otpBox: { width: 60, height: 60, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderColor, backgroundColor: COLORS.lightGray, textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: COLORS.darkText },
  resendContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 40 },
  resendText: { fontSize: 14, color: COLORS.grayText },
  resendButtonText: { fontSize: 14, color: COLORS.primary, fontWeight: 'bold' },
  verifyButton: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 12, alignItems: 'center', width: '100%', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  verifyButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  footerImage: { position: 'absolute', bottom: 0, width: width, height: 80, resizeMode: 'cover' },
});

export default EmailVerificationScreen;
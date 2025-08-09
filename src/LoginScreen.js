// LoginScreen.js (Forgot Password navigates immediately)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';

const LOGGED_IN_EMAIL_KEY = 'loggedInUserEmail';
// --- Security Warning ---

const LoginScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState('Login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    if (isFocused) {
      setActiveTab('Login');
    }
  }, [isFocused]);

  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'SignUp') {
      navigation.navigate('SignUp');
    }
  };

  const handleLogin = async () => {
     Keyboard.dismiss();
    if (!email || !password) {
      Alert.alert('خطأ', 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }
    setIsLoading(true);
    try {
      // --- !!! Insecure Login Check !!! ---
      const storedEmail = await AsyncStorage.getItem('userEmail');
      const storedPassword = await AsyncStorage.getItem('userPassword');
      // --- End Insecure Part ---

      if (email === storedEmail && password === storedPassword) {
        console.log('Login successful');
        try {
          await AsyncStorage.setItem(LOGGED_IN_EMAIL_KEY, email);
          console.log(`[LoginScreen] Saved email '${email}' to AsyncStorage with key '${LOGGED_IN_EMAIL_KEY}'.`);
          console.log('Navigating to Weight');
          navigation.navigate('Weight');
        } catch (saveError) {
          console.error("[LoginScreen] Error saving logged-in email:", saveError);
          Alert.alert('خطأ في الحفظ', 'لم نتمكن من حفظ معلومات الجلسة.');
        }
      } else {
        Alert.alert('فشل الدخول', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      }
    } catch (error) {
      console.error('خطأ أثناء تسجيل الدخول:', error);
      Alert.alert('خطأ', 'حدث خطأ غير متوقع أثناء محاولة تسجيل الدخول.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- الدالة المعدلة ---
  const handleForgotPassword = () => {
    // تم إزالة التحقق من وجود الإيميل
    console.log('Navigating to ForgotPassword, passing email:', email);
    navigation.navigate('ForgotPassword', { email: email });
  };
  // --- نهاية التعديل ---

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* Tab Bar */}
      <View style={styles.tabContainerWrapper}>
          {/* ... Tab buttons ... */}
          <View style={styles.tabContainer}>
              <TouchableOpacity
                  style={[ styles.tab, activeTab === 'Login' && styles.activeTab ]}
                  onPress={() => handleTabPress('Login')}
                  disabled={isLoading}
              >
                  <Text style={[ styles.tabText, activeTab === 'Login' && styles.activeTabText ]}>
                      Login
                  </Text>
                  {activeTab === 'Login' && <View style={styles.greenLine} />}
              </TouchableOpacity>
              <TouchableOpacity
                  style={[ styles.tab, activeTab === 'SignUp' && styles.activeTab ]}
                  onPress={() => handleTabPress('SignUp')}
                  disabled={isLoading}
              >
                  <Text style={[ styles.tabText, activeTab === 'SignUp' && styles.activeTabText ]}>
                      Sign Up
                  </Text>
                  {activeTab === 'SignUp' && <View style={styles.greenLine} />}
              </TouchableOpacity>
          </View>
      </View>

      {/* Screen Content */}
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.content}>
          {/* Social Login Buttons */}
          <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
            <AntDesign name="apple1" size={24} color="black" style={styles.buttonIcon} />
            <Text style={styles.socialButtonText}>Login with Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
            <Image source={require('./assets/google.png')} style={styles.googleLogo} />
            <Text style={styles.socialButtonText}>Login with Google</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>or continue with email</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              editable={!isLoading}
              blurOnSubmit={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              ref={passwordInputRef}
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={isLoading} style={styles.eyeIcon}>
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={24}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading} style={styles.forgotPasswordContainer}>
             <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>


          {/* Login Button */}
          <TouchableOpacity
            style={[styles.mainButton, isLoading && styles.mainButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.mainButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
    // ... (الأنماط تبقى كما هي) ...
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    scrollContentContainer: { flexGrow: 1, paddingBottom: 30 },
    tabContainerWrapper: { backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: '#eee', zIndex: 10 },
    tabContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    activeTab: {},
    tabText: { fontSize: 17, fontWeight: '600', color: '#999' },
    activeTabText: { color: '#000' },
    greenLine: { backgroundColor: '#3CB043', height: 3, position: 'absolute', bottom: -5, left: 0, right: 0 },
    content: { paddingHorizontal: 25, paddingTop: 30 },
    socialButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 15, marginBottom: 15 },
    buttonIcon: { marginRight: 12 },
    googleLogo: { width: 22, height: 22, marginRight: 12 },
    socialButtonText: { fontSize: 16, fontWeight: '500', color: '#333' },
    orText: { textAlign: 'center', marginVertical: 20, color: '#999', fontSize: 14 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 20, paddingBottom: 8 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, height: 40, fontSize: 16, color: '#333' },
    eyeIcon: { paddingLeft: 10 },
    forgotPasswordContainer: { alignItems: 'flex-end', marginBottom: 30 },
    forgotPasswordText: { color: '#555', fontSize: 14, fontWeight: '500' },
    mainButton: { backgroundColor: '#3CB043', paddingVertical: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
    mainButtonDisabled: { backgroundColor: '#a8d8aa', opacity: 0.7 },
    mainButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default LoginScreen;

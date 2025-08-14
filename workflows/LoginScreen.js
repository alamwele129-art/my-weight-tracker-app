// LoginScreen.js (Full code with Supabase & Social Logins)
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
// <<< 1. استيراد أيقونات ومكتبات ضرورية >>>
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { supabase } from './supabaseClient'; // استيراد Supabase client

const LoginScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  // --- State ---
  const [activeTab, setActiveTab] = useState('Login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  
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

  // <<< 2. تحديث دالة تسجيل الدخول لتستخدم Supabase >>>
  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !password) {
      Alert.alert('خطأ', 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Supabase Login Error:', error.message);
        Alert.alert('فشل الدخول', 'البريد الإلكتروني أو كلمة المرور غير صحيحة. حاول مرة أخرى.');
      } else {
        console.log('Login successful with Supabase:', data);
        // لا حاجة لحفظ أي شيء في AsyncStorage، Supabase تدير الجلسة.
        // سيتم توجيه المستخدم تلقائيًا بواسطة Navigator الرئيسي الذي يراقب حالة المصادقة.
      }
    } catch (error) {
      console.error('Unexpected Login Error:', error);
      Alert.alert('خطأ', 'حدث خطأ غير متوقع أثناء محاولة تسجيل الدخول.');
    } finally {
      setIsLoading(false);
    }
  };

  // <<< 3. إضافة دوال تسجيل الدخول الاجتماعي >>>
  const handleSocialLogin = async (provider) => {
    if (provider === 'google') setIsGoogleLoading(true);
    if (provider === 'facebook') setIsFacebookLoading(true);

    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
        });

        if (error) {
            console.error(`${provider} Login Error:`, error.message);
            Alert.alert(`خطأ في تسجيل الدخول بـ${provider}`, error.message);
        } else {
            console.log(`${provider} login successful:`, data);
        }
    } catch (error) {
        console.error(`Unexpected ${provider} Login Error:`, error);
        Alert.alert('خطأ', `حدث خطأ غير متوقع أثناء محاولة تسجيل الدخول بـ${provider}.`);
    } finally {
        if (provider === 'google') setIsGoogleLoading(false);
        if (provider === 'facebook') setIsFacebookLoading(false);
    }
  };

  // --- دالة نسيت كلمة المرور ---
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword', { email: email });
  };

  // --- أيقونة التحميل العامة ---
  const anyLoading = isLoading || isGoogleLoading || isFacebookLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* Tab Bar */}
      <View style={styles.tabContainerWrapper}>
          <View style={styles.tabContainer}>
              <TouchableOpacity
                  style={[ styles.tab, activeTab === 'Login' && styles.activeTab ]}
                  onPress={() => handleTabPress('Login')}
                  disabled={anyLoading}
              >
                  <Text style={[ styles.tabText, activeTab === 'Login' && styles.activeTabText ]}>
                      Login
                  </Text>
                  {activeTab === 'Login' && <View style={styles.greenLine} />}
              </TouchableOpacity>
              <TouchableOpacity
                  style={[ styles.tab, activeTab === 'SignUp' && styles.activeTab ]}
                  onPress={() => handleTabPress('SignUp')}
                  disabled={anyLoading}
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
          {/* <<< 4. تعديل أزرار تسجيل الدخول الاجتماعي >>> */}
          <TouchableOpacity 
            style={styles.socialButton} 
            disabled={anyLoading}
            onPress={() => handleSocialLogin('facebook')}
          >
            {isFacebookLoading ? (
              <ActivityIndicator size="small" color="#1877F2" style={styles.buttonIcon} />
            ) : (
              <FontAwesome name="facebook-square" size={24} color="#1877F2" style={styles.buttonIcon} />
            )}
            <Text style={styles.socialButtonText}>Login with Facebook</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialButton} 
            disabled={anyLoading}
            onPress={() => handleSocialLogin('google')}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color="#888" style={styles.buttonIcon} />
            ) : (
              <Image source={require('./assets/google.png')} style={styles.googleLogo} />
            )}
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
              editable={!anyLoading}
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
              editable={!anyLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={anyLoading} style={styles.eyeIcon}>
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={24}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity onPress={handleForgotPassword} disabled={anyLoading} style={styles.forgotPasswordContainer}>
             <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>


          {/* Login Button */}
          <TouchableOpacity
            style={[styles.mainButton, anyLoading && styles.mainButtonDisabled]}
            onPress={handleLogin}
            disabled={anyLoading}
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
    socialButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 15, marginBottom: 15, minHeight: 48 },
    buttonIcon: { marginRight: 12, width: 24, textAlign: 'center'},
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
    mainButtonDisabled: { backgroundColor: '#a8d8aa' },
    mainButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default LoginScreen;
// SignUpScreen.js (With the fix for email confirmation)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, FontAwesome, AntDesign } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import {
  makeRedirectUri,
  useAuthRequest,
  ResponseType,
} from 'expo-auth-session';

// --- Supabase Client Setup ---
import { supabase } from './supabaseClient';

WebBrowser.maybeCompleteAuthSession();

// --- Constants ---
const IOS_CLIENT_ID = 'YOUR_IOS_CLIENT_ID'; // Replace!
const ANDROID_CLIENT_ID = '731481779099-3kl627gi15uvcif991948cjh1elu63sc.apps.googleusercontent.com'; // Your ID
const WEB_CLIENT_ID = '731481779099-vngs3div3n2oeomtue4bmuddq3ravbk7.apps.googleusercontent.com'; // Your ID

const redirectUri = makeRedirectUri({
  useProxy: Platform.OS !== 'web',
});

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const SignUpScreen = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    // --- State Variables ---
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [activeTab, setActiveTab] = useState('SignUp');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const [passwordValid, setPasswordValid] = useState({
        length: false,
        number: false,
        case: false,
    });

    // --- Refs for Input Focus ---
    const emailInputRef = useRef(null);
    const passwordInputRef = useRef(null);
    const confirmPasswordInputRef = useRef(null);

    // --- Google Sign-In Hook ---
    const [request, response, promptAsync] = useAuthRequest(
        {
            responseType: ResponseType.Code,
            clientId: Platform.OS === 'ios' ? IOS_CLIENT_ID : Platform.OS === 'android' ? ANDROID_CLIENT_ID : WEB_CLIENT_ID,
            scopes: ['profile', 'email'],
            redirectUri,
            usePKCE: true,
        },
        discovery
    );

    // --- Handle Google Sign-In Response ---
    useEffect(() => {
        const handleGoogleResponse = async () => {
            if (response?.type === 'success') {
                const { code } = response.params;
                setIsGoogleLoading(true);
                try {
                    console.log("Google Auth Code:", code);
                    // This part still needs implementation to exchange the code for a Supabase session
                    Alert.alert('نجاح (محاكاة)', 'تم تسجيل الدخول بحساب جوجل! يرجى إكمال الملف الشخصي (إذا لزم الأمر).');
                    console.log("Google Sign-In successful (simulated exchange).");

                } catch (error) {
                    console.error('Error during Google token exchange or Supabase sign-in:', error);
                    Alert.alert('خطأ في تسجيل الدخول بجوجل', 'فشل إكمال تسجيل الدخول. حاول مرة أخرى.');
                } finally {
                    setIsGoogleLoading(false);
                }
            } else if (response?.type === 'error') {
                console.error('Google Sign-In Error:', response.error);
                Alert.alert('خطأ في تسجيل الدخول بجوجل', response.error?.message || 'حدث خطأ غير معروف.');
                setIsGoogleLoading(false);
            } else if (response?.type === 'cancel'){
                 console.log('Google Sign-In Cancelled');
                 setIsGoogleLoading(false);
            }
        };
        handleGoogleResponse();
    }, [response]);

    // --- Trigger Google Authentication ---
    const handleGoogleSignIn = async () => {
        if (isGoogleLoading || !request) return;
        setIsGoogleLoading(true);
        try {
            await promptAsync();
        } catch (error) {
            console.error('Error prompting Google Sign-In:', error);
            Alert.alert('خطأ في تسجيل الدخول بجوجل', 'لم نتمكن من بدء عملية تسجيل الدخول.');
            setIsGoogleLoading(false);
        }
    };

    // --- Handle Password Input Change ---
    const handlePasswordChange = (text) => {
        setPassword(text);
        setPasswordValid({
             length: text.length >= 8,
             number: /\d/.test(text),
             case: /[a-z]/.test(text) && /[A-Z]/.test(text),
        });
    };

    // --- Handle Standard Sign Up ---
    const handleSignUp = async () => {
        if (!name) return Alert.alert('خطأ', 'الرجاء إدخال اسمك.');
        if (!email) return Alert.alert('خطأ', 'الرجاء إدخال بريدك الإلكتروني.');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return Alert.alert('خطأ', 'الرجاء إدخال بريد إلكتروني صالح.');
        if (!password) return Alert.alert('خطأ', 'الرجاء إدخال كلمة المرور.');
        if (password !== confirmPassword) return Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين!');
        if (!passwordValid.length || !passwordValid.number || !passwordValid.case) {
             return Alert.alert('خطأ', 'كلمة المرور لا تفي بالمتطلبات!');
        }
        if (!agreeTerms) return Alert.alert('خطأ', 'الرجاء الموافقة على الشروط والأحكام.');

        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                    },
                    // <<<--- التعديل الوحيد والمهم هنا ---<<<
                    // هذا السطر يخبر Supabase إلى أين يوجه المستخدم بعد تأكيد البريد الإلكتروني.
                    // وهو ضروري لكي تعمل عملية التأكيد بشكل صحيح في Expo Snack و Expo Go.
                    emailRedirectTo: makeRedirectUri(),
                }
            });

            if (error) {
                if (error.message.includes("User already registered")) {
                    Alert.alert('خطأ', 'هذا البريد الإلكتروني مسجل بالفعل. حاول تسجيل الدخول.');
                } else if (error.message.includes("Password should be at least 6 characters")) {
                    Alert.alert('خطأ', 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
                }
                else {
                    Alert.alert('خطأ في التسجيل', error.message || 'حدث خطأ غير متوقع.');
                }
                console.error('Supabase Sign Up Error:', error);
                return;
            }

            if (data.user && !data.session) {
                Alert.alert(
                    'نجاح!',
                    `تم إنشاء حسابك بنجاح. لقد أرسلنا رسالة تأكيد إلى ${email}. يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك.`
                );
                navigation.navigate('Login');
            } else if (data.user && data.session) {
                Alert.alert('نجاح!', 'تم إنشاء حسابك وتسجيل دخولك بنجاح.');
            } else {
                Alert.alert('إشعار', 'اكتمل التسجيل. يرجى التحقق من بريدك الإلكتروني للتأكيد.');
                navigation.navigate('Login');
            }

        } catch (error) {
            console.error('Unexpected Sign Up Error:', error);
            Alert.alert('خطأ', 'حدث خطأ غير متوقع أثناء إنشاء الحساب. حاول مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };


    // --- Handle Tab Navigation ---
    const handleTabPress = (tabName) => {
        setActiveTab(tabName);
        if (tabName === 'Login') {
             navigation.navigate('Login');
        }
    };

    // --- Set Active Tab on Focus ---
    useEffect(() => {
        if (isFocused) {
             setActiveTab('SignUp');
        }
    }, [isFocused]);

    // --- Function to Open Terms Link ---
    const termsUrl = 'https://asdvovo.github.io/app-terms/terms.html';
    const handleOpenTermsLink = async () => {
        try {
            await WebBrowser.openBrowserAsync(termsUrl);
        } catch (error) {
            console.error("Failed to open terms URL:", error);
            Alert.alert('خطأ', 'لم نتمكن من فتح رابط الشروط والأحكام.');
        }
    };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      {/* Tab Bar */}
      <View style={styles.tabContainerWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[ styles.tab, activeTab === 'Login' && styles.activeTab ]}
            onPress={() => handleTabPress('Login')}
            disabled={isLoading || isGoogleLoading}
          >
            <Text style={[ styles.tabText, activeTab === 'Login' && styles.activeTabText ]}>
              Login
            </Text>
            {activeTab === 'Login' && <View style={styles.greenLine} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[ styles.tab, activeTab === 'SignUp' && styles.activeTab ]}
            onPress={() => handleTabPress('SignUp')}
            disabled={isLoading || isGoogleLoading}
          >
            <Text style={[ styles.tabText, activeTab === 'SignUp' && styles.activeTabText ]}>
              Sign Up
            </Text>
            {activeTab === 'SignUp' && <View style={styles.greenLine} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Content */}
      <ScrollView
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Social Sign Up Buttons */}
          <TouchableOpacity style={styles.socialButton} disabled={isLoading || isGoogleLoading}>
            <AntDesign name="apple1" size={24} color="black" style={styles.buttonIcon} />
            <Text style={styles.socialButtonText}>Sign up with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading || !request}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color="#888" style={styles.buttonIcon} />
            ) : (
              <Image source={require('./assets/google.png')} style={styles.googleLogo} />
            )}
            <Text style={styles.socialButtonText}>Sign up with Google</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>or continue with email</Text>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <FontAwesome name="user-o" size={20} color="#888" style={styles.inputIcon}/>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              onSubmitEditing={() => emailInputRef.current?.focus()}
              editable={!isLoading && !isGoogleLoading}
              blurOnSubmit={false}
              autoCapitalize="words"
             />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#888" style={styles.inputIcon}/>
            <TextInput
              ref={emailInputRef}
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              editable={!isLoading && !isGoogleLoading}
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              ref={passwordInputRef}
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showNewPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
              editable={!isLoading && !isGoogleLoading}
              blurOnSubmit={false}
              textContentType="newPassword"
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} disabled={isLoading || isGoogleLoading} style={styles.eyeIcon}>
              <MaterialIcons name={showNewPassword ? 'visibility' : 'visibility-off'} size={24} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              ref={confirmPasswordInputRef}
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
              editable={!isLoading && !isGoogleLoading}
              textContentType="newPassword"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading || isGoogleLoading} style={styles.eyeIcon}>
              <MaterialIcons name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={24} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Password Requirements */}
          <View style={styles.passwordRequirements}>
             <Text style={[styles.requirementText, passwordValid.length && styles.validRequirement]}>
                <MaterialIcons name={passwordValid.length ? "check-circle" : "radio-button-unchecked"} size={16} color={passwordValid.length ? "#3CB043" : "#999"} style={styles.reqIcon} /> At least 8 characters
            </Text>
            <Text style={[styles.requirementText, passwordValid.number && styles.validRequirement]}>
                <MaterialIcons name={passwordValid.number ? "check-circle" : "radio-button-unchecked"} size={16} color={passwordValid.number ? "#3CB043" : "#999"} style={styles.reqIcon}/> At least 1 number
            </Text>
            <Text style={[styles.requirementText, passwordValid.case && styles.validRequirement]}>
                <MaterialIcons name={passwordValid.case ? "check-circle" : "radio-button-unchecked"} size={16} color={passwordValid.case ? "#3CB043" : "#999"} style={styles.reqIcon}/> Both upper & lower case
            </Text>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}
              onPress={() => setAgreeTerms(!agreeTerms)}
              disabled={isLoading || isGoogleLoading}
            >
              {agreeTerms && <MaterialIcons name="check" size={16} color="white" />}
            </TouchableOpacity>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.linkText} onPress={handleOpenTermsLink}>
                Terms
              </Text>
              {' '}and{' '}
              <Text style={styles.linkText} onPress={handleOpenTermsLink}>
                Conditions
              </Text>
              .
            </Text>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
             style={[
                 styles.mainButton,
                 (isLoading || isGoogleLoading || !agreeTerms || !passwordValid.length || !passwordValid.number || !passwordValid.case) && styles.mainButtonDisabled
             ]}
             onPress={handleSignUp}
             disabled={isLoading || isGoogleLoading || !agreeTerms || !passwordValid.length || !passwordValid.number || !passwordValid.case}
           >
             {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
             ) : (
                <Text style={styles.mainButtonText}>Sign Up</Text>
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
    scrollContentContainer: { flexGrow: 1, paddingBottom: 20 },
    tabContainerWrapper: { backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: '#eee', zIndex: 10 },
    tabContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    activeTab: {},
    tabText: { fontSize: 17, fontWeight: '600', color: '#999' },
    activeTabText: { color: '#000' },
    greenLine: { backgroundColor: '#3CB043', height: 3, position: 'absolute', bottom: -5, left: 0, right: 0 },
    content: { paddingHorizontal: 25, paddingTop: 20 },
    socialButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 15, marginBottom: 12, minHeight: 44 },
    buttonIcon: { marginRight: 12, width: 24, textAlign: 'center' },
    googleLogo: { width: 22, height: 22, marginRight: 12 },
    socialButtonText: { fontSize: 16, fontWeight: '500', color: '#333' },
    orText: { textAlign: 'center', marginVertical: 15, color: '#999', fontSize: 14 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 15, paddingBottom: 5 },
    inputIcon: { marginRight: 12, width: 20 },
    input: { flex: 1, height: 40, fontSize: 16, color: '#333' },
    eyeIcon: { paddingLeft: 10 },
    passwordRequirements: { marginVertical: 10, paddingLeft: 5 },
    requirementText: { fontSize: 13, color: '#666', marginBottom: 4, flexDirection: 'row', alignItems: 'center' },
    reqIcon: { marginRight: 6 },
    validRequirement: { color: '#3CB043' },
    termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    checkbox: { width: 20, height: 20, borderWidth: 1.5, borderColor: '#999', borderRadius: 3, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
    checkboxChecked: { backgroundColor: '#3CB043', borderColor: '#3CB043' },
    termsText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 18 },
    linkText: { color: '#3CB043', fontWeight: '600', textDecorationLine: 'underline' },
    mainButton: { backgroundColor: '#3CB043', paddingVertical: 13, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
    mainButtonDisabled: { backgroundColor: '#a8d8aa' },
    mainButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default SignUpScreen;
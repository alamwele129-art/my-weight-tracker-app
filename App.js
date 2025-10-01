// ملف: App.js (الكود النهائي والمعدل)

import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from './supabaseclient';

// --- استيراد الشاشات ---
import SplashScreen from './Splash'; // شاشة الانتظار فقط
import IndexScreen from './Index';
import SignInScreen from './signin';
import SignUpScreen from './signup';
import ForgotPasswordScreen from './forgotpassword';
import EmailVerificationScreen from './emailverification';
import ResetPasswordScreen from './resetpassword';
import BasicInfoScreen from './basicinfo';
import MeasurementsScreen from './measurements';
import GoalScreen from './goal';
import ActivityLevelScreen from './activitylevel';
import ResultsScreen from './results';
import MainUI from './mainui';
import EditProfileScreen from './editprofile';
import ProfileScreen from './profile';
import SettingsScreen from './setting';
import ReportsScreen from './reports';
import AboutScreen from './about';

const Stack = createStackNavigator();

// Navigator لشاشات المصادقة (التسجيل والدخول)
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Index" component={IndexScreen} />
    <Stack.Screen name="SignIn" component={SignInScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
    {/* ... باقي شاشات التسجيل */}
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    <Stack.Screen name="BasicInfo" component={BasicInfoScreen} />
    <Stack.Screen name="Measurements" component={MeasurementsScreen} />
    <Stack.Screen name="Goal" component={GoalScreen} />
    <Stack.Screen name="ActivityLevel" component={ActivityLevelScreen} />
    <Stack.Screen name="Results" component={ResultsScreen} />
  </Stack.Navigator>
);

// Navigator لشاشات التطبيق الرئيسية بعد تسجيل الدخول
const MainAppStack = () => (
  <Stack.Navigator initialRouteName="MainUI" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainUI" component={MainUI} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Reports" component={ReportsScreen} />
    <Stack.Screen name="About" component={AboutScreen} />
  </Stack.Navigator>
);

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅✅✅ هنا هو التعديل الأساسي ✅✅✅
    const initializeApp = async () => {
      try {
        // المهمة الأولى: التحقق من جلسة المستخدم
        const sessionPromise = supabase.auth.getSession();
        
        // المهمة الثانية: مؤقت لضمان ظهور الشاشة لمدة ثانيتين على الأقل
        const minTimePromise = new Promise(resolve => setTimeout(resolve, 2000)); // 2000ms = 2 seconds

        // انتظر حتى تنتهي المهمتان معاً
        const [{ data }] = await Promise.all([sessionPromise, minTimePromise]);
        
        setSession(data.session);

      } catch (error) {
        console.error("Initialization error:", error);
        setSession(null); // في حالة الخطأ، اعتبر أن المستخدم غير مسجل
      } finally {
        // بعد انتهاء كل شيء، قم بإخفاء شاشة التحميل
        setLoading(false);
      }
    };

    initializeApp();

    // هذا الجزء يستمع للتغييرات (مثل تسجيل الخروج) بعد فتح التطبيق
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // إذا كان التطبيق لا يزال في مرحلة التحميل، أظهر شاشة الـ Splash
  if (loading) {
    return <SplashScreen />;
  }

  // بعد انتهاء التحميل، قرر أي واجهة ستعرض
  return (
    <SafeAreaProvider>
      <View style={styles.rootContainer}>
        <NavigationContainer>
          {session && session.user ? <MainAppStack /> : <AuthStack />}
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
// App.js (الكود الكامل والنهائي)

import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// --- استيراد جميع الشاشات المستخدمة ---
import SplashScreen from './Splash';
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
import SettingsScreen from './setting'; // <-- الخطوة 1: استيراد شاشة الإعدادات

const Stack = createStackNavigator();

const SplashScreenWrapper = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Index');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigation]);

  return <SplashScreen />;
};

const App = () => {
  return (
    <SafeAreaProvider>
      <View style={styles.rootContainer}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{ headerShown: false }}>
            
            <Stack.Screen name="Splash" component={SplashScreenWrapper} />
            <Stack.Screen name="Index" component={IndexScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="BasicInfo" component={BasicInfoScreen} />
            <Stack.Screen name="Measurements" component={MeasurementsScreen} />
            <Stack.Screen name="Goal" component={GoalScreen} />
            <Stack.Screen name="ActivityLevel" component={ActivityLevelScreen} />
            <Stack.Screen name="Results" component={ResultsScreen} />
            <Stack.Screen name="Main" component={MainUI} />
            <Stack.Screen name="Profile" component={ProfileScreen} /> 
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            
            {/* <-- الخطوة 2: إضافة الشاشة إلى المكدس */}
            <Stack.Screen name="Settings" component={SettingsScreen} />

          </Stack.Navigator>
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
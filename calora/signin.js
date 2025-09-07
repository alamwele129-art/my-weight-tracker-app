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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#4CAF50',
  background: '#F8F9FA',
  white: '#FFFFFF',
  darkText: '#212529',
  grayText: '#6C757D',
  borderColor: '#E9ECEF',
};

const SignInScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);

  const handleEmailChange = (text) => {
    const englishEmailRegex = /^[a-zA-Z0-9@._-]*$/;
    if (englishEmailRegex.test(text)) {
      setEmail(text);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.header}>
        <Image
          source={require('./assets/leafshadowcorner.png')} 
          style={styles.headerImageTopLeft}
          resizeMode="contain"
        />
        <Image
          source={require('./assets/palmleaf3.png')} 
          style={styles.headerImageBottomRight}
          resizeMode="contain"
        />
        <Text style={styles.title}>Hello!</Text>
        <Text style={styles.subtitle}>Welcome back</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.loginTitle}>Login</Text>

          {/* Email Input */}
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

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={COLORS.grayText} style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor={COLORS.grayText}
              style={styles.input}
              secureTextEntry={isPasswordSecure}
            />
            <TouchableOpacity onPress={() => setIsPasswordSecure(!isPasswordSecure)}>
              <Icon 
                name={isPasswordSecure ? 'eye-off' : 'eye'} 
                size={20} 
                color={COLORS.grayText} 
              />
            </TouchableOpacity>
          </View>

          {/* ========================================================== */}
          {/*          <<<--- هذا هو السطر الذي تم تعديله --->>>          */}
          {/* ========================================================== */}
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or login with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Logins */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
                <Image
                  source={require('./assets/google.png')} 
                  style={styles.socialIconImage}
                />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
                <FontAwesome name="facebook-f" size={24} color="#4267B2" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={[styles.signUpText, styles.signUpLink]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- باقي الكود (الستايلات) يبقى كما هو بدون أي تغيير ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    height: height * 0.3,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerImageTopLeft: {
    position: 'absolute',
    top: -60,
    left: -70,
    width: 290,
    height: 290,
    opacity: 0.8,
    transform: [{ rotate: '0deg' }]
  },
  headerImageBottomRight: {
    position: 'absolute',
    bottom: -9,
    right: 14,
    width: 130,
    height: 130,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.white,
    marginTop: 5,
  },
  card: {
    position: 'absolute',
    top: height * 0.25,
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    paddingHorizontal: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    paddingHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    height: 55,
  },
  inputIcon: {
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkText,
  },
  forgotPassword: {
    textAlign: 'right',
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 10,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderColor,
  },
  dividerText: {
    marginHorizontal: 15,
    color: COLORS.grayText,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 25,
  },
  socialButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  socialIconImage: {
    width: 28,
    height: 28,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signUpText: {
    color: COLORS.grayText,
    fontSize: 14,
  },
  signUpLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default SignInScreen;
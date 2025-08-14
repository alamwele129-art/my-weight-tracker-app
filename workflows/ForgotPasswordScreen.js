import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  ScrollView, // تأكد من استيراده
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#3CB043',
  white: '#fff',
  gray: '#999',
  lightGray: '#ccc',
  black: '#000',
  red: '#FF0000',
};

// Placeholder for the image asset - replace with your actual path
const passwordImage = require('./assets/password.png');

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // للتحقق من الحالة عند تحميل المكون (اختياري للتصحيح)
  useEffect(() => {
    console.log('COMPONENT MOUNTED --- Initial isLoading:', isLoading);
  }, []);

  const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleContinue = async () => {
    Keyboard.dismiss();
    setError(null);

    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    console.log('HANDLE CONTINUE --- Setting isLoading to TRUE');
    setIsLoading(true);
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('HANDLE CONTINUE --- Task finished, navigating...');
      // Navigate to the next screen (replace with your actual navigation logic)
      Alert.alert("Success", "Password reset link sent to " + email);
      // Example: navigation.navigate('VerificationCode', { email: email });
      // Since VerificationCode screen is not provided, we use an alert.
    } catch (apiError) {
      console.error("HANDLE CONTINUE --- Error during task:", apiError);
      setError('Failed to send reset email. Please try again.');
    } finally {
      console.log('HANDLE CONTINUE --- FINALLY block, Setting isLoading to FALSE');
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (error) setError(null);
  };

  console.log('RENDERING --- Current isLoading state:', isLoading);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Inner container for all content */}
        <View style={styles.innerContent}>
          {/* Top Section: Title and Subtitle */}
          <View style={styles.topSection}>
             <Text style={styles.title}>Forgot Password</Text>
             <Text style={styles.subtitle}>Enter your email account to reset password</Text>
          </View>

          {/* Image */}
          <Image source={passwordImage} style={styles.image} resizeMode="contain" />

          {/* Spacer View: This pushes the bottom section down */}
          <View style={styles.spacer} />

          {/* Bottom Section: Input, Error, Buttons */}
          <View style={styles.bottomSection}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={24} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.gray}
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                editable={!isLoading}
                accessibilityLabel="Email input"
                accessibilityHint="Enter the email address associated with your account"
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, styles.continueButton, isLoading && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={isLoading}
              accessibilityLabel="Continue button"
              accessibilityHint="Sends a password reset link to your email"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton, isLoading && styles.buttonDisabled]}
              onPress={() => navigation ? navigation.goBack() : Alert.alert("Cancel Pressed")} // Added fallback for testing without navigation
              disabled={isLoading}
              accessibilityLabel="Cancel button"
              accessibilityHint="Returns to the previous screen"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1, // Ensure the container fills the screen
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    flexGrow: 1, // Allows content to grow and enable scrolling if needed
    // Removed justifyContent: 'space-between' - We now control vertical spacing inside innerContent
  },
  innerContent: {
    flex: 1, // Makes this container take up all available vertical space within scrollContainer
    alignItems: 'center', // Centers all children horizontally
    paddingHorizontal: 20, // General horizontal padding
    paddingTop: 40,       // Space from the top (adjustable)
    paddingBottom: 20,    // Space from the bottom (adjustable)
    // No justifyContent here; vertical distribution is handled by the spacer
  },
  topSection: {
    width: '100%',       // Takes full width for correct centering of text
    alignItems: 'center', // Center title and subtitle internally
    marginBottom: 30,    // Space between this section and the image (adjustable)
  },
  bottomSection: {
    width: '100%',       // Takes full width to center buttons and input field
    alignItems: 'center', // Center elements internally
    // marginTop is effectively handled by the spacer pushing it down
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 20, // Keep text from hitting edges on narrow screens
  },
  image: {
    width: 365, // Adjust size as needed
    height: 365,
    // marginBottom is effectively handled by the spacer
  },
  spacer: {
      flex: 1, // This view will expand and push the bottomSection downwards
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 15, // Space between input field and error message/continue button
    width: '100%', // Takes the width of bottomSection
    paddingHorizontal: 10,
    backgroundColor: COLORS.white,
    height: 50, // Fixed height for the input field
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%', // Make the text input fill the container height
    fontSize: 16,
    color: COLORS.black,
  },
  errorText: {
      color: COLORS.red,
      marginBottom: 15, // Space before the continue button
      fontSize: 14,
      textAlign: 'center',
      width: '100%', // Ensure centering
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%', // Takes the width of bottomSection
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50, // Minimum button height
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    marginBottom: 15, // Space between continue and cancel buttons
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    // No background
  },
  cancelButtonText: {
    color: COLORS.gray,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
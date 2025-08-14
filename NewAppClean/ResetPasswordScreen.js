import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard, // Import Keyboard
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Define colors similar to ForgotPasswordScreen for consistency
const COLORS = {
  primary: '#3CB043',
  white: '#fff',
  gray: '#999', // Adjusted slightly from #777/#888 for consolidation
  lightGray: '#ccc',
  black: '#333', // Using #333 as the main black/dark color
  red: '#FF0000',
};

// --- Use the same image asset name or update as needed ---
const resetImage = require('./assets/resetpassword.png'); // Ensure this path is correct

const ResetPasswordScreen = ({ navigation }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null); // Add error state

  const handleContinue = () => {
    Keyboard.dismiss(); // Dismiss keyboard
    setError(null); // Clear previous errors

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      // Alert.alert("Error", "Please fill in both password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      // Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match!");
      // Alert.alert("Error", "Passwords don't match!");
      return;
    }


    console.log('Attempting to reset password with:', newPassword);
    // TODO: Implement actual reset password logic here
    // (e.g., send a request to your backend API)
    // Upon successful reset:
    Alert.alert("Success", "Password has been reset successfully!", [
      { text: "OK", onPress: () => navigation.navigate('Weight') } // Or navigate to Login screen
    ]);
    // If there's an error from the server:
    // setError("Could not reset password. Please try again.");
    // Alert.alert("Error", "Could not reset password. Please try again.");
  };

  // Clear error when typing
  const handlePasswordChange = (setter) => (text) => {
      setter(text);
      if (error) setError(null);
  }

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
            <Text style={styles.title}>Reset Your Password</Text>
            <Text style={styles.subtitle}>The password must be different than before and at least 6 characters long</Text>
          </View>

          {/* Image */}
          <Image source={resetImage} style={styles.image} resizeMode="contain" />

          {/* Spacer View: Pushes the bottom section down */}
          <View style={styles.spacer} />

          {/* Bottom Section: Inputs, Error, Buttons */}
          <View style={styles.bottomSection}>

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock-outline" size={24} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor={COLORS.gray}
                value={newPassword}
                // onChangeText={setNewPassword} // Use wrapper to clear error
                onChangeText={handlePasswordChange(setNewPassword)}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                returnKeyType="next" // Change return key type
                onSubmitEditing={() => this.confirmPasswordInput.focus()} // Focus next input
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons
                  name={showNewPassword ? 'visibility' : 'visibility-off'}
                  size={24}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock-outline" size={24} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                ref={(input) => { this.confirmPasswordInput = input; }} // Add ref for focusing
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor={COLORS.gray}
                value={confirmPassword}
                // onChangeText={setConfirmPassword} // Use wrapper to clear error
                onChangeText={handlePasswordChange(setConfirmPassword)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                returnKeyType="done" // Change return key type
                onSubmitEditing={handleContinue} // Submit on done
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons
                  name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                  size={24}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>

            {/* Error Message Display */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Continue Button */}
            <TouchableOpacity
                style={[styles.button, styles.continueButton]}
                onPress={handleContinue}
                // disabled={isLoading} // Add if you introduce loading state
                accessibilityLabel="Continue button"
                accessibilityHint="Resets your password with the new credentials"
             >
              {/* Add ActivityIndicator if needed */}
              {/* {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : ( */}
                <Text style={styles.buttonText}>Continue</Text>
              {/* )} */}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => navigation.goBack()}
                // disabled={isLoading} // Add if you introduce loading state
                accessibilityLabel="Cancel button"
                accessibilityHint="Returns to the previous screen without resetting password"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Styles adapted from ForgotPasswordScreen structure
const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    flexGrow: 1,
    // Removed justifyContent: 'center' - using spacer now
  },
  innerContent: {
    flex: 1, // Takes up all available vertical space
    alignItems: 'center', // Centers children horizontally
    paddingHorizontal: 20,
    paddingTop: 40, // Space from the top
    paddingBottom: 20, // Space from the bottom
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30, // Space between text and image
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    // marginTop handled by spacer
  },
  title: {
    fontSize: 28, // Matched size
    fontWeight: 'bold',
    color: COLORS.black, // Use defined color
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16, // Matched size
    color: COLORS.gray, // Use defined color
    textAlign: 'center',
    paddingHorizontal: 20, // Prevent text hitting edges
  },
  image: {
    // Adjust size to be similar to ForgotPasswordScreen's image, or keep original
    width: 290, // Example size, adjust as needed
    height: 290, // Example size, adjust as needed
    // marginBottom handled by spacer
  },
  spacer: {
      flex: 1, // Expands to push bottomSection down
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1, // Changed from borderBottomWidth
    borderColor: COLORS.lightGray, // Use defined color
    borderRadius: 8, // Added border radius
    marginBottom: 20, // Adjusted spacing between inputs/error
    width: '100%', // Use full width of bottomSection
    paddingHorizontal: 10, // Added padding
    backgroundColor: COLORS.white,
    height: 50, // Added fixed height
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%', // Fill container height
    fontSize: 16,
    color: COLORS.black, // Use defined color
  },
  errorText: { // Added error text style
      color: COLORS.red,
      marginBottom: 15, // Space before the continue button
      fontSize: 14,
      textAlign: 'center',
      width: '100%',
  },
  button: { // Generic button style
    paddingVertical: 15, // Matched padding
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50, // Matched height
  },
  continueButton: { // Specific continue button style
    backgroundColor: COLORS.primary, // Use defined color
    marginBottom: 15, // Matched spacing
    // Removed shadow from original, add back if needed
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.15,
    // shadowRadius: 3,
    // elevation: 3,
  },
  buttonDisabled: { // Added disabled style
    opacity: 0.6,
  },
  buttonText: { // Style for text inside primary button
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: { // Specific cancel button style
    // No background
  },
  cancelButtonText: { // Style for text inside cancel button
    color: COLORS.gray, // Use defined color
    fontSize: 16,
    fontWeight: 'bold', // Matched weight
  },
});

export default ResetPasswordScreen;
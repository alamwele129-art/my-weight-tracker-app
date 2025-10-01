// ملف: SplashScreen.js (يبقى كما هو بدون تغيير)

import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, StatusBar } from 'react-native';

const logoImage = require('./assets/splash.png'); 

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#e8f5e9" />
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <Image source={logoImage} style={styles.logo} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
});

export default SplashScreen;
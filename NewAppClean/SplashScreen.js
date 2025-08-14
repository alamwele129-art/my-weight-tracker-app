import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import logo from './assets/advancedweighttracker.png';

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // قيمة مبدئية للشفافية

  useEffect(() => {
    Animated.timing(
      fadeAnim,
      {
        toValue: 1, // القيمة النهائية للشفافية (غير شفاف)
        duration: 1500, // مدة الانتقال بالمللي ثانية
        useNativeDriver: true, // تحسين الأداء
      }
    ).start();
  }, [fadeAnim]);

  return (
    <Animated.View // استبدل View بـ Animated.View
      style={{
        ...styles.container,
        opacity: fadeAnim, // ربط الشفافية بقيمة الرسوم المتحركة
      }}
    >
      <Image source={logo} style={styles.logo} />
    </Animated.View>
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
    width: 80,
    height: 80,
  },
});

export default SplashScreen;
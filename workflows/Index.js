import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  I18nManager,
  Platform // تأكد من استيراده
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// --- النصوص والصور تبقى كما هي ---
const texts = {
  en: [
    { heading: "Advanced Weight Tracker", paragraph: "Welcome to Advanced Weight Tracker! Discover amazing features to enhance your daily experience." },
    { heading: "Track Your Diet", paragraph: "Easily log your daily meals and learn about their nutritional value to achieve your health goals." },
    { heading: "Track Your Progress", paragraph: "Visualize your weight loss journey with our interactive charts. Set goals, monitor trends, and celebrate your achievements!" }
  ],
  ar: [
    { heading: "متعقب الوزن المتقدم", paragraph: "مرحبًا بكم في متعقب الوزن المتقدم! اكتشف ميزات مذهلة لتحسين تجربتك اليومية." },
    { heading: "تتبع نظامك الغذائي", paragraph: "سجل وجباتك اليومية بسهولة وتعرف على قيمتها الغذائية لتحقيق أهدافك الصحية." },
    { heading: "تتبع تقدمك", paragraph: "تصور رحلتك في فقدان الوزن باستخدام مخططاتنا التفاعلية. حدد الأهداف، وتابع الاتجاهات، واحتفل بإنجازاتك!" }
  ]
};

const images = [
  'https://i.imgur.com/hfP1V3x.png',
  'https://i.imgur.com/7sxA6Sw.png',
  'https://i.imgur.com/CPLIluy.jpeg'
];
// ---------------------------------

const IndexScreen = () => {
  const navigation = useNavigation();
  const [currentSection, setCurrentSection] = useState(0);
  const [language, setLanguage] = useState('ar');

  useEffect(() => {
    setLanguage('ar');
    I18nManager.forceRTL(true);
  }, []);

  const showSection = (sectionNumber) => {
    if (sectionNumber >= 0 && sectionNumber < texts[language].length) {
      setCurrentSection(sectionNumber);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
    I18nManager.forceRTL(newLanguage === 'ar');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        {/* --- العناصر الأصلية تم إعادتها --- */}
        <View style={styles.lightGreenBackground} />
        <ImageBackground source={{ uri: images[currentSection] }} style={styles.image} resizeMode="cover">
          <View style={styles.fullGreenOverlay} />
          {/* ------------------------------------ */}
          <LinearGradient colors={['transparent', 'rgba(56, 142, 60, 0.4)', 'rgba(56, 142, 60, 0.8)', 'rgba(56, 142, 60, 1)']} locations={[0, 0.5, 0.75, 1]} style={styles.greenOverlay} />

          {/* العرض الشرطي للشاشة الأخيرة */}
          {(currentSection === 2) ? (
            <>
              {/* النص فقط تم رفع موضعه (تغيير top) */}
              <View style={styles.upperContent}>
                <Text style={styles.heading}>{texts[language][currentSection].heading}</Text>
                <Text style={styles.paragraph}>{texts[language][currentSection].paragraph}</Text>
              </View>
              {/* الأزرار عادت لموضعها الأصلي */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.signInButton} onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signInText}>{language === 'en' ? "Sign in" : "تسجيل الدخول"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.signUpButton} onPress={() => navigation.navigate('SignUp')}>
                  <Text style={styles.signUpText}>{language === 'en' ? "Sign up" : "تسجيل"}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // النص للشاشتين 1 و 2 (بقي كما هو)
            <View style={styles.content}>
              <Text style={styles.heading}>{texts[language][currentSection]?.heading}</Text>
              <Text style={styles.paragraph}>{texts[language][currentSection]?.paragraph}</Text>
            </View>
          )}

          {/* --- باقي الكود (bottomContainer, pageIndicator, الأسهم) بقي كما هو --- */}
          <View style={styles.bottomContainer}>
            <View style={styles.pageIndicator}>
              <View style={styles.dots}>
                {[0, 1, 2].map((index) => (
                  <View key={index} style={[styles.dot, currentSection === index && styles.activeDot]} />
                ))}
              </View>
            </View>
            {/* Conditional rendering for arrows */}
            {currentSection > 0 && (
              <TouchableOpacity style={[styles.navButton, styles.circle, styles.leftButton]} onPress={() => showSection(currentSection - 1)}>
                <AntDesign name="arrowleft" size={24} color="#ffffff" />
              </TouchableOpacity>
            )}
            {currentSection < 2 && (
               <TouchableOpacity style={[styles.navButton, styles.circle, styles.rightButton]} onPress={() => showSection(currentSection + 1)}>
                <AntDesign name="arrowright" size={24} color="#ffffff" />
              </TouchableOpacity>
            )}
            {/* Fix: Arrow logic correction */}
             {currentSection === 0 && currentSection < 2 && ( // Show right arrow on first screen if not last
              <TouchableOpacity style={[styles.navButton, styles.circle, styles.rightButton]} onPress={() => showSection(currentSection + 1)}>
                <AntDesign name="arrowright" size={24} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
          {/* ---------------------------------------------------------------------- */}

        </ImageBackground>
        {/* زر تغيير اللغة */}
        <TouchableOpacity style={styles.languageToggle} onPress={toggleLanguage}>
          <Text style={styles.languageText}>{language === 'en' ? 'عربي' : 'English'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// StyleSheet لجميع المكونات
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  // --- الستايلات الأصلية أعيدت ---
  lightGreenBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#d0f0c0', // اللون الأخضر الفاتح الأصلي
  },
  fullGreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 128, 0, 0.2)', // الطبقة الخضراء الشفافة الأصلية
  },
  image: {
    // position: 'absolute', // تم إعادته ليتناسب مع الطبقات الأخرى
    flex: 1, // Ensure it still fills space if other layers removed later
    width: '100%',
    height: '100%',
    // resizeMode: 'cover', // Included in ImageBackground props
  },
  // -----------------------------
  greenOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  // ستايل النص للشاشتين 1 و 2
  content: {
    position: 'absolute',
    bottom: 100, // الموضع الأصلي
    left: 15,
    right: 15,
    alignItems: 'center',
  },
  // ستايل النص للشاشة 3 (فقط top تم تعديله)
  upperContent: {
    position: 'absolute',
    top: 450, // <<< --- القيمة الوحيدة التي تم تغييرها لرفع النص (عدّلها حسب رغبتك)
    left: 15,
    right: 15,
    alignItems: 'center',
  },
  heading: {
    fontSize: 24, // الحجم الأصلي
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
    // (تم إزالة الظل للعودة للأصل)
  },
  paragraph: {
    fontSize: 16, // الحجم الأصلي
    color: '#ffffff',
    textAlign: 'center',
    // (تم إزالة الظل و line-height للعودة للأصل)
  },
  // ستايل حاوية الأزرار للشاشة 3 (عاد للموضع الأصلي)
  buttonContainer: {
    position: 'absolute',
    bottom: 70, // <<< --- الموضع الأصلي
    left: 15,
    right: 15,
    alignItems: 'center',
    // paddingHorizontal: 40, // (تمت إزالته للعودة للأصل)
  },
  // --- ستايلات الأزرار عادت للأصل ---
  signInButton: {
    width: '80%', // العرض الأصلي
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderRadius: 30,
    paddingVertical: 12, // المسافة الأصلية
    alignItems: 'center',
    marginBottom: 10, // المسافة الأصلية
    // (تمت إزالة الظل elevation/shadow للعودة للأصل)
  },
  signInText: {
    color: '#ffffff',
    fontSize: 16, // الحجم الأصلي
    // fontWeight: 'bold', // (تمت إزالته للعودة للأصل)
  },
  signUpButton: {
    width: '80%', // العرض الأصلي
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 30,
    paddingVertical: 12, // المسافة الأصلية
    alignItems: 'center',
    marginBottom: 10,
  },
  signUpText: {
    color: '#ffffff',
    fontSize: 16, // الحجم الأصلي
    // fontWeight: 'bold', // (تمت إزالته للعودة للأصل)
  },
  // --- ستايلات bottomContainer وما تحتها عادت للأصل ---
  bottomContainer: {
    position: 'absolute',
    bottom: 45, // الموضع الأصلي
    left: 0,
    right: 0,
    // height: 80, // (تمت إزالته للعودة للأصل)
    flexDirection: 'row', // الأصلي
    justifyContent: 'space-between', // الأصلي
    alignItems: 'center', // الأصلي
    paddingHorizontal: 20, // الأصلي
  },
  pageIndicator: {
    // flex: 1, // تمت إزالته
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute', // الموضع الأصلي
    left: 0,
    right: 0,
    bottom: 4, // الموضع الأصلي
  },
  dots: {
    flexDirection: 'row',
  },
  dot: {
    width: 10, // الحجم الأصلي
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 5, // المسافة الأصلية
  },
  activeDot: {
    backgroundColor: '#ffffff',
    // (تمت إزالة تغيير الحجم للعودة للأصل)
  },
  navButton: {
    padding: 10, // الأصلي
    // position: 'absolute', // (تمت إزالته لأن التموضع يتم من left/rightButton)
    // bottom: 10, // (تمت إزالته)
    // justifyContent: 'center', // (تمت إزالته)
    // alignItems: 'center', // (تمت إزالته)
  },
  circle: {
    backgroundColor: 'rgba(56, 142, 60, 0.7)', // الأصلي
    // width: 44, // (تمت إزالته)
    // height: 44, // (تمت إزالته)
    borderRadius: 30, // الأصلي
    // justifyContent: 'center', // (تمت إزالته)
    // alignItems: 'center', // (تمت إزالته)
     padding: 10, // Ensure padding inside circle
  },
  leftButton: {
    position: 'absolute', // الأصلي
    left: 20,
    bottom: -15, // الموضع الأصلي
  },
  rightButton: {
    position: 'absolute', // الأصلي
    right: 20,
    bottom: -14, // الموضع الأصلي
  },
  // --- زر اللغة عاد للأصل ---
  languageToggle: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20, // Use Platform correctly
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // الأصلي
    padding: 10, // الأصلي
    borderRadius: 5, // الأصلي
  },
  languageText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14, // Adjusted size
  },
});

export default IndexScreen;
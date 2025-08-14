import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Platform,
    StatusBar // Recommended for safe area handling
} from 'react-native';

/**
 * AboutScreen Component
 * Displays information about the application.
 *
 * Props:
 * - navigation: React Navigation navigation object (optional, if needed for other actions).
 * - language (string): The current language code ('ar' or 'en'). Defaults to 'ar'.
 * - darkMode (boolean): Flag to indicate if dark mode is enabled.
 * - goBack (function): REQUIRED. A function passed from the parent component
 *                       that handles the navigation back action (e.g., navigation.goBack()).
 */
// <<< التعديل الأول: تم تغيير اسم الخاصية هنا
const AboutScreen = ({ navigation, language: currentLanguage = 'ar', darkMode = false, goBack }) => {

    // Local state for language, initialized by the prop
    const [languageState, setLanguageState] = useState(currentLanguage);

    // Determine styles based on darkMode prop
    const styles = darkMode ? darkStyles : lightStyles;

    // --- Effects ---

    // Update local language if the prop changes from the parent
    useEffect(() => {
        setLanguageState(currentLanguage);
    }, [currentLanguage]);

    // --- Translations ---
    const translations = {
        'ar': {
            'aboutTitle': 'حول التطبيق',
            'goalTitle': 'هدف التطبيق',
            'goalDescription': 'يهدف تطبيق متتبع الوزن المتقدم إلى مساعدتك في مراقبة وزنك وتحقيق أهداف اللياقة البدنية الخاصة بك من خلال تتبع الوزن اليومي، السعرات الحرارية، النشاط البدني، والمزيد.',
            'featuresTitle': 'الميزات الأساسية',
            'featuresList': [
                'تتبع الوزن اليومي وتقديم تحليلات لمدى التقدم.',
                'حساب مؤشر كتلة الجسم (BMI) ومراقبة الأهداف الصحية.',
                'تقديم نصائح يومية لتحفيز نمط حياة صحي.',
                'إدارة وتتبع استهلاك السعرات الحرارية والماء والنشاط البدني.',
                'واجهة سهلة الاستخدام تدعم الوضع الفاتح والداكن.',
                'دعم اللغتين العربية والإنجليزية.',
            ],
            'usageTitle': 'كيفية الاستخدام',
            'usageDescription': 'ابدأ بإدخال وزنك الحالي وتحديد هدفك. استخدم شريط التمرير (أو أي طريقة إدخال أخرى متاحة) لتحديث وزنك اليومي ومراقبة تقدمك على الرسوم البيانية. تابع النصائح اليومية وسجل بياناتك بانتظام لتحقيق أفضل النتائج.',
            'developerInfoTitle': 'معلومات المطور',
            'developerInfo': 'تم تطوير هذا التطبيق بواسطة استوديو اوبتيفيت. لمزيد من المعلومات أو الدعم، يرجى التواصل عبر optifitstudio0@gmail.com.',
            'versionInfo': 'الإصدار: 1.0.0',
            'backButton': 'رجوع'
        },
        'en': {
            'aboutTitle': 'About the App',
            'goalTitle': 'App Goal',
            'goalDescription': 'The Advanced Weight Tracker app aims to help you monitor your weight and achieve your fitness goals by tracking daily weight, calories, physical activity, and more.',
            'featuresTitle': 'Key Features',
            'featuresList': [
                'Track daily weight and provide progress analytics.',
                'Calculate Body Mass Index (BMI) and monitor health goals.',
                'Provide daily tips to motivate a healthy lifestyle.',
                'Manage and track calorie intake, water consumption, and physical activity.',
                'User-friendly interface with Light and Dark mode support.',
                'Support for both Arabic and English languages.',
            ],
            'usageTitle': 'How to Use',
            'usageDescription': 'Start by entering your current weight and setting your goal. Use the slider (or other available input methods) to update your daily weight and monitor your progress on the charts. Follow daily tips and log your data regularly for the best results.',
            'developerInfoTitle': 'Developer Information',
            'developerInfo': 'This application was developed by optifit studio. For more information or support, please contact us at optifitstudio0@gmail.com.',
            'versionInfo': 'Version: 1.0.0',
            'backButton': 'Back'
        }
    };

    // Use the local language state for display, falling back to English if needed
    const translation = translations[languageState] || translations['en'];

    // --- Render ---
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.innerContainer}>

                {/* --- Custom Header Section --- */}
                <View style={styles.header}>
                    {/* <<< التعديل الثاني: تم تغيير الدالة التي يتم استدعاؤها هنا */}
                    <TouchableOpacity
                        onPress={goBack} // Execute the passed function on press
                        style={styles.headerBackButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.headerBackButtonText}>←</Text>
                    </TouchableOpacity>

                    {/* Title Text */}
                    <Text style={styles.title}>{translation.aboutTitle}</Text>

                    {/* Placeholder View to help center the title with flexbox */}
                    <View style={styles.headerPlaceholder} />
                </View>

                {/* --- Content Sections --- */}

                <View style={styles.section}>
                    <Text style={styles.subtitle}>{translation.goalTitle}</Text>
                    <Text style={styles.paragraph}>{translation.goalDescription}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.subtitle}>{translation.featuresTitle}</Text>
                    <View style={styles.list}>
                        {translation.featuresList.map((feature, index) => (
                            <Text key={index} style={styles.listItem}>• {feature}</Text>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.subtitle}>{translation.usageTitle}</Text>
                    <Text style={styles.paragraph}>{translation.usageDescription}</Text>
                </View>

                 <View style={styles.section}>
                    <Text style={styles.subtitle}>{translation.developerInfoTitle}</Text>
                    <Text style={styles.paragraph}>{translation.developerInfo}</Text>
                    <Text style={[styles.paragraph, styles.versionText]}>{translation.versionInfo}</Text>
                </View>

                {/* --- Optional Bottom Back Button (Commented Out) --- */}
                {/*
                <TouchableOpacity
                    onPress={goBack} // <<< التعديل الثالث: تم التعديل هنا أيضاً للاتساق
                    style={styles.bottomBackButton}
                >
                    <Text style={styles.bottomBackButtonText}>{translation.backButton}</Text>
                </TouchableOpacity>
                */}

            </View>
        </ScrollView>
    );
};

// --- Styles ---

const lightStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8f5e9',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
    },
    scrollContentContainer: {
        paddingBottom: 40,
        paddingHorizontal: 15,
    },
    innerContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 15,
        paddingVertical: 25,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    headerBackButton: {
        padding: 5,
    },
    headerBackButtonText: {
        fontSize: 28,
        color: '#388e3c',
        fontWeight: 'bold',
    },
    title: {
        color: '#388e3c',
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerPlaceholder: {
        width: 30,
        height: 30,
    },
    section: {
        marginBottom: 25,
    },
    subtitle: {
        color: '#388e3c',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        textAlign: 'left',
    },
    paragraph: {
        color: '#004d40',
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'left',
    },
    list: {
        marginLeft: 10,
    },
    listItem: {
        color: '#004d40',
        fontSize: 16,
        marginBottom: 10,
        lineHeight: 22,
        textAlign: 'left',
    },
    versionText: {
        marginTop: 10,
        fontStyle: 'italic',
        fontSize: 14,
        color: '#555',
    },
    bottomBackButton: {
        backgroundColor: '#388e3c',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 30,
        alignItems: 'center',
        marginTop: 20,
        alignSelf: 'center',
    },
    bottomBackButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

const darkStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
    },
    scrollContentContainer: {
        paddingBottom: 40,
        paddingHorizontal: 15,
    },
    innerContainer: {
        backgroundColor: '#1e1e1e',
        borderRadius: 15,
        paddingVertical: 25,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    headerBackButton: {
        padding: 5,
    },
    headerBackButtonText: {
        fontSize: 28,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    title: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerPlaceholder: {
        width: 30,
        height: 30,
    },
    section: {
        marginBottom: 25,
    },
    subtitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        textAlign: 'left',
    },
    paragraph: {
        color: '#e0e0e0',
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'left',
    },
    list: {
        marginLeft: 10,
    },
    listItem: {
        color: '#e0e0e0',
        fontSize: 16,
        marginBottom: 10,
        lineHeight: 22,
        textAlign: 'left',
    },
     versionText: {
        marginTop: 10,
        fontStyle: 'italic',
        fontSize: 14,
        color: '#aaa',
    },
    bottomBackButton: {
        backgroundColor: '#bb86fc',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 30,
        alignItems: 'center',
        marginTop: 20,
        alignSelf: 'center',
    },
    bottomBackButtonText: {
        color: '#121212',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AboutScreen;
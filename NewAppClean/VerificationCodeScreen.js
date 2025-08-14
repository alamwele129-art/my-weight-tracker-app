import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Keyboard,
    Platform,
    Alert, // Use Alert for critical confirmations like resend success
} from 'react-native';
import emailjs from '@emailjs/browser'; // تأكد من تثبيت هذه الحزمة: npm install @emailjs/browser

// --- الثوابت ---
const CODE_LENGTH = 4; // طول رمز التحقق
const RESEND_COOLDOWN_SECONDS = 60; // مدة الانتظار لإعادة الإرسال بالثواني

// --- !! هام جداً للأمان !! ---
// استبدل هذه القيم بمعرفاتك الحقيقية من حساب EmailJS
// الأفضل هو استخدام متغيرات البيئة لحفظ هذه القيم (process.env.REACT_NATIVE_EMAILJS_SERVICE_ID)
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_USER_ID = 'YOUR_USER_ID';
// --- !! نهاية قسم الأمان !! ---

// --- الألوان (يفضل وضعها في ملف منفصل واستيرادها) ---
const COLORS = {
    primary: '#3CB043', // اللون الرئيسي (أخضر)
    white: '#fff',       // أبيض
    gray: '#999',       // رمادي للنصوص الفرعية
    lightGray: '#ccc',   // رمادي فاتح للحدود
    black: '#000',       // أسود للنصوص الرئيسية
    red: '#FF0000',       // أحمر لرسائل الخطأ
};
// --- نهاية الألوان ---

const VerificationCodeScreen = ({ route, navigation }) => {
    // الحصول على البريد الإلكتروني من الشاشة السابقة
    const { email } = route.params || {};

    // --- حالات المكون ---
    const [code, setCode] = useState(Array(CODE_LENGTH).fill('')); // حالة رمز الإدخال
    const [isLoadingVerify, setIsLoadingVerify] = useState(false); // حالة تحميل التحقق
    const [isLoadingResend, setIsLoadingResend] = useState(false); // حالة تحميل إعادة الإرسال
    const [error, setError] = useState(null); // حالة رسالة الخطأ
    const [resendCooldown, setResendCooldown] = useState(0); // حالة مؤقت إعادة الإرسال

    // !! تنبيه أمني خطير !!
    // لا تخزن رموز التحقق الصحيحة في الواجهة الأمامية في تطبيق حقيقي.
    // يجب أن تتم عملية التحقق على الخادم (Backend). هذا فقط للمحاكاة.
    const [verificationCodes, setVerificationCodes] = useState({});
    // !! نهاية التنبيه الأمني !!

    // مراجع حقول الإدخال للتحكم بالتركيز
    const inputRefs = useRef([]);
    inputRefs.current = Array(CODE_LENGTH).fill().map((_, i) => inputRefs.current[i] ?? React.createRef());

    // --- مؤقت لعدم السماح بإعادة الإرسال المتكرر ---
    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        } else if (timer) {
            clearInterval(timer);
        }
        // تنظيف المؤقت عند إزالة المكون
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // --- التركيز التلقائي على أول حقل عند تحميل الشاشة ---
    useEffect(() => {
        // استخدام setTimeout لضمان أن الواجهة قد تم بناؤها
        const focusTimer = setTimeout(() => {
            inputRefs.current[0]?.current?.focus();
        }, 100);
        return () => clearTimeout(focusTimer);
    }, []);

    // --- دالة محاكاة لتوليد وتخزين الكود (غير آمنة للإنتاج) ---
    const generateAndStoreCode = (userEmail) => {
        const newVerificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        // !! تنبيه أمني !!
        setVerificationCodes((prevCodes) => ({
            ...prevCodes,
            [userEmail]: newVerificationCode, // تخزين الكود محليًا (خطير!)
        }));
        console.log(`(Insecure Simulation) Generated code for ${userEmail}: ${newVerificationCode}`); // للسجل فقط
        return newVerificationCode;
    };

    // --- معالجة تغيير النص في حقول الإدخال والتركيز التلقائي ---
    const handleCodeChange = (text, index) => {
        const numericText = text.replace(/[^0-9]/g, ''); // السماح بالأرقام فقط
        const newCode = [...code];

        if (numericText.length > 1 && index === 0) { // معالجة اللصق (إذا بدأ من أول حقل)
            const pastedDigits = numericText.split('').slice(0, CODE_LENGTH);
            pastedDigits.forEach((digit, i) => {
                if (index + i < CODE_LENGTH) {
                    newCode[index + i] = digit;
                }
            });
            setCode(newCode);
            // نقل التركيز إلى آخر حقل تم ملؤه أو آخر حقل متاح
            const nextFocusIndex = Math.min(index + pastedDigits.length, CODE_LENGTH - 1);
             // التأكد من أن الحقل التالي فارغ قبل نقل التركيز (أو آخر حقل إذا كان ممتلئًا)
             if(pastedDigits.length < CODE_LENGTH) {
                 inputRefs.current[nextFocusIndex]?.current?.focus();
             } else {
                // إذا تم لصق الكود كاملاً، يمكن إزالة التركيز أو إبقائه على الأخير
                inputRefs.current[CODE_LENGTH - 1]?.current?.focus();
                 // Keyboard.dismiss(); // اختياري: إخفاء لوحة المفاتيح
             }

        } else if (numericText.length <= 1) { // معالجة الإدخال الرقمي الفردي
            newCode[index] = numericText;
            setCode(newCode);

            // نقل التركيز للأمام عند إدخال رقم
            if (numericText.length === 1 && index < CODE_LENGTH - 1) {
                inputRefs.current[index + 1]?.current?.focus();
            }
        }

        // مسح رسالة الخطأ عند بدء المستخدم في التعديل
        if (error) setError(null);
    };

    // --- معالجة ضغط مفتاح الحذف (Backspace) ---
    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace') {
            // إذا كان الحقل الحالي فارغاً ونحن لسنا في الحقل الأول
            if (code[index] === '' && index > 0) {
                // نقل التركيز إلى الحقل السابق
                inputRefs.current[index - 1]?.current?.focus();
            }
            // إذا كان الحقل الحالي غير فارغ، سيقوم onChangeText بمعالجته عند الحذف
        }
    };

    // --- دالة التحقق من الرمز ---
    const handleVerifyNow = () => {
        Keyboard.dismiss(); // إخفاء لوحة المفاتيح
        setError(null); // مسح أي خطأ سابق
        const enteredCode = code.join(''); // تجميع الأرقام المدخلة

        // التحقق من أن الكود كامل
        if (enteredCode.length !== CODE_LENGTH) {
            setError(`Please enter a ${CODE_LENGTH}-digit code.`);
            return;
        }

        setIsLoadingVerify(true); // بدء حالة التحميل للتحقق

        // --- !! محاكاة التحقق (يجب أن يتم على الخادم في التطبيق الحقيقي) !! ---
        setTimeout(() => { // محاكاة تأخير الشبكة
            console.log('Verifying code:', enteredCode, 'for email:', email);
            console.log('Stored codes (Insecure):', verificationCodes);

            // مقارنة الكود المدخل بالكود المخزن (المحاكاة وغير الآمنة)
            if (verificationCodes[email] === enteredCode) {
                console.log('Verification successful!');
                // مسح الحقول والانتقال للشاشة التالية عند النجاح
                setCode(Array(CODE_LENGTH).fill(''));
                setVerificationCodes({}); // مسح الكود المخزن (للمحاكاة)
                navigation.navigate('ResetPassword', { email }); // افتراض وجود شاشة بهذا الاسم
            } else {
                console.log('Verification failed!');
                setError('Incorrect verification code. Please try again.');
                // يمكنك اختيار مسح الحقول هنا أيضاً إذا فشل التحقق
                // setCode(Array(CODE_LENGTH).fill(''));
                // inputRefs.current[0]?.current?.focus(); // إعادة التركيز على الحقل الأول
            }
            setIsLoadingVerify(false); // إنهاء حالة التحميل للتحقق
        }, 1000); // تأخير لمدة ثانية واحدة للمحاكاة
        // --- !! نهاية المحاكاة !! ---

        /*
        // --- مثال لكيفية عمل التحقق الحقيقي على الخادم ---
        fetch('YOUR_BACKEND_API_URL/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code: enteredCode })
        })
        .then(response => {
            if (!response.ok) {
                // التعامل مع أخطاء الخادم (مثل 400, 401, 500)
                throw new Error('Verification failed on server');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) { // افتراض أن الخادم يعيد { success: true }
                navigation.navigate('ResetPassword', { email });
            } else {
                setError(data.message || 'Incorrect verification code.'); // استخدام رسالة الخادم إن وجدت
            }
        })
        .catch(err => {
            console.error("Verification API error:", err);
            setError('An error occurred during verification. Please try again.');
        })
        .finally(() => setIsLoadingVerify(false));
        */
    };

    // --- دالة إعادة إرسال الرمز ---
    const handleResendCode = async () => {
        // التأكد من وجود البريد الإلكتروني ومن أننا لسنا في حالة تحميل أو فترة انتظار
        if (!email) {
            setError('Email address is missing. Cannot resend code.');
            return;
        }
        if (isLoadingResend || resendCooldown > 0) return;

        Keyboard.dismiss(); // إخفاء لوحة المفاتيح
        setError(null); // مسح الأخطاء السابقة
        setIsLoadingResend(true); // بدء حالة التحميل لإعادة الإرسال

        // توليد رمز جديد وتخزينه (محاكاة غير آمنة)
        const newVerificationCode = generateAndStoreCode(email);

        try {
            // إرسال البريد الإلكتروني باستخدام EmailJS
            await emailjs.send(
                EMAILJS_SERVICE_ID, // استخدم متغيرات البيئة هنا
                EMAILJS_TEMPLATE_ID, // استخدم متغيرات البيئة هنا
                {
                    to_email: email, // المتغير الذي يتوقعه قالب EmailJS للبريد الإلكتروني
                    verification_code: newVerificationCode, // المتغير الذي يتوقعه قالب EmailJS لرمز التحقق
                    // أضف أي متغيرات أخرى يحتاجها القالب الخاص بك (مثل اسم المستخدم)
                    // from_name: 'Your App Name', // مثال
                },
                EMAILJS_USER_ID // استخدم متغيرات البيئة هنا
            );

            console.log('Verification code resent successfully to:', email);
            // إظهار رسالة تأكيد للمستخدم
            Alert.alert('Code Resent', `A new verification code has been sent to ${email}`);
            setResendCooldown(RESEND_COOLDOWN_SECONDS); // بدء مؤقت فترة الانتظار
        } catch (error) {
            console.error('Error resending email via EmailJS:', error);
            setError('Failed to resend verification code. Please check your connection or try again later.');
        } finally {
            setIsLoadingResend(false); // إنهاء حالة التحميل لإعادة الإرسال
        }
    };

    // --- بناء واجهة المستخدم ---
    return (
        <View style={styles.container}>
            {/* العنوان والنص التوضيحي */}
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>
                We have sent a {CODE_LENGTH}-digit code to{'\n'}{email || 'your email address'}
            </Text>

            {/* حاوية حقول إدخال الرمز */}
            <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={inputRefs.current[index]}
                        style={styles.codeInput} // تطبيق نمط الدائرة
                        value={digit}
                        onChangeText={(text) => handleCodeChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)} // معالجة الحذف
                        keyboardType="number-pad" // لوحة مفاتيح رقمية
                        maxLength={1} // السماح برقم واحد فقط لكل حقل
                        textContentType="oneTimeCode" // للمساعدة في الملء التلقائي على iOS
                        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'} // للمساعدة في الملء التلقائي (قد يتطلب إعدادات إضافية)
                        editable={!isLoadingVerify && !isLoadingResend} // تعطيل الإدخال أثناء التحميل
                        selectTextOnFocus // تحديد النص عند التركيز لتسهيل الاستبدال
                        accessibilityLabel={`Verification code digit ${index + 1}`} // لسهولة الوصول
                    />
                ))}
            </View>

            {/* عرض رسالة الخطأ إن وجدت */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* زر التحقق */}
            <TouchableOpacity
                style={[styles.verifyButton, (isLoadingVerify || isLoadingResend) && styles.buttonDisabled]}
                onPress={handleVerifyNow}
                disabled={isLoadingVerify || isLoadingResend} // تعطيل الزر أثناء أي تحميل
                accessibilityLabel="Verify the entered code"
                accessibilityHint="Checks if the entered code is correct"
            >
                {isLoadingVerify ? (
                    <ActivityIndicator size="small" color={COLORS.white} /> // عرض مؤشر تحميل
                ) : (
                    <Text style={styles.verifyButtonText}>Verify Now</Text> // عرض نص الزر
                )}
            </TouchableOpacity>

            {/* قسم إعادة الإرسال */}
            <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code?</Text>
                <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={isLoadingResend || resendCooldown > 0} // تعطيل أثناء التحميل أو فترة الانتظار
                    accessibilityLabel={resendCooldown > 0 ? `Resend code available in ${resendCooldown} seconds` : "Resend verification code"}
                    accessibilityHint="Sends a new verification code to your email"
                >
                    {/* عرض نص مختلف حسب حالة فترة الانتظار والتحميل */}
                    <Text style={[
                        styles.resendLink,
                        (isLoadingResend || resendCooldown > 0) && styles.linkDisabled // تغيير النمط عند التعطيل
                    ]}>
                        {isLoadingResend ? ( // إذا كان التحميل لإعادة الإرسال جارياً
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : resendCooldown > 0 ? ( // إذا كانت فترة الانتظار نشطة
                            ` Resend in ${resendCooldown}s`
                        ) : ( // الحالة الافتراضية (جاهز لإعادة الإرسال)
                            ' Resend Code'
                        )}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- الأنماط ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 20,
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40, // مسافة علوية لتجنب شريط الحالة/النوتش
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.gray,
        marginBottom: 40, // زيادة المسافة قبل حقول الإدخال
        textAlign: 'center',
        lineHeight: 24, // تحسين قابلية القراءة لعدة أسطر
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between', // توزيع الدوائر بمسافات متساوية
        width: '85%', // عرض حاوية الدوائر (يمكن تعديله)
        marginBottom: 20, // مسافة قبل رسالة الخطأ
    },
    codeInput: {
        width: 50,         // العرض
        height: 50,        // الارتفاع (يجب أن يساوي العرض للدائرة)
        borderWidth: 1.5,    // سماكة الحدود
        borderColor: COLORS.lightGray, // لون الحدود الافتراضي
        borderRadius: 25,    // نصف العرض/الارتفاع لجعلها دائرة
        fontSize: 24,        // حجم الخط داخل الدائرة
        textAlign: 'center', // توسيط النص داخل الدائرة
        color: COLORS.black, // لون النص المدخل
        // يمكنك إضافة focus style هنا إذا أردت تغيير الحدود عند التركيز
        // مثال:
        // onFocus: {
        //     borderColor: COLORS.primary,
        //     elevation: 2 // ظل بسيط للأندرويد عند التركيز
        // }
        // لكن يتطلب منطق إضافي لتطبيق النمط ديناميكياً
    },
    errorText: {
        color: COLORS.red, // لون نص الخطأ
        marginBottom: 20, // مسافة قبل زر التحقق
        fontSize: 14,
        textAlign: 'center',
        minHeight: 20, // حجز مساحة حتى لو لم يكن هناك خطأ
    },
    verifyButton: {
        backgroundColor: COLORS.primary, // لون خلفية الزر
        paddingVertical: 15,
        borderRadius: 8, // جعل الحواف دائرية قليلاً
        width: '90%', // عرض الزر
        alignItems: 'center', // توسيط المحتوى (النص أو مؤشر التحميل)
        minHeight: 50, // ارتفاع أدنى للزر
        justifyContent: 'center', // توسيط المحتوى عمودياً
    },
    verifyButtonText: {
        color: COLORS.white, // لون نص الزر
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.6, // جعل الزر باهتاً عند تعطيله
    },
    resendContainer: {
        flexDirection: 'row', // وضع النص والرابط بجانب بعضهما
        marginTop: 30, // مسافة أكبر من زر التحقق
        alignItems: 'center', // محاذاة عمودية للنص والرابط
        flexWrap: 'wrap', // السماح بالالتفاف إذا كانت الشاشة ضيقة
        justifyContent: 'center', // توسيط المحتوى إذا التف
    },
    resendText: {
        fontSize: 15,
        color: COLORS.gray, // لون النص العادي
    },
    resendLink: {
        fontSize: 15,
        color: COLORS.primary, // لون الرابط القابل للنقر
        fontWeight: 'bold',
        marginLeft: 5, // مسافة صغيرة بين النص والرابط
        minHeight: 20, // لضمان ارتفاع كافٍ لمؤشر التحميل
        textAlignVertical: 'center', // محاذاة عمودية أفضل للنص/المؤشر
    },
    linkDisabled: {
        color: COLORS.gray, // تغيير لون الرابط عند تعطيله
        opacity: 0.7, // جعله باهتاً قليلاً
    },
});

export default VerificationCodeScreen;
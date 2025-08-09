// supabaseClient.js
import 'react-native-url-polyfill/auto'; //  <-- مهم جدًا لـ React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// استبدل هذه القيم بالقيم الخاصة بمشروعك في Supabase
const supabaseUrl = 'https://zkgvtmcclezdgkrzdvip.supabase.co'; // اذهب إلى Project Settings > API في Supabase
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZ3Z0bWNjbGV6ZGdrcnpkdmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1MTIxMDQsImV4cCI6MjA2MDA4ODEwNH0.T-cOBk-qqPdvZLbfI0gkRpyxt5XXpFh1hIqIVtf5o7Y'; // اذهب إلى Project Settings > API في Supabase

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // استخدم AsyncStorage لتخزين الجلسات في React Native
    autoRefreshToken: true, // تحديث التوكن تلقائيًا
    persistSession: true, // الحفاظ على الجلسة بين مرات تشغيل التطبيق
    detectSessionInUrl: false, // مهم لـ React Native، لا تبحث عن جلسة في الـ URL
  },
});
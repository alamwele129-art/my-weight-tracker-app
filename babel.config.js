module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // تأكد من أن هذا السطر هو الأخير دائماً
      'react-native-reanimated/plugin',
    ],
  };
};
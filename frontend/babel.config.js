module.exports = function(api) {
  api.cache.never();  // Disable Babel caching completely
  return {
    presets: [
      ['babel-preset-expo', {
        worklets: false,
        reanimated: false,
      }],
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};

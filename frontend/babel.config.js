const path = require('path');

module.exports = function(api) {
  api.cache(true);
  
  // Explicitly resolve the worklets plugin path
  const workletsPlugin = require.resolve('react-native-worklets/plugin');
  const reanimatedPlugin = require.resolve('react-native-reanimated/plugin');
  
  return {
    presets: [
      ['babel-preset-expo', {
        worklets: false,      // Disable auto-inclusion of worklets
        reanimated: false,    // Disable auto-inclusion of reanimated
      }],
    ],
    plugins: [
      workletsPlugin,
      reanimatedPlugin,
    ],
  };
};

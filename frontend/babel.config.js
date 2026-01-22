const path = require('path');

module.exports = function(api) {
  api.cache(true);
  
  // Pre-resolve the worklets plugin path
  const workletsPluginPath = path.resolve(__dirname, 'node_modules/react-native-worklets/plugin');
  
  return {
    presets: [
      ['babel-preset-expo', {
        // Disable the automatic worklets plugin loading
        unstable_transformProfile: 'default',
      }],
    ],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};

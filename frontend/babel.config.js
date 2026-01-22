const path = require('path');

module.exports = function(api) {
  api.cache(true);
  
  return {
    presets: [
      ['babel-preset-expo', {
        worklets: false,
        reanimated: false,
      }],
    ],
    plugins: [
      ['/app/frontend/node_modules/react-native-worklets/plugin/index.js'],
      ['/app/frontend/node_modules/react-native-reanimated/plugin/index.js'],
    ],
  };
};

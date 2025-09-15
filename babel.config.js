module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Keep minimal configuration for Expo Go compatibility
    ],
  };
};
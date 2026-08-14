module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Drizzle's Expo migrator imports the generated .sql files directly.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};

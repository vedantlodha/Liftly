const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Let Metro resolve the .sql migration files inline-import pulls in.
config.resolver.sourceExts.push('sql');

module.exports = config;

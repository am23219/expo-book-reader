// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Explicitly defining asset extensions for better cross-platform consistency
config.resolver.assetExts = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'svg', ...config.resolver.assetExts];

// Add support for TypeScript files
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

// Add support for custom module resolution
config.resolver.extraNodeModules = {
  assets: `${__dirname}/assets`,
};

module.exports = config; 
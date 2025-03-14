// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add additional file extensions to assetExts for PDF files
config.resolver.assetExts.push('pdf');

// Add support for TypeScript files
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

// Add support for custom module resolution
config.resolver.extraNodeModules = {
  assets: `${__dirname}/assets`,
};

module.exports = config; 
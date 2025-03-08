// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add configuration for PDF files
config.resolver.assetExts.push('pdf');

// Add any custom configurations here
module.exports = config; 
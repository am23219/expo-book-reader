module.exports = {
  name: "Barakat Makiyyah",
  slug: "arabic-book-reader",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: false,
  plugins: [
    "expo-asset",
    "@config-plugins/react-native-pdf"
  ],
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.barakatmakiyyah.arabicbookreader"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.barakatmakiyyah.arabicbookreader"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    eas: {
      projectId: "arabic-book-reader"
    }
  },
  build: {
    development: {
      developmentClient: true,
      distribution: "internal"
    },
    preview: {
      distribution: "internal"
    },
    production: {}
  }
}; 
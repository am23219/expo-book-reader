module.exports = {
  name: "Barakaat Makiyyah",
  slug: "barakaat-makiyyah",
  version: "1.0.9",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  platforms: ["android", "ios"],
  android: {
    package: "com.honeysystems.barakaatmakiyyah",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    jsEngine: "hermes"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.honeysystems.barakaatmakiyyah"
  },
  web: {
    favicon: "./assets/favicon.png"
  }
}; 
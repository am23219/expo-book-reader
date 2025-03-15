module.exports = {
  name: "Barakaat Makkiyyah",
  slug: "arabic-book-reader",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: false,
  plugins: [
    "expo-asset",
    ["@config-plugins/react-native-pdf", {
      ios: {
        trustAllCerts: true
      },
      android: {
        trustAllCerts: true
      }
    }],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#ffffff",
        sounds: ["./assets/notification-sound.wav"],
        mode: "production",
        androidMode: "default",
        androidCollapsedTitle: "Barakaat Makkiyyah",
        iosDisplayInForeground: true,
        androidImportance: "high",
        androidShowBadge: true,
        androidChannelId: "default",
        androidChannelName: "Default Channel",
        androidEnableFirebase: false
      }
    ],
    [
      "expo-build-properties",
      {
        ios: {
          entitlements: {
            "com.apple.security.application-groups": ["group.com.barakatmakiyyah.arabicbookreader"]
          }
        }
      }
    ]
  ],
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "assets/pdf/Barakaat_Makiyyah.pdf",
    "assets/images/*",
    "assets/fonts/*",
    "assets/audio/*",
    "assets/*.png"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.barakatmakiyyah.arabicbookreader",
    infoPlist: {
      UIBackgroundModes: ["remote-notification"]
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.barakatmakiyyah.arabicbookreader",
    permissions: ["NOTIFICATIONS", "RECEIVE_BOOT_COMPLETED", "VIBRATE"],
    jsEngine: "hermes"
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
module.exports = {
  name: "Barakaat Makkiyyah",
  slug: "arabic-book-reader",
  version: "1.0.9",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: false,
  plugins: [
    "expo-asset",
    "@config-plugins/react-native-pdf",
    [
      "expo-splash-screen",
      {
        imageResizeMode: "contain",
        backgroundColor: "#ffffff",
        image: "./assets/splash.png",
        androidSplashResourceFolder: "drawable",
        hideExponentIconDuringLoading: true,
        splashScreenDelay: 0
      }
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#ffffff",
        sounds: ["./assets/notification_sound.wav"],
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
            "com.apple.security.application-groups": ["group.com.honeysystems.barakaatmakiyyah"]
          }
        },
        android: {
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          buildToolsVersion: "34.0.0",
          minSdkVersion: 24,
          extraProguardRules: "-keep class com.swmansion.reanimated.** { *; }\n-keep class com.facebook.react.turbomodule.** { *; }"
        }
      }
    ]
  ],
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
    android: {
      imageWidth: 300
    },
    ios: {
      supportsTablet: true
    }
  },
  assetBundlePatterns: [
    "assets/images/*",
    "assets/fonts/*",
    "assets/audio/*",
    "assets/*.png"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.honeysystems.barakaatmakiyyah",
    buildNumber: "15",
    infoPlist: {
      UIBackgroundModes: ["remote-notification"],
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.honeysystems.barakaatmakiyyah",
    versionCode: 14,
    permissions: ["NOTIFICATIONS", "RECEIVE_BOOT_COMPLETED", "VIBRATE"],
    jsEngine: "hermes",
    softwareKeyboardLayoutMode: "resize",
    googleServicesFile: "./google-services.json"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    eas: {
      projectId: "dd28f021-7e74-410e-b5d0-615e73b491ee"
    }
  }
}; 
import { ExpoConfig, ConfigContext } from "expo/config";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

const APP_NAME = process.env.PACKAGE_NAME;
const PACKAGE_NAME = process.env.PACKAGE_NAME;

const ADMOB_ANDROID_APP_ID = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID;
const ADMOB_IOS_APP_ID = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;

const IOS_URL_SCHEME = GOOGLE_IOS_CLIENT_ID
  ? `com.googleusercontent.apps.${GOOGLE_IOS_CLIENT_ID.split(".")[0]}`
  : "com.googleusercontent.apps.REPLACE_WITH_IOS_CLIENT_ID";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: "cycle-diary",
  version: "1.0.0",
  scheme: "cycle-diary",
  userInterfaceStyle: "automatic",
  orientation: "default",
  platforms: ["ios", "android"],
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-font",
    "expo-status-bar",
    "expo-file-system",
    "expo-sharing",
    [
      "expo-splash-screen",
      {
        image: "./src/assets/icons/adaptive-foreground.png",
        imageWidth: 250,
        resizeMode: "contain",
        backgroundColor: "#ec4899",
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./src/assets/icons/adaptive-foreground.png",
        color: "#ec4899",
      },
    ],
    "@react-native-firebase/app",
    "@react-native-firebase/auth",
    [
      "@react-native-google-signin/google-signin",
      { iosUrlScheme: IOS_URL_SCHEME },
    ],
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: ADMOB_ANDROID_APP_ID,
        iosAppId: ADMOB_IOS_APP_ID,
        delayAppMeasurementInit: true,
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 24,
          compileSdkVersion: 36,
        },
        ios: {
          deploymentTarget: "16.4",
        },
      },
    ],
    [
        "./plugins/withAndroidSigning",
        {
          storeFile: "../../android.keystore",
          storePassword: process.env.KEYSTORE_PASSWORD,
          keyAlias: process.env.KEYSTORE_ALIAS,
          keyPassword: process.env.KEYSTORE_PASSWORD,
        },
      ],
  ],
  android: {
    softwareKeyboardLayoutMode: "pan",
    package: PACKAGE_NAME,
    version: process.env.VERSION_NAME,
    versionCode: parseInt(process.env.VERSION_CODE),
    adaptiveIcon: {
      foregroundImage: "./src/assets/icons/adaptive-foreground.png",
      backgroundColor: "#ec4899",
    },
    googleServicesFile: `./google-services.json`,
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.POST_NOTIFICATIONS",
    ],
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: PACKAGE_NAME,
  },
  extra: {
    eas: {
      projectId: "",
    },
    google: {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    },
  },
});

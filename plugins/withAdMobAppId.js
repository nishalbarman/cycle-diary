const { withAndroidManifest } = require("expo/config-plugins");

function withAdMobAppId(config) {
  return withAndroidManifest(config, (modConfig) => {
    const appId = process.env.GOOGLE_MOBILE_ADS_APP_ID;
    const manifest = modConfig.modResults;
    const application = manifest.manifest.application?.[0];
    if (!application) return modConfig;

    const existing = application["meta-data"]?.find(
      (m) =>
        m["$"]["android:name"] === "com.google.android.gms.ads.APPLICATION_ID",
    );

    if (!existing) {
      application["meta-data"] = application["meta-data"] || [];
      application["meta-data"].push({
        $: {
          "android:name": "com.google.android.gms.ads.APPLICATION_ID",
          "android:value": appId,
        },
      });
    }

    return modConfig;
  });
}

module.exports = withAdMobAppId;

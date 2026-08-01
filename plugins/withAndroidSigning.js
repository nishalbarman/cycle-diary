const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withAndroidSigning(config, props) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      let contents = config.modResults.contents;

      // 1. Create the signingConfigs.release block
      const releaseSigningConfig = `
    signingConfigs {
        release {
            storeFile file("${props.storeFile}")
            storePassword "${props.storePassword}"
            keyAlias "${props.keyAlias}"
            keyPassword "${props.keyPassword}"
        }
    }`;

      // 2. Inject the signingConfigs block if it doesn't exist,
      // or replace the existing one to include 'release'
      if (contents.includes("signingConfigs {")) {
        // If debug already exists, we insert release inside it
        contents = contents.replace(
          /signingConfigs\s?\{/,
          `signingConfigs {\n        release { \n            storeFile file("${props.storeFile}")\n            storePassword "${props.storePassword}"\n            keyAlias "${props.keyAlias}"\n            keyPassword "${props.keyPassword}"\n        }`,
        );
      } else {
        contents = contents.replace(
          /android\s?\{/,
          `android {\n${releaseSigningConfig}`,
        );
      }

      config.modResults.contents = contents;
    }
    return config;
  });
};

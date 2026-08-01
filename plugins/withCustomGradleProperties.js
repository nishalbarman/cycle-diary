// plugins/withCustomGradleProperties.js
const { withGradleProperties } = require("@expo/config-plugins");

module.exports = function withCustomGradleProperties(config) {
  return withGradleProperties(config, (config) => {
    const properties = config.modResults;

    const setProperty = (key, value) => {
      // Find if the property already exists to avoid duplicates
      const index = properties.findIndex((p) => p.key === key);
      if (index > -1) {
        properties[index].value = value;
      } else {
        properties.push({ type: "property", key, value });
      }
    };

    // Performance & Memory Optimizations
    setProperty("org.gradle.jvmargs", "-Xmx4g -XX:MaxMetaspaceSize=1g -Dkotlin.daemon.jvm.options=-Xmx1g");
    setProperty("org.gradle.daemon", "true");
    setProperty("org.gradle.configureondemand", "true");
    setProperty("org.gradle.caching", "true");
    setProperty("org.gradle.parallel", "true");

    return config;
  });
};
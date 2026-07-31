module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind", decorators: false }],
      "nativewind/babel",
    ],
    plugins: [
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      "react-native-reanimated/plugin",
    ],
    overrides: [
      {
        test: (filename) =>
          typeof filename === "string" &&
          /[\\/]src[\\/]shared[\\/]db[\\/]wm[\\/]/.test(filename),
        plugins: [["@babel/plugin-transform-class-properties", { loose: true }]],
      },
    ],
  };
};

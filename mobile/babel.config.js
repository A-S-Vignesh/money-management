module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // NOTE: Expo SDK 55 uses react-native-worklets (newer Reanimated 4 stack);
    // no manual plugin entry is required — Reanimated's transform is wired up
    // by babel-preset-expo. Keep this block empty unless you need to add one.
    plugins: [],
  };
};

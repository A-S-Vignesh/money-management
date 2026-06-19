// metro.config.js
// Stock Expo + NativeWind config. The earlier version added monorepo
// workarounds (watch the workspace root, unstable_enableSymlinks for
// pnpm-symlinked deps, etc.) — none of that is needed now that mobile/
// is a standalone Expo project with vendored shared code at
// src/_shared/. Expo-doctor flags the overrides as risky, so the
// minimal stock config is the safe production choice.

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./src/global.css" });

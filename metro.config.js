const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');
config.resolver.extraNodeModules = {
  "@drizzle": path.resolve(__dirname, "drizzle"),
};

module.exports = withNativeWind(config, { input: "./src/global.css" });

/**
 * The config plugin: `["@its/glowup-device", { location: { … } }]` in the app
 * config. It configures only the capabilities listed, each through its Expo
 * module's own plugin, which is required only then — an app that never uses
 * the camera needs no expo-camera to prebuild.
 *
 * Runs in Node at prebuild, not in the app: plain CommonJS, no build step.
 */
const { createRunOncePlugin } = require("expo/config-plugins");

const pkg = require("./package.json");

const TAG = `[${pkg.name}]`;

// Generic on purpose: App Store review rejects purpose strings that do not say
// why the app needs the data, so a missing text is a warning, not a default.
const DEFAULT_LOCATION_TEXT = "Allow $(PRODUCT_NAME) to use your location.";

function placeholder(option, text) {
  console.warn(
    `${TAG} ${option} is not set: using "${text}". App Store review rejects generic ` +
      "purpose strings, so say why the app needs it before you submit.",
  );
  return text;
}

function loadPlugin(moduleName, capability) {
  let plugin;
  try {
    plugin = require(`${moduleName}/app.plugin`);
  } catch (error) {
    throw new Error(
      `${TAG} "${capability}" needs ${moduleName}: run \`npx expo install ${moduleName}\`. (${error.message})`,
    );
  }
  return plugin.default ?? plugin;
}

/**
 * Foreground location only. iOS keeps the "Always" purpose strings (with the
 * same text), as expo-location's own plugin does: its binary references the
 * Always APIs, and App Store Connect can flag a binary that does so without
 * the purpose string (ITMS-90683). They grant nothing; this package never
 * requests Always. Android gets no background or foreground-service
 * permission.
 */
function withLocation(config, options) {
  const text =
    options.whenInUsePermission ??
    placeholder("location.whenInUsePermission", DEFAULT_LOCATION_TEXT);
  return loadPlugin("expo-location", "location")(config, {
    locationWhenInUsePermission: text,
    locationAlwaysAndWhenInUsePermission: text,
    locationAlwaysPermission: text,
    isIosBackgroundLocationEnabled: false,
    isAndroidBackgroundLocationEnabled: false,
    isAndroidForegroundServiceEnabled: false,
  });
}

const CAPABILITIES = { location: withLocation };

function withGlowupDevice(config, options = {}) {
  for (const key of Object.keys(options)) {
    if (!(key in CAPABILITIES)) {
      throw new Error(
        `${TAG} unknown capability "${key}". Known: ${Object.keys(CAPABILITIES).join(", ")}.`,
      );
    }
  }
  for (const [key, apply] of Object.entries(CAPABILITIES)) {
    const value = options[key];
    if (value === undefined || value === false) continue;
    config = apply(config, value === true ? {} : value);
  }
  return config;
}

module.exports = createRunOncePlugin(withGlowupDevice, pkg.name, pkg.version);

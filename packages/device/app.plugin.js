/**
 * The config plugin: `["@its/glowup-device", { location: { … } }]` in the app
 * config. It configures only the capabilities listed, each through its Expo
 * module's own plugin, which is required only then — an app that never uses
 * the camera needs no expo-camera to prebuild.
 *
 * Runs in Node at prebuild, not in the app: plain CommonJS, no build step.
 */
const { AndroidConfig, createRunOncePlugin } = require("expo/config-plugins");

const pkg = require("./package.json");

const TAG = `[${pkg.name}]`;

// Generic on purpose: App Store review rejects purpose strings that do not say
// why the app needs the data, so a missing text is a warning, not a default.
const DEFAULT_LOCATION_TEXT = "Allow $(PRODUCT_NAME) to use your location.";
const DEFAULT_CAMERA_TEXT = "Allow $(PRODUCT_NAME) to use your camera.";
const DEFAULT_MICROPHONE_TEXT =
  "Allow $(PRODUCT_NAME) to record sound with your videos.";
const DEFAULT_FACE_ID_TEXT = "Allow $(PRODUCT_NAME) to use Face ID.";
const DEFAULT_MOTION_TEXT =
  "Allow $(PRODUCT_NAME) to use your motion and fitness data.";

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

/**
 * Camera, photos and scanning; sound in videos only with `recordAudio: true`,
 * which adds Android's RECORD_AUDIO and makes the microphone text required.
 * iOS always keeps a microphone purpose string, as expo-camera's own plugin
 * does (its binary references the audio capture APIs); without `recordAudio`
 * the app never asks, so its text is never shown. `barcodeScanner: false`
 * drops the scanning libraries from the build (expo-camera's
 * `barcodeScannerEnabled`).
 */
function withCamera(config, options) {
  const recordAudio = options.recordAudio === true;
  const cameraText =
    options.cameraPermission ??
    placeholder("camera.cameraPermission", DEFAULT_CAMERA_TEXT);
  const microphoneText =
    options.microphonePermission ??
    (recordAudio
      ? placeholder("camera.microphonePermission", DEFAULT_MICROPHONE_TEXT)
      : DEFAULT_MICROPHONE_TEXT);
  return loadPlugin("expo-camera", "camera")(config, {
    cameraPermission: cameraText,
    microphonePermission: microphoneText,
    recordAudioAndroid: recordAudio,
    barcodeScannerEnabled: options.barcodeScanner !== false,
  });
}

/**
 * Face ID's purpose string, plus Android's USE_BIOMETRIC (and the deprecated
 * USE_FINGERPRINT, which expo's plugin still adds for old devices). Without
 * the purpose string iOS does not crash: Face ID quietly falls back to the
 * passcode, or fails with `unavailable` when the prompt has no fallback.
 */
function withBiometrics(config, options) {
  const text =
    options.faceIDPermission ??
    placeholder("biometrics.faceIDPermission", DEFAULT_FACE_ID_TEXT);
  return loadPlugin("expo-local-authentication", "biometrics")(config, {
    faceIDPermission: text,
  });
}

/**
 * Android: leaves the store out of Auto Backup (expo-secure-store's own
 * rules), since its Keystore keys never leave the device and a restored
 * item could not be decrypted. iOS: Face ID's purpose string, used by
 * protected items. Listed with `biometrics`, whose text is written first,
 * expo-secure-store keeps that text when this one is not set.
 */
function withSecureStore(config, options) {
  return loadPlugin("expo-secure-store", "secureStore")(config, {
    faceIDPermission: options.faceIDPermission,
    configureAndroidBackup: options.androidBackupRules !== false,
  });
}

/**
 * iOS: the Motion & Fitness purpose string, which the barometer needs (and
 * expo-sensors' permission requester, which crashes the app without it).
 * `motionPermission: false` leaves it out for an app that never uses the
 * barometer, which then reads `denied` there. Android: removes
 * ACTIVITY_RECOGNITION, which expo-sensors' manifest adds for a pedometer
 * this package does not expose. `highSamplingRate: true` adds
 * HIGH_SAMPLING_RATE_SENSORS, without which Android 12 and later deliver no
 * faster than every 200 ms (with it, expo-sensors runs every sensor at full
 * speed and drops readings in software).
 */
function withSensors(config, options) {
  let motionPermission = options.motionPermission;
  if (motionPermission === undefined) {
    console.warn(
      `${TAG} sensors.motionPermission is not set: using "${DEFAULT_MOTION_TEXT}". ` +
        "Say why the app reads the barometer before you submit (App Store review " +
        "rejects generic purpose strings), or set it to false if the app does not.",
    );
    motionPermission = DEFAULT_MOTION_TEXT;
  }
  config = loadPlugin("expo-sensors", "sensors")(config, { motionPermission });
  config = AndroidConfig.Permissions.withBlockedPermissions(config, [
    "android.permission.ACTIVITY_RECOGNITION",
  ]);
  if (options.highSamplingRate === true) {
    config = AndroidConfig.Permissions.withPermissions(config, [
      "android.permission.HIGH_SAMPLING_RATE_SENSORS",
    ]);
  }
  return config;
}

const CAPABILITIES = {
  location: withLocation,
  camera: withCamera,
  biometrics: withBiometrics,
  secureStore: withSecureStore,
  sensors: withSensors,
};

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

/**
 * The config plugin: `["@its/glowup-device", { location: { … } }]` in the app
 * config. It configures only the capabilities listed, each through its Expo
 * module's own plugin, which is required only then — an app that never uses
 * the camera needs no expo-camera to prebuild.
 *
 * Runs in Node at prebuild, not in the app: plain CommonJS, no build step.
 */
const {
  AndroidConfig,
  createRunOncePlugin,
  withInfoPlist,
} = require("expo/config-plugins");

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
const DEFAULT_SAVE_TEXT = "Allow $(PRODUCT_NAME) to save photos and videos.";
const DEFAULT_ALWAYS_TEXT =
  "Allow $(PRODUCT_NAME) to use your location in the background.";
const DEFAULT_BLUETOOTH_TEXT =
  "Allow $(PRODUCT_NAME) to connect to Bluetooth devices.";

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

// How Android keeps continuous updates going; "none" for geofencing alone.
const BACKGROUND_MODES = ["foreground-service", "background", "none"];

/**
 * Foreground location, plus what `backgroundLocation` asks for: expo-location's
 * plugin runs once per prebuild, so both keys go through this one call.
 *
 * Without `backgroundLocation`, iOS still gets the "Always" purpose strings
 * (with the when-in-use text), as expo-location's own plugin writes them: its
 * binary references the Always APIs, and App Store Connect can flag a binary
 * that does so without the purpose string (ITMS-90683). They grant nothing.
 * Android then gets no background or foreground-service permission.
 */
function withLocation(config, options, all) {
  const text =
    options.whenInUsePermission ??
    placeholder("location.whenInUsePermission", DEFAULT_LOCATION_TEXT);
  const background = all.backgroundLocation || null;
  const always = background
    ? (background.alwaysPermission ??
      placeholder("backgroundLocation.alwaysPermission", DEFAULT_ALWAYS_TEXT))
    : text;
  const mode = background ? (background.mode ?? "foreground-service") : null;
  // Geofencing needs the background permission whatever the mode.
  const geofencing = background?.geofencing === true;
  return loadPlugin("expo-location", "location")(config, {
    locationWhenInUsePermission: text,
    locationAlwaysAndWhenInUsePermission: always,
    locationAlwaysPermission: always,
    isIosBackgroundLocationEnabled: background !== null,
    isAndroidBackgroundLocationEnabled: mode === "background" || geofencing,
    isAndroidForegroundServiceEnabled: mode === "foreground-service",
  });
}

const FETCH_PLUGINS = ["expo-background-fetch", "expo-background-task"];

function usesBackgroundFetch(config) {
  const declared = config.ios?.infoPlist?.UIBackgroundModes ?? [];
  const plugins = (config.plugins ?? []).map((plugin) =>
    Array.isArray(plugin) ? plugin[0] : plugin,
  );
  return (
    declared.includes("fetch") ||
    plugins.some((name) => FETCH_PLUGINS.includes(name))
  );
}

/**
 * Background updates and geofencing (`/background-location`). The location
 * side (iOS's `location` background mode, Android's permissions for the
 * chosen `mode`, and the background permission for `geofencing`) is written
 * by `withLocation`; this adds expo-task-manager, which runs the
 * task. Its plugin always adds iOS's `fetch` background mode, which nothing
 * here uses and App Review asks about: it is removed, unless the app declares
 * it or uses expo-background-fetch / expo-background-task. The removal is
 * registered before task-manager's plugin runs, because Info.plist mods run
 * in reverse order: it then sees the mode task-manager added. An app that
 * lists expo-task-manager before this plugin gets a warning instead.
 */
function withBackgroundLocation(config, options, all) {
  if (all.location === undefined || all.location === false) {
    throw new Error(
      `${TAG} "backgroundLocation" needs "location" too: its purpose string and permissions are the same.`,
    );
  }
  const mode = options.mode ?? "foreground-service";
  if (!BACKGROUND_MODES.includes(mode)) {
    throw new Error(
      `${TAG} backgroundLocation.mode must be ${BACKGROUND_MODES.map((m) => `"${m}"`).join(", ")}, not ${JSON.stringify(options.mode)}.`,
    );
  }
  if (
    options.geofencing !== undefined &&
    typeof options.geofencing !== "boolean"
  ) {
    throw new Error(`${TAG} backgroundLocation.geofencing must be a boolean.`);
  }
  if (mode === "none" && options.geofencing !== true) {
    throw new Error(
      `${TAG} backgroundLocation.mode "none" leaves nothing to configure: set geofencing: true, or pick a mode.`,
    );
  }
  if (config._internal?.pluginHistory?.["expo-task-manager"]) {
    // Its Info.plist mod was registered first, so it runs last: too late.
    console.warn(
      `${TAG} expo-task-manager is listed before @its/glowup-device, so iOS keeps its "fetch" background mode. ` +
        "List it after, or not at all: the backgroundLocation key adds it.",
    );
  } else if (!usesBackgroundFetch(config)) {
    config = withInfoPlist(config, (config) => {
      const modes = config.modResults.UIBackgroundModes;
      if (Array.isArray(modes)) {
        config.modResults.UIBackgroundModes = modes.filter(
          (m) => m !== "fetch",
        );
      }
      return config;
    });
  }
  return loadPlugin("expo-task-manager", "backgroundLocation")(config, {});
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

/**
 * Picking needs no permission on either platform. Android: removes CAMERA,
 * which expo-image-picker's manifest declares for its camera capture (not
 * exposed here), and RECORD_AUDIO, which its plugin adds — unless `camera`
 * is listed and needs them (RECORD_AUDIO with `recordAudio: true`). iOS
 * keeps expo's purpose strings for the photo library, the camera and the
 * microphone (or `camera`'s texts): its binary references those APIs, which
 * App Store Connect flags without them (ITMS-90683), though picking never
 * prompts.
 */
function withMediaPicker(config, _options, all) {
  const camera = all.camera !== undefined && all.camera !== false;
  const recordAudio = camera && all.camera.recordAudio === true;
  config = loadPlugin("expo-image-picker", "mediaPicker")(config, {});
  return AndroidConfig.Permissions.withBlockedPermissions(
    config,
    [
      !camera && "android.permission.CAMERA",
      !recordAudio && "android.permission.RECORD_AUDIO",
    ].filter(Boolean),
  );
}

/**
 * iOS: the add-only purpose string, which the save prompt shows (and whose
 * absence crashes it). The full-library string stays expo's: the binary
 * references those APIs (ITMS-90683), though saving never asks for them.
 * Android: no media read permission. expo-media-library's plugin adds
 * READ_MEDIA_IMAGES, READ_MEDIA_VIDEO and READ_MEDIA_AUDIO by default and
 * its manifest READ_MEDIA_VISUAL_USER_SELECTED; Google Play accepts them
 * only for apps whose core feature is browsing the library. Saving needs
 * none of them (WRITE_EXTERNAL_STORAGE, which Android 10 and earlier need,
 * stays).
 */
function withMediaLibrary(config, options) {
  const text =
    options.savePermission ??
    placeholder("mediaLibrary.savePermission", DEFAULT_SAVE_TEXT);
  config = loadPlugin("expo-media-library", "mediaLibrary")(config, {
    savePhotosPermission: text,
    granularPermissions: [],
    isAccessMediaLocationEnabled: false,
  });
  return AndroidConfig.Permissions.withBlockedPermissions(config, [
    "android.permission.READ_MEDIA_IMAGES",
    "android.permission.READ_MEDIA_VIDEO",
    "android.permission.READ_MEDIA_AUDIO",
    "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
    "android.permission.ACCESS_MEDIA_LOCATION",
  ]);
}

/**
 * Through react-native-ble-manager's plugin. iOS: the Bluetooth purpose
 * string, which the prompt shows and without which ble-manager refuses to
 * start. Android 12 and later: BLUETOOTH_SCAN and BLUETOOTH_CONNECT;
 * Android 11 and earlier: the location permissions, which scans need there.
 * `neverForLocation` (default true, where ble-manager's default is false)
 * asserts that scans never locate the user: no location permission from
 * Android 12, and scans may then leave out beacons. Set it to false for
 * beacon-based presence, and create the adapter with the same option.
 */
function withBluetooth(config, options) {
  const { neverForLocation = true } = options;
  if (typeof neverForLocation !== "boolean") {
    throw new Error(`${TAG} bluetooth.neverForLocation must be a boolean.`);
  }
  const text =
    options.permission ??
    placeholder("bluetooth.permission", DEFAULT_BLUETOOTH_TEXT);
  return loadPlugin("react-native-ble-manager", "bluetooth")(config, {
    bluetoothAlwaysPermission: text,
    neverForLocation,
    isBleRequired: false,
    companionDeviceEnabled: false,
  });
}

// Bluetooth before location: Android manifest mods run in reverse order, so
// expo-location's permissions are written first and ble-manager, which skips
// a permission already there, does not add a second ACCESS_FINE_LOCATION
// capped at Android 11.
const CAPABILITIES = {
  bluetooth: withBluetooth,
  location: withLocation,
  camera: withCamera,
  biometrics: withBiometrics,
  secureStore: withSecureStore,
  sensors: withSensors,
  mediaPicker: withMediaPicker,
  mediaLibrary: withMediaLibrary,
  backgroundLocation: withBackgroundLocation,
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
    config = apply(config, value === true ? {} : value, options);
  }
  return config;
}

module.exports = createRunOncePlugin(withGlowupDevice, pkg.name, pkg.version);

/**
 * The config plugin, run through Expo's own mod compiler in introspection
 * mode (what `npx expo config --type introspect` does): the assertions are on
 * the Info.plist and AndroidManifest a prebuild would write.
 */
import type { ExpoConfig } from "expo/config";
import { compileModsAsync } from "expo/config-plugins";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PLUGIN = "../../app.plugin.js";

type Plugin = (config: ExpoConfig, options?: unknown) => ExpoConfig;
const loadPlugin = (): Plugin => jest.requireActual(PLUGIN);

interface PrebuildExtras {
  /** Merged into the app config before the plugin runs. */
  app?: Partial<ExpoConfig>;
  /** Plugins applied before / after this one, as an app's list would. */
  before?: ((config: ExpoConfig) => ExpoConfig)[];
  after?: ((config: ExpoConfig) => ExpoConfig)[];
}

async function prebuild(
  options: unknown,
  { app, before = [], after = [] }: PrebuildExtras = {},
) {
  const projectRoot = mkdtempSync(join(tmpdir(), "glowup-device-plugin-"));
  let config: ExpoConfig = {
    name: "Example",
    slug: "example",
    ...app,
    ios: { bundleIdentifier: "com.example.app", ...app?.ios },
    android: { package: "com.example.app" },
  };
  config = before.reduce((c, plugin) => plugin(c), config);
  config = loadPlugin()(config, options);
  config = after.reduce((c, plugin) => plugin(c), config);
  config = await compileModsAsync(config, {
    projectRoot,
    introspect: true,
    platforms: ["ios", "android"],
    assertMissingModProviders: false,
  });
  const results = config._internal!.modResults;
  const infoPlist: Record<string, unknown> = results.ios.infoPlist;
  const permissions: string[] = (
    results.android.manifest.manifest["uses-permission"] ?? []
  ).map((p: { $: Record<string, string> }) => p.$["android:name"]);
  const podfileProperties: Record<string, string> =
    results.ios.podfileProperties ?? {};
  const manifestApplication: Record<string, string> =
    results.android.manifest.manifest.application?.[0]?.$ ?? {};
  // Entries the manifest merger removes from the libraries' manifests.
  const removedPermissions: string[] = (
    results.android.manifest.manifest["uses-permission"] ?? []
  )
    .filter(
      (p: { $: Record<string, string> }) => p.$["tools:node"] === "remove",
    )
    .map((p: { $: Record<string, string> }) => p.$["android:name"]);
  return {
    infoPlist,
    permissions,
    podfileProperties,
    manifestApplication,
    removedPermissions,
    manifest: results.android.manifest.manifest as Record<
      string,
      { $: Record<string, string> }[] | undefined
    >,
  };
}

/** Every `<tag>` entry for a permission, with its attributes. */
function declarations(
  manifest: Record<string, { $: Record<string, string> }[] | undefined>,
  name: string,
) {
  return ["uses-permission", "uses-permission-sdk-23"].flatMap((tag) =>
    (manifest[tag] ?? [])
      .filter((p) => p.$["android:name"] === `android.permission.${name}`)
      .map((p) => ({ tag, ...p.$ })),
  );
}

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe("location", () => {
  it("writes the purpose string and foreground permissions only", async () => {
    const { infoPlist, permissions } = await prebuild({
      location: { whenInUsePermission: "To show the shops near you." },
    });
    expect(infoPlist.NSLocationWhenInUseUsageDescription).toBe(
      "To show the shops near you.",
    );
    expect(infoPlist.UIBackgroundModes ?? []).not.toContain("location");
    expect(permissions).toEqual(
      expect.arrayContaining([
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
      ]),
    );
    expect(permissions).not.toContain(
      "android.permission.ACCESS_BACKGROUND_LOCATION",
    );
    expect(permissions).not.toContain("android.permission.FOREGROUND_SERVICE");
    expect(warn).not.toHaveBeenCalled();
  });

  it("keeps the Always strings, with the same text", async () => {
    const { infoPlist } = await prebuild({
      location: { whenInUsePermission: "To show the shops near you." },
    });
    expect(infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription).toBe(
      "To show the shops near you.",
    );
  });

  it("warns when the purpose string is left to the default", async () => {
    const { infoPlist } = await prebuild({ location: true });
    expect(infoPlist.NSLocationWhenInUseUsageDescription).toBe(
      "Allow $(PRODUCT_NAME) to use your location.",
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("location.whenInUsePermission is not set"),
    );
  });
});

describe("backgroundLocation", () => {
  // What prebuild applies on its own when expo-task-manager is installed,
  // after the app's plugins (`withLegacyExpoPlugins`).
  const taskManagerPlugin = (config: ExpoConfig): ExpoConfig =>
    jest.requireActual("expo-task-manager/app.plugin").default(config);

  const LOCATION = { whenInUsePermission: "To record your trips." };

  it("defaults to Android's foreground service", async () => {
    const { infoPlist, permissions } = await prebuild({
      location: LOCATION,
      backgroundLocation: {
        alwaysPermission: "To record trips in the background.",
      },
    });
    expect(infoPlist.UIBackgroundModes).toEqual(["location"]);
    expect(infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription).toBe(
      "To record trips in the background.",
    );
    expect(infoPlist.NSLocationAlwaysUsageDescription).toBe(
      "To record trips in the background.",
    );
    expect(infoPlist.NSLocationWhenInUseUsageDescription).toBe(
      "To record your trips.",
    );
    expect(permissions).toEqual(
      expect.arrayContaining([
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_LOCATION",
      ]),
    );
    expect(permissions).not.toContain(
      "android.permission.ACCESS_BACKGROUND_LOCATION",
    );
  });

  it("asks for Android's background permission in background mode only", async () => {
    const { permissions } = await prebuild({
      location: LOCATION,
      backgroundLocation: { mode: "background", alwaysPermission: "Trips." },
    });
    expect(permissions).toContain(
      "android.permission.ACCESS_BACKGROUND_LOCATION",
    );
    expect(permissions).not.toContain("android.permission.FOREGROUND_SERVICE");
    expect(permissions).not.toContain(
      "android.permission.FOREGROUND_SERVICE_LOCATION",
    );
  });

  it("removes task-manager's fetch mode, also when prebuild applies it again", async () => {
    const { infoPlist } = await prebuild(
      {
        location: LOCATION,
        backgroundLocation: { alwaysPermission: "Trips." },
      },
      { after: [taskManagerPlugin] },
    );
    expect(infoPlist.UIBackgroundModes).toEqual(["location"]);
  });

  it("warns, and keeps fetch, when expo-task-manager is listed first", async () => {
    const { infoPlist } = await prebuild(
      {
        location: LOCATION,
        backgroundLocation: { alwaysPermission: "Trips." },
      },
      { before: [taskManagerPlugin] },
    );
    expect(infoPlist.UIBackgroundModes).toEqual(
      expect.arrayContaining(["fetch", "location"]),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("expo-task-manager is listed before"),
    );
  });

  it("keeps fetch for an app that declares it or fetches in the background", async () => {
    const declared = await prebuild(
      {
        location: LOCATION,
        backgroundLocation: { alwaysPermission: "Trips." },
      },
      { app: { ios: { infoPlist: { UIBackgroundModes: ["fetch"] } } } },
    );
    expect(declared.infoPlist.UIBackgroundModes).toEqual(
      expect.arrayContaining(["fetch", "location"]),
    );
    const task = await prebuild(
      {
        location: LOCATION,
        backgroundLocation: { alwaysPermission: "Trips." },
      },
      { app: { plugins: ["expo-background-task"] } },
    );
    expect(task.infoPlist.UIBackgroundModes).toEqual(
      expect.arrayContaining(["fetch", "location"]),
    );
  });

  it("warns when the Always purpose string is left to the default", async () => {
    const { infoPlist } = await prebuild({
      location: LOCATION,
      backgroundLocation: true,
    });
    expect(infoPlist.NSLocationAlwaysUsageDescription).toBe(
      "Allow $(PRODUCT_NAME) to use your location in the background.",
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("backgroundLocation.alwaysPermission is not set"),
    );
  });

  it("needs location, and a known mode", () => {
    expect(() =>
      loadPlugin()({ name: "x", slug: "x" }, { backgroundLocation: true }),
    ).toThrow('"backgroundLocation" needs "location" too');
    expect(() =>
      loadPlugin()(
        { name: "x", slug: "x" },
        { location: true, backgroundLocation: { mode: "always" } },
      ),
    ).toThrow(
      'backgroundLocation.mode must be "foreground-service", "background", "none"',
    );
  });

  it("adds the background permission for geofencing, whatever the mode", async () => {
    const { infoPlist, permissions } = await prebuild({
      location: LOCATION,
      backgroundLocation: { geofencing: true, alwaysPermission: "Sites." },
    });
    expect(infoPlist.UIBackgroundModes).toEqual(["location"]);
    expect(permissions).toEqual(
      expect.arrayContaining([
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.FOREGROUND_SERVICE_LOCATION",
      ]),
    );
  });

  it("configures geofencing alone with mode none", async () => {
    const { infoPlist, permissions } = await prebuild({
      location: LOCATION,
      backgroundLocation: {
        mode: "none",
        geofencing: true,
        alwaysPermission: "Sites.",
      },
    });
    expect(infoPlist.UIBackgroundModes).toEqual(["location"]);
    expect(permissions).toContain(
      "android.permission.ACCESS_BACKGROUND_LOCATION",
    );
    expect(permissions).not.toContain("android.permission.FOREGROUND_SERVICE");
    expect(permissions).not.toContain(
      "android.permission.FOREGROUND_SERVICE_LOCATION",
    );
  });

  it("refuses mode none without geofencing, and a geofencing that is not a boolean", () => {
    expect(() =>
      loadPlugin()(
        { name: "x", slug: "x" },
        { location: true, backgroundLocation: { mode: "none" } },
      ),
    ).toThrow('mode "none" leaves nothing to configure');
    expect(() =>
      loadPlugin()(
        { name: "x", slug: "x" },
        { location: true, backgroundLocation: { geofencing: "yes" } },
      ),
    ).toThrow("backgroundLocation.geofencing must be a boolean");
  });
});

describe("camera", () => {
  it("adds the camera only: no sound in videos by default", async () => {
    const { infoPlist, permissions, podfileProperties } = await prebuild({
      camera: { cameraPermission: "Scans your ticket." },
    });
    expect(infoPlist.NSCameraUsageDescription).toBe("Scans your ticket.");
    expect(permissions).toContain("android.permission.CAMERA");
    expect(permissions).not.toContain("android.permission.RECORD_AUDIO");
    expect(podfileProperties["expo.camera.barcode-scanner-enabled"]).toBe(
      undefined,
    );
    // Kept for the binary's audio APIs, never shown without recordAudio.
    expect(infoPlist.NSMicrophoneUsageDescription).toEqual(expect.any(String));
    expect(warn).not.toHaveBeenCalled();
  });

  it("adds the microphone with recordAudio", async () => {
    const { infoPlist, permissions } = await prebuild({
      camera: {
        cameraPermission: "Films your review.",
        microphonePermission: "Records your voice in the review.",
        recordAudio: true,
      },
    });
    expect(infoPlist.NSMicrophoneUsageDescription).toBe(
      "Records your voice in the review.",
    );
    expect(permissions).toContain("android.permission.RECORD_AUDIO");
  });

  it("warns for each purpose string left to the default", async () => {
    await prebuild({ camera: { recordAudio: true } });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("camera.cameraPermission is not set"),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("camera.microphonePermission is not set"),
    );
  });

  it("can leave the scanner out of the build", async () => {
    const { podfileProperties } = await prebuild({
      camera: { cameraPermission: "x", barcodeScanner: false },
    });
    expect(podfileProperties["expo.camera.barcode-scanner-enabled"]).toBe(
      "false",
    );
  });
});

describe("biometrics", () => {
  it("writes Face ID's purpose string and Android's permission", async () => {
    const { infoPlist, permissions } = await prebuild({
      biometrics: { faceIDPermission: "Unlocks your wallet." },
    });
    expect(infoPlist.NSFaceIDUsageDescription).toBe("Unlocks your wallet.");
    expect(permissions).toContain("android.permission.USE_BIOMETRIC");
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns when the purpose string is left to the default", async () => {
    const { infoPlist } = await prebuild({ biometrics: true });
    expect(infoPlist.NSFaceIDUsageDescription).toBe(
      "Allow $(PRODUCT_NAME) to use Face ID.",
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("biometrics.faceIDPermission is not set"),
    );
  });
});

describe("secureStore", () => {
  it("leaves the store out of Android's backups", async () => {
    const { manifestApplication } = await prebuild({ secureStore: true });
    expect(manifestApplication["android:dataExtractionRules"]).toBe(
      "@xml/secure_store_data_extraction_rules",
    );
    expect(manifestApplication["android:fullBackupContent"]).toBe(
      "@xml/secure_store_backup_rules",
    );
  });

  it("can leave the backup rules to the app", async () => {
    const { manifestApplication } = await prebuild({
      secureStore: { androidBackupRules: false },
    });
    expect(manifestApplication["android:dataExtractionRules"]).toBeUndefined();
  });

  it("keeps the biometrics text for Face ID", async () => {
    const { infoPlist } = await prebuild({
      biometrics: { faceIDPermission: "Unlocks your wallet." },
      secureStore: true,
    });
    expect(infoPlist.NSFaceIDUsageDescription).toBe("Unlocks your wallet.");
  });

  it("takes its own Face ID text", async () => {
    const { infoPlist } = await prebuild({
      secureStore: { faceIDPermission: "Reads your saved token." },
    });
    expect(infoPlist.NSFaceIDUsageDescription).toBe("Reads your saved token.");
  });
});

describe("sensors", () => {
  it("writes the motion purpose string and removes the pedometer's permission", async () => {
    const { infoPlist, permissions, removedPermissions } = await prebuild({
      sensors: { motionPermission: "Measures the floors you climb." },
    });
    expect(infoPlist.NSMotionUsageDescription).toBe(
      "Measures the floors you climb.",
    );
    expect(removedPermissions).toEqual([
      "android.permission.ACTIVITY_RECOGNITION",
    ]);
    expect(permissions).not.toContain(
      "android.permission.HIGH_SAMPLING_RATE_SENSORS",
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it("can leave the motion purpose string out", async () => {
    const { infoPlist, podfileProperties } = await prebuild({
      sensors: { motionPermission: false },
    });
    expect(infoPlist.NSMotionUsageDescription).toBeUndefined();
    expect(podfileProperties.MOTION_PERMISSION).toBe("false");
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns when the purpose string is left to the default", async () => {
    const { infoPlist } = await prebuild({ sensors: true });
    expect(infoPlist.NSMotionUsageDescription).toBe(
      "Allow $(PRODUCT_NAME) to use your motion and fitness data.",
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("sensors.motionPermission");
  });

  it("adds the high sampling rate permission on request", async () => {
    const { permissions } = await prebuild({
      sensors: { motionPermission: false, highSamplingRate: true },
    });
    expect(permissions).toContain(
      "android.permission.HIGH_SAMPLING_RATE_SENSORS",
    );
  });
});

describe("mediaPicker", () => {
  it("removes the camera and microphone the picker never uses", async () => {
    const { infoPlist, permissions, removedPermissions } = await prebuild({
      mediaPicker: true,
    });
    expect(removedPermissions).toEqual([
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
    ]);
    expect(permissions).not.toContain("android.permission.READ_MEDIA_IMAGES");
    // Kept for App Store Connect: the binary references these APIs.
    expect(infoPlist.NSPhotoLibraryUsageDescription).toEqual(
      expect.any(String),
    );
    expect(infoPlist.NSCameraUsageDescription).toEqual(expect.any(String));
    expect(infoPlist.NSMicrophoneUsageDescription).toEqual(expect.any(String));
    expect(warn).not.toHaveBeenCalled();
  });

  it("leaves the camera's permissions to the camera", async () => {
    const { infoPlist, permissions, removedPermissions } = await prebuild({
      camera: { cameraPermission: "Scans tickets." },
      mediaPicker: true,
    });
    expect(permissions).toContain("android.permission.CAMERA");
    expect(removedPermissions).toEqual(["android.permission.RECORD_AUDIO"]);
    expect(infoPlist.NSCameraUsageDescription).toBe("Scans tickets.");
  });

  it("keeps the microphone for a camera that records sound", async () => {
    const { infoPlist, permissions, removedPermissions } = await prebuild({
      camera: {
        cameraPermission: "Records reviews.",
        microphonePermission: "Records your voice.",
        recordAudio: true,
      },
      mediaPicker: true,
    });
    expect(permissions).toEqual(
      expect.arrayContaining([
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
      ]),
    );
    expect(removedPermissions).toEqual([]);
    expect(infoPlist.NSMicrophoneUsageDescription).toBe("Records your voice.");
  });
});

describe("mediaLibrary", () => {
  it("writes the save purpose string and removes every media read permission", async () => {
    const { infoPlist, permissions, removedPermissions } = await prebuild({
      mediaLibrary: { savePermission: "Saves your edited photos." },
    });
    expect(infoPlist.NSPhotoLibraryAddUsageDescription).toBe(
      "Saves your edited photos.",
    );
    // Kept for App Store Connect: the binary references the library APIs.
    expect(infoPlist.NSPhotoLibraryUsageDescription).toEqual(
      expect.any(String),
    );
    expect(removedPermissions).toEqual([
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.READ_MEDIA_AUDIO",
      "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
      "android.permission.ACCESS_MEDIA_LOCATION",
    ]);
    // Only the removal entries: nothing adds them back.
    for (const name of removedPermissions) {
      expect(permissions.filter((p) => p === name)).toHaveLength(1);
    }
    // Android 10 and earlier save with it.
    expect(permissions).toContain("android.permission.WRITE_EXTERNAL_STORAGE");
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns when the purpose string is left to the default", async () => {
    const { infoPlist } = await prebuild({ mediaLibrary: true });
    expect(infoPlist.NSPhotoLibraryAddUsageDescription).toBe(
      "Allow $(PRODUCT_NAME) to save photos and videos.",
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("mediaLibrary.savePermission");
  });
});

it("configures nothing that is not listed", async () => {
  const { infoPlist, permissions, manifestApplication, removedPermissions } =
    await prebuild({});
  expect(infoPlist.NSLocationWhenInUseUsageDescription).toBeUndefined();
  expect(permissions).not.toContain("android.permission.ACCESS_FINE_LOCATION");
  expect(infoPlist.NSCameraUsageDescription).toBeUndefined();
  expect(permissions).not.toContain("android.permission.CAMERA");
  expect(infoPlist.NSFaceIDUsageDescription).toBeUndefined();
  expect(permissions).not.toContain("android.permission.USE_BIOMETRIC");
  expect(manifestApplication["android:dataExtractionRules"]).toBeUndefined();
  expect(infoPlist.NSMotionUsageDescription).toBeUndefined();
  expect(infoPlist.NSPhotoLibraryUsageDescription).toBeUndefined();
  expect(infoPlist.NSPhotoLibraryAddUsageDescription).toBeUndefined();
  expect(removedPermissions).toEqual([]);
});

it("rejects an unknown capability", () => {
  expect(() => loadPlugin()({ name: "x", slug: "x" }, { gps: true })).toThrow(
    'unknown capability "gps"',
  );
});

describe("bluetooth", () => {
  it("writes the purpose string, and Android 12's permissions never for location", async () => {
    const { infoPlist, manifest } = await prebuild({
      bluetooth: { permission: "To read your heart rate monitor." },
    });
    expect(infoPlist.NSBluetoothAlwaysUsageDescription).toBe(
      "To read your heart rate monitor.",
    );
    expect(declarations(manifest, "BLUETOOTH_SCAN")).toEqual([
      expect.objectContaining({
        "android:usesPermissionFlags": "neverForLocation",
      }),
    ]);
    expect(declarations(manifest, "BLUETOOTH_CONNECT")).toHaveLength(1);
    // Android 11 and earlier scan only with location: capped at 30.
    expect(declarations(manifest, "ACCESS_FINE_LOCATION")).toEqual([
      expect.objectContaining({
        tag: "uses-permission-sdk-23",
        "android:maxSdkVersion": "30",
      }),
    ]);
    expect(manifest["uses-feature"] ?? []).toEqual([]);
  });

  it("keeps the location permissions for scans that locate the user", async () => {
    const { manifest } = await prebuild({
      bluetooth: {
        permission: "To find the beacons.",
        neverForLocation: false,
      },
    });
    expect(declarations(manifest, "BLUETOOTH_SCAN")).toEqual([
      expect.not.objectContaining({
        "android:usesPermissionFlags": expect.anything(),
      }),
    ]);
    expect(declarations(manifest, "ACCESS_FINE_LOCATION")).toEqual([
      expect.not.objectContaining({
        "android:maxSdkVersion": expect.anything(),
      }),
    ]);
  });

  it("declares location once, uncapped, beside the location capability", async () => {
    const { manifest } = await prebuild({
      location: { whenInUsePermission: "To show the shops near you." },
      bluetooth: { permission: "To read your heart rate monitor." },
    });
    for (const name of ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]) {
      expect(declarations(manifest, name)).toEqual([
        expect.not.objectContaining({
          "android:maxSdkVersion": expect.anything(),
        }),
      ]);
    }
  });

  it("warns when the purpose string is left to the default", async () => {
    const { infoPlist } = await prebuild({ bluetooth: true });
    expect(infoPlist.NSBluetoothAlwaysUsageDescription).toBe(
      "Allow $(PRODUCT_NAME) to connect to Bluetooth devices.",
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("bluetooth.permission is not set"),
    );
  });

  it("refuses a neverForLocation that is not a boolean", () => {
    expect(() =>
      loadPlugin()(
        { name: "Example", slug: "example" },
        { bluetooth: { neverForLocation: "yes" } },
      ),
    ).toThrow("bluetooth.neverForLocation must be a boolean.");
  });
});

// Last: its doMock outlives isolateModules.
it("names the Expo module to install when it is missing", () => {
  jest.isolateModules(() => {
    jest.doMock("expo-location/app.plugin", () => {
      throw new Error("Cannot find module 'expo-location/app.plugin'");
    });
    expect(() =>
      loadPlugin()({ name: "x", slug: "x" }, { location: true }),
    ).toThrow("npx expo install expo-location");
  });
});

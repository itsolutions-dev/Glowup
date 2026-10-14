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

async function prebuild(options: unknown) {
  const projectRoot = mkdtempSync(join(tmpdir(), "glowup-device-plugin-"));
  let config: ExpoConfig = {
    name: "Example",
    slug: "example",
    ios: { bundleIdentifier: "com.example.app" },
    android: { package: "com.example.app" },
  };
  config = loadPlugin()(config, options);
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
  };
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
  expect(removedPermissions).toEqual([]);
});

it("rejects an unknown capability", () => {
  expect(() => loadPlugin()({ name: "x", slug: "x" }, { gps: true })).toThrow(
    'unknown capability "gps"',
  );
});

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

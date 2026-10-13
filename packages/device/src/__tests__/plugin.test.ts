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
  return { infoPlist, permissions };
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

it("configures nothing that is not listed", async () => {
  const { infoPlist, permissions } = await prebuild({});
  expect(infoPlist.NSLocationWhenInUseUsageDescription).toBeUndefined();
  expect(permissions).not.toContain("android.permission.ACCESS_FINE_LOCATION");
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

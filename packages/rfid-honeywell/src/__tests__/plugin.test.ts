/**
 * The config plugin: the manifest and gradle.properties through Expo's mod
 * compiler in introspection mode, the build.gradle edit and the SDK's copy on
 * their own (introspection runs neither file mod).
 */
import type { ExpoConfig } from "expo/config";
import { compileModsAsync } from "expo/config-plugins";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type Plugin = ((config: ExpoConfig, options?: unknown) => ExpoConfig) & {
  internal: {
    addRepository(buildGradle: string): string;
    raiseMinSdk(
      properties: { type: string; key?: string; value?: string }[],
    ): { type: string; key?: string; value?: string }[];
    copySdk(projectRoot: string, platformRoot: string, aarPath: string): void;
    artifactDir(): string;
  };
};
const plugin: Plugin = jest.requireActual("../../app.plugin.js");

const TEMPLATE_BUILD_GRADLE = `buildscript {
  repositories {
    google()
    mavenCentral()
  }
}

allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
  }
}
`;

async function prebuild(options: unknown) {
  const projectRoot = mkdtempSync(join(tmpdir(), "rfid-honeywell-plugin-"));
  let config: ExpoConfig = {
    name: "Example",
    slug: "example",
    android: { package: "com.example.app" },
  };
  config = plugin(config, options);
  config = await compileModsAsync(config, {
    projectRoot,
    introspect: true,
    platforms: ["android"],
    assertMissingModProviders: false,
  });
  const results = config._internal!.modResults.android;
  return {
    permissions: (results.manifest.manifest["uses-permission"] ?? []).map(
      (p: { $: Record<string, string> }) => p.$,
    ),
    properties: results.gradleProperties as {
      type: string;
      key?: string;
      value?: string;
    }[],
  };
}

describe("@its/rfid-honeywell config plugin", () => {
  it("requires the app's copy of the SDK", () => {
    expect(() => plugin({ name: "a", slug: "a" }, {} as never)).toThrow(
      /aarPath is required/,
    );
  });

  it("declares the nearby devices permissions, and the location a scan needs up to Android 11", async () => {
    const { permissions } = await prebuild({ aarPath: "./sdk.aar" });
    expect(permissions).toEqual(
      expect.arrayContaining([
        {
          "android:name": "android.permission.BLUETOOTH_SCAN",
          "android:usesPermissionFlags": "neverForLocation",
          "tools:targetApi": "s",
        },
        { "android:name": "android.permission.BLUETOOTH_CONNECT" },
        {
          "android:name": "android.permission.ACCESS_FINE_LOCATION",
          "android:maxSdkVersion": "30",
        },
      ]),
    );
  });

  it("raises minSdkVersion to the SDK's 26, never lowers it", () => {
    const { raiseMinSdk } = plugin.internal;
    expect(raiseMinSdk([])).toEqual([
      { type: "property", key: "android.minSdkVersion", value: "26" },
    ]);
    expect(
      raiseMinSdk([
        { type: "property", key: "android.minSdkVersion", value: "24" },
      ]),
    ).toEqual([
      { type: "property", key: "android.minSdkVersion", value: "26" },
    ]);
    expect(
      raiseMinSdk([
        { type: "property", key: "android.minSdkVersion", value: "28" },
      ]),
    ).toEqual([
      { type: "property", key: "android.minSdkVersion", value: "28" },
    ]);
  });

  it("writes minSdkVersion through a prebuild", async () => {
    const { properties } = await prebuild({ aarPath: "./sdk.aar" });
    expect(properties).toContainEqual({
      type: "property",
      key: "android.minSdkVersion",
      value: "26",
    });
  });

  it("declares the SDK's repository once, for its group only", () => {
    const { addRepository } = plugin.internal;
    const once = addRepository(TEMPLATE_BUILD_GRADLE);
    expect(addRepository(once)).toBe(once);
    expect(once).toContain(`allprojects {
  repositories {
    // @its/rfid-honeywell: the app's copy of the Honeywell RFID SDK
    maven {
      url = uri("$rootDir/honeywell-rfid-repository")
      content { includeGroup("com.honeywell.rfid") }
    }
    google()`);
    // Not in buildscript: only the app and the module resolve the SDK.
    expect(once.indexOf("honeywell-rfid-repository")).toBeGreaterThan(
      once.indexOf("allprojects"),
    );
    expect(() => addRepository("android {}")).toThrow(/allprojects/);
  });

  it("copies the SDK into a Maven layout with its POM", () => {
    const { copySdk, artifactDir } = plugin.internal;
    const root = mkdtempSync(join(tmpdir(), "rfid-honeywell-copy-"));
    mkdirSync(join(root, "android"));
    writeFileSync(join(root, "sdk.aar"), "aar bytes");
    copySdk(root, join(root, "android"), "./sdk.aar");
    const dir = join(root, "android", artifactDir());
    expect(artifactDir()).toBe(
      join(
        "honeywell-rfid-repository",
        "com",
        "honeywell",
        "rfid",
        "honeywell-rfid-sdk",
        "1.1.0",
      ),
    );
    expect(
      readFileSync(join(dir, "honeywell-rfid-sdk-1.1.0.aar"), "utf8"),
    ).toBe("aar bytes");
    expect(
      readFileSync(join(dir, "honeywell-rfid-sdk-1.1.0.pom"), "utf8"),
    ).toContain("<packaging>aar</packaging>");
    expect(() => copySdk(root, join(root, "android"), "./missing.aar")).toThrow(
      /does not exist/,
    );
    expect(existsSync(join(root, "missing.aar"))).toBe(false);
  });
});

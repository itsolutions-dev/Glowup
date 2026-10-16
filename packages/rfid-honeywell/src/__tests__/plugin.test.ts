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
    copySdk(
      projectRoot: string,
      platformRoot: string,
      sdk: Sdk,
      aarPath: string,
    ): void;
    artifactDir(sdk: Sdk): string;
    SDKS: Sdk[];
  };
};
type Sdk = { option: string; group: string; artifact: string; version: string };
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

const OPTIONS = { aarPath: "./sdk.aar", dataCollectionAarPath: "./dc.aar" };

describe("@its/rfid-honeywell config plugin", () => {
  it("requires the app's copies of both SDKs", () => {
    expect(() => plugin({ name: "a", slug: "a" }, {} as never)).toThrow(
      /aarPath is required/,
    );
    expect(() =>
      plugin({ name: "a", slug: "a" }, { aarPath: "./sdk.aar" }),
    ).toThrow(/dataCollectionAarPath is required/);
  });

  it("declares the nearby devices permissions, and the location a scan needs up to Android 11", async () => {
    const { permissions } = await prebuild(OPTIONS);
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
    const { properties } = await prebuild(OPTIONS);
    expect(properties).toContainEqual({
      type: "property",
      key: "android.minSdkVersion",
      value: "26",
    });
  });

  it("declares the SDKs' repository once, for their groups only", () => {
    const { addRepository } = plugin.internal;
    const once = addRepository(TEMPLATE_BUILD_GRADLE);
    expect(addRepository(once)).toBe(once);
    expect(once).toContain(`allprojects {
  repositories {
    // @its/rfid-honeywell: the app's copies of the Honeywell SDKs
    maven {
      url = uri("$rootDir/honeywell-rfid-repository")
      content {
        includeGroup("com.honeywell.rfid")
        includeGroup("com.honeywell.aidc")
      }
    }
    google()`);
    // Not in buildscript: only the app and the module resolve the SDK.
    expect(once.indexOf("honeywell-rfid-repository")).toBeGreaterThan(
      once.indexOf("allprojects"),
    );
    expect(() => addRepository("android {}")).toThrow(/allprojects/);
  });

  it("copies each SDK into a Maven layout with its POM", () => {
    const { copySdk, artifactDir, SDKS } = plugin.internal;
    const [rfid, dataCollection] = SDKS;
    const root = mkdtempSync(join(tmpdir(), "rfid-honeywell-copy-"));
    mkdirSync(join(root, "android"));
    writeFileSync(join(root, "sdk.aar"), "rfid bytes");
    writeFileSync(join(root, "dc.aar"), "aidc bytes");
    copySdk(root, join(root, "android"), rfid, "./sdk.aar");
    copySdk(root, join(root, "android"), dataCollection, "./dc.aar");
    expect(artifactDir(rfid)).toBe(
      join(
        "honeywell-rfid-repository",
        "com",
        "honeywell",
        "rfid",
        "honeywell-rfid-sdk",
        "1.1.0",
      ),
    );
    expect(artifactDir(dataCollection)).toBe(
      join(
        "honeywell-rfid-repository",
        "com",
        "honeywell",
        "aidc",
        "datacollection",
        "1.97.00.0060",
      ),
    );
    const rfidDir = join(root, "android", artifactDir(rfid));
    const aidcDir = join(root, "android", artifactDir(dataCollection));
    expect(
      readFileSync(join(rfidDir, "honeywell-rfid-sdk-1.1.0.aar"), "utf8"),
    ).toBe("rfid bytes");
    expect(
      readFileSync(join(aidcDir, "datacollection-1.97.00.0060.aar"), "utf8"),
    ).toBe("aidc bytes");
    expect(
      readFileSync(join(aidcDir, "datacollection-1.97.00.0060.pom"), "utf8"),
    ).toContain("<groupId>com.honeywell.aidc</groupId>");
    expect(() =>
      copySdk(root, join(root, "android"), dataCollection, "./missing.aar"),
    ).toThrow(/dataCollectionAarPath: .* does not exist/);
    expect(existsSync(join(root, "missing.aar"))).toBe(false);
  });
});

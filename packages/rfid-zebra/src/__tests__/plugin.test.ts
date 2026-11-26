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

type Sdk = { option: string; group: string; artifact: string; version: string };
type Properties = { type: string; key?: string; value?: string }[];
type Plugin = ((config: ExpoConfig, options?: unknown) => ExpoConfig) & {
  internal: {
    addRepository(buildGradle: string): string;
    raiseMinSdk(properties: Properties): Properties;
    copySdk(
      projectRoot: string,
      platformRoot: string,
      sdk: Sdk,
      aarPath: string,
    ): void;
    artifactDir(sdk: Sdk): string;
    SDK: Sdk;
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
  const projectRoot = mkdtempSync(join(tmpdir(), "rfid-zebra-plugin-"));
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
  const application = results.manifest.manifest.application[0];
  return {
    permissions: (results.manifest.manifest["uses-permission"] ?? []).map(
      (p: { $: Record<string, string> }) => p.$,
    ),
    libraries: (application["uses-library"] ?? []).map(
      (l: { $: Record<string, string> }) => l.$,
    ),
    properties: results.gradleProperties as Properties,
    application: application.$ as Record<string, string>,
  };
}

const OPTIONS = { aarPath: "./zebra/rfidapi3lib-2.0.5.297.aar" };

describe("@its/rfid-zebra config plugin", () => {
  it("requires the app's copy of the SDK", () => {
    expect(() => plugin({ name: "a", slug: "a" }, {} as never)).toThrow(
      /aarPath is required/,
    );
  });

  it("declares the nearby devices permissions, and caps the SDK's location at Android 11", async () => {
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
          "tools:node": "replace",
        },
        {
          "android:name": "android.permission.ACCESS_COARSE_LOCATION",
          "android:maxSdkVersion": "30",
          "tools:node": "replace",
        },
      ]),
    );
  });

  it("declares Qualcomm's library optional, once", async () => {
    const { libraries } = await prebuild(OPTIONS);
    expect(libraries).toEqual([
      { "android:name": "com.qti.qrs.qc_sdk", "android:required": "false" },
    ]);
  });

  it("keeps the app's allowBackup over the SDK's", async () => {
    const { application } = await prebuild(OPTIONS);
    expect(application["tools:replace"]).toBe("android:allowBackup");
  });

  it("raises minSdkVersion to the SDK's 29, never lowers it", () => {
    const { raiseMinSdk } = plugin.internal;
    expect(raiseMinSdk([])).toEqual([
      { type: "property", key: "android.minSdkVersion", value: "29" },
    ]);
    expect(
      raiseMinSdk([
        { type: "property", key: "android.minSdkVersion", value: "24" },
      ]),
    ).toEqual([
      { type: "property", key: "android.minSdkVersion", value: "29" },
    ]);
    expect(
      raiseMinSdk([
        { type: "property", key: "android.minSdkVersion", value: "31" },
      ]),
    ).toEqual([
      { type: "property", key: "android.minSdkVersion", value: "31" },
    ]);
  });

  it("writes minSdkVersion through a prebuild", async () => {
    const { properties } = await prebuild(OPTIONS);
    expect(properties).toContainEqual({
      type: "property",
      key: "android.minSdkVersion",
      value: "29",
    });
  });

  it("declares the SDK's repository once, for its group only", () => {
    const { addRepository } = plugin.internal;
    const once = addRepository(TEMPLATE_BUILD_GRADLE);
    expect(addRepository(once)).toBe(once);
    expect(once).toContain(`allprojects {
  repositories {
    // @its/rfid-zebra: the app's copy of Zebra's RFID SDK
    maven {
      url = uri("$rootDir/zebra-rfid-repository")
      content {
        includeGroup("com.zebra.rfid")
      }
    }
    google()`);
    // Not in buildscript: only the app and the module resolve the SDK.
    expect(once.indexOf("zebra-rfid-repository")).toBeGreaterThan(
      once.indexOf("allprojects"),
    );
    expect(() => addRepository("android {}")).toThrow(/allprojects/);
  });

  it("copies the SDK into a Maven layout with its POM", () => {
    const { copySdk, artifactDir, SDK } = plugin.internal;
    const root = mkdtempSync(join(tmpdir(), "rfid-zebra-copy-"));
    mkdirSync(join(root, "android"));
    writeFileSync(join(root, "sdk.aar"), "zebra bytes");
    copySdk(root, join(root, "android"), SDK, "./sdk.aar");
    expect(artifactDir(SDK)).toBe(
      join(
        "zebra-rfid-repository",
        "com",
        "zebra",
        "rfid",
        "rfidapi3lib",
        "2.0.5.297",
      ),
    );
    const dir = join(root, "android", artifactDir(SDK));
    expect(readFileSync(join(dir, "rfidapi3lib-2.0.5.297.aar"), "utf8")).toBe(
      "zebra bytes",
    );
    expect(
      readFileSync(join(dir, "rfidapi3lib-2.0.5.297.pom"), "utf8"),
    ).toContain("<artifactId>rfidapi3lib</artifactId>");
    expect(() =>
      copySdk(root, join(root, "android"), SDK, "./missing.aar"),
    ).toThrow(/aarPath: .* does not exist/);
    expect(existsSync(join(root, "missing.aar"))).toBe(false);
  });
});

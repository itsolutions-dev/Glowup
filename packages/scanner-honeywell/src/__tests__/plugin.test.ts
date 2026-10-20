/**
 * The config plugin: the build.gradle edit and the SDK's copy on their own
 * (introspection runs neither file mod), and the option it requires.
 */
import { compileModsAsync } from "expo/config-plugins";
import type { ExpoConfig } from "expo/config";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type Sdk = {
  option: string;
  group: string;
  artifact: string;
  version: string;
};
type Plugin = ((config: ExpoConfig, options?: unknown) => ExpoConfig) & {
  internal: {
    addRepository(buildGradle: string): string;
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

describe("@its/scanner-honeywell config plugin", () => {
  it("requires the app's copy of the Data Collection SDK", () => {
    expect(() => plugin({ name: "a", slug: "a" }, {})).toThrow(
      /dataCollectionAarPath is required/,
    );
    expect(() =>
      plugin({ name: "a", slug: "a" }, { dataCollectionAarPath: " " }),
    ).toThrow(/dataCollectionAarPath is required/);
  });

  it("adds no permission and leaves minSdkVersion alone: the SDK's manifest carries them", async () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "scanner-honeywell-"));
    const config = await compileModsAsync(
      plugin(
        { name: "a", slug: "a", android: { package: "com.example.app" } },
        { dataCollectionAarPath: "./dc.aar" },
      ),
      {
        projectRoot,
        introspect: true,
        platforms: ["android"],
        assertMissingModProviders: false,
      },
    );
    const results = config._internal!.modResults.android;
    const permissions = (
      results.manifest.manifest["uses-permission"] ?? []
    ).map((p: { $: Record<string, string> }) => p.$["android:name"]);
    expect(
      permissions.filter((name: string) => /honeywell/.test(name)),
    ).toEqual([]);
    const properties = (results.gradleProperties ?? []) as { key?: string }[];
    expect(properties.map((p) => p.key)).not.toContain("android.minSdkVersion");
  });

  it("depends on the same coordinate as @its/rfid-honeywell (C5)", () => {
    expect(plugin.internal.SDK).toMatchObject({
      group: "com.honeywell.aidc",
      artifact: "datacollection",
      version: "1.97.00.0060",
    });
    const gradle = readFileSync(
      join(__dirname, "..", "..", "android", "build.gradle"),
      "utf8",
    );
    expect(gradle).toContain(
      "implementation 'com.honeywell.aidc:datacollection:1.97.00.0060'",
    );
  });

  it("declares the SDK's repository once, for its group only", () => {
    const { addRepository } = plugin.internal;
    const once = addRepository(TEMPLATE_BUILD_GRADLE);
    expect(addRepository(once)).toBe(once);
    expect(once).toContain(`allprojects {
  repositories {
    // @its/scanner-honeywell: the app's copy of the Honeywell Data Collection SDK
    maven {
      url = uri("$rootDir/honeywell-scanner-repository")
      content {
        includeGroup("com.honeywell.aidc")
      }
    }
    google()`);
    // Not in buildscript: only the app and the module resolve the SDK.
    expect(once.indexOf("honeywell-scanner-repository")).toBeGreaterThan(
      once.indexOf("allprojects"),
    );
    expect(() => addRepository("android {}")).toThrow(/allprojects/);
  });

  it("copies the SDK into a Maven layout with its POM", () => {
    const { copySdk, artifactDir, SDK } = plugin.internal;
    const root = mkdtempSync(join(tmpdir(), "scanner-honeywell-copy-"));
    mkdirSync(join(root, "android"));
    writeFileSync(join(root, "dc.aar"), "aidc bytes");
    copySdk(root, join(root, "android"), SDK, "./dc.aar");
    expect(artifactDir(SDK)).toBe(
      join(
        "honeywell-scanner-repository",
        "com",
        "honeywell",
        "aidc",
        "datacollection",
        "1.97.00.0060",
      ),
    );
    const dir = join(root, "android", artifactDir(SDK));
    expect(
      readFileSync(join(dir, "datacollection-1.97.00.0060.aar"), "utf8"),
    ).toBe("aidc bytes");
    expect(
      readFileSync(join(dir, "datacollection-1.97.00.0060.pom"), "utf8"),
    ).toContain("<artifactId>datacollection</artifactId>");
    expect(() =>
      copySdk(root, join(root, "android"), SDK, "./missing.aar"),
    ).toThrow(/dataCollectionAarPath: .* does not exist/);
    expect(existsSync(join(root, "missing.aar"))).toBe(false);
  });
});

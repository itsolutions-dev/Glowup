import type { ConfigPlugin } from "expo/config-plugins";
import { withSettingsGradle } from "expo/config-plugins";
import type { ExpoConfig } from "expo/config";

/**
 * One build per vendor (plan R13): `RFID_VENDOR` picks it, Honeywell by
 * default. The vendors' SDKs are not in this repository: put your copies at
 * the default paths below (git ignores them) or point the variables at them.
 *
 * - `honeywell`: HONEYWELL_RFID_AAR, HONEYWELL_DATACOLLECTION_AAR
 * - `zebra`: ZEBRA_RFID_AAR
 */
export const VENDORS = {
  honeywell: {
    label: "Honeywell",
    plugin: [
      "@its/rfid-honeywell",
      {
        aarPath:
          process.env.HONEYWELL_RFID_AAR ??
          "./honeywell/honeywell_rfid_sdk_v1.1.0.aar",
        dataCollectionAarPath:
          process.env.HONEYWELL_DATACOLLECTION_AAR ??
          "./honeywell/DataCollection.aar",
      },
    ],
  },
  zebra: {
    label: "Zebra",
    plugin: [
      "@its/rfid-zebra",
      {
        aarPath:
          process.env.ZEBRA_RFID_AAR ?? "./zebra/rfidapi3lib-2.0.5.297.aar",
      },
    ],
  },
} as const;

export type Vendor = keyof typeof VENDORS;

export function vendorOf(value: string | undefined): Vendor {
  const vendor = value ?? "honeywell";
  if (!(vendor in VENDORS)) {
    throw new Error(
      `RFID_VENDOR is ${vendor}: use ${Object.keys(VENDORS).join(" or ")}.`,
    );
  }
  return vendor as Vendor;
}

const EXCLUDE_MARKER = "// @its/rfid-diagnostics: one vendor per build";
const AUTOLINK = "expoAutolinking.useExpoModules()";

/**
 * settings.gradle with the other vendors' modules left out of autolinking:
 * the app depends on every vendor package, and a vendor's module does not
 * build without its SDK.
 */
export function excludeFromAutolinking(
  settingsGradle: string,
  packages: string[],
): string {
  if (settingsGradle.includes(EXCLUDE_MARKER)) return settingsGradle;
  if (!settingsGradle.includes(AUTOLINK)) {
    throw new Error(
      `android/settings.gradle has no ${AUTOLINK} to exclude ${packages.join(", ")} from.`,
    );
  }
  const list = packages.map((name) => `"${name}"`).join(", ");
  return settingsGradle.replace(
    AUTOLINK,
    `${EXCLUDE_MARKER}\nexpoAutolinking.exclude = [${list}]\n${AUTOLINK}`,
  );
}

const withOnlyVendor: ConfigPlugin<Vendor> = (config, vendor) =>
  withSettingsGradle(config, (mod) => {
    const others = (Object.keys(VENDORS) as Vendor[])
      .filter((other) => other !== vendor)
      .map((other) => VENDORS[other].plugin[0]);
    mod.modResults.contents = excludeFromAutolinking(
      mod.modResults.contents,
      others,
    );
    return mod;
  });

const vendor = vendorOf(process.env.RFID_VENDOR);

const config: ExpoConfig = {
  name: `RFID diagnostics (${VENDORS[vendor].label})`,
  slug: "rfid-diagnostics",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  platforms: ["android"],
  android: {
    package: "it.itsolutions.rfiddiagnostics",
  },
  plugins: [VENDORS[vendor].plugin as [string, object]],
};

export default withOnlyVendor(config, vendor);

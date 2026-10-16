import type { ExpoConfig } from "expo/config";

// The Honeywell RFID SDK is not in this repository: its licence lets it
// travel only inside an app's build. Put your copy at the default path below
// (git ignores it) or point HONEYWELL_RFID_AAR at it.
const aarPath =
  process.env.HONEYWELL_RFID_AAR ?? "./honeywell/honeywell_rfid_sdk_v1.1.0.aar";

const config: ExpoConfig = {
  name: "RFID diagnostics",
  slug: "rfid-diagnostics",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  platforms: ["android"],
  android: {
    package: "it.itsolutions.rfiddiagnostics",
  },
  plugins: [["@its/rfid-honeywell", { aarPath }]],
};

export default config;

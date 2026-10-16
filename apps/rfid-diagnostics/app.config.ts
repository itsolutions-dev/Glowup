import type { ExpoConfig } from "expo/config";

// The Honeywell SDKs are not in this repository: their licence lets them
// travel only inside an app's build. Put your copies at the default paths below
// (git ignores them) or point HONEYWELL_RFID_AAR / HONEYWELL_DATACOLLECTION_AAR
// at them.
const aarPath =
  process.env.HONEYWELL_RFID_AAR ?? "./honeywell/honeywell_rfid_sdk_v1.1.0.aar";
const dataCollectionAarPath =
  process.env.HONEYWELL_DATACOLLECTION_AAR ?? "./honeywell/DataCollection.aar";

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
  plugins: [["@its/rfid-honeywell", { aarPath, dataCollectionAarPath }]],
};

export default config;

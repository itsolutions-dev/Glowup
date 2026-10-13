import { Platform } from "react-native";

import { netInfoNetworkAdapter } from "./netinfo";
import { webNetworkAdapter } from "./web";

/** What the hooks use when no `DeviceAdaptersProvider` sets `network`. */
export const defaultNetworkAdapter =
  Platform.OS === "web" ? webNetworkAdapter : netInfoNetworkAdapter;

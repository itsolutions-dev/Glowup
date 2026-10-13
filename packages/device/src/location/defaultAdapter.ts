import { Platform } from "react-native";

import { expoLocationAdapter } from "./expo";
import { webLocationAdapter } from "./web";

/** What the hooks use when no `DeviceAdaptersProvider` sets `location`. */
export const defaultLocationAdapter =
  Platform.OS === "web" ? webLocationAdapter : expoLocationAdapter;

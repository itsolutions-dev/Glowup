/**
 * What Metro bundles for `./expo` on the web, in place of `expo.ts`:
 * expo-media-library's default entry throws at import in a browser
 * (`requireNativeModule('ExpoMediaLibraryNext')`), and importing it would
 * break every page that loads this subpath. The web has no photo library,
 * so the "Expo" adapter there is the web one.
 */
import type * as Native from "./expo";
import { createWebMediaLibraryAdapter, webMediaLibraryAdapter } from "./web";

export const createExpoMediaLibraryAdapter: typeof Native.createExpoMediaLibraryAdapter =
  createWebMediaLibraryAdapter;

export const expoMediaLibraryAdapter: typeof Native.expoMediaLibraryAdapter =
  webMediaLibraryAdapter;

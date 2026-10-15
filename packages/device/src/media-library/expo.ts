import {
  Asset,
  getPermissionsAsync,
  requestPermissionsAsync,
} from "expo-media-library";
import { Platform } from "react-native";

import { toPermissionState } from "../core/permissions";
import { errorDetail } from "../core/shared";
import type { PermissionState } from "../core/types";
import type { MediaLibraryAdapter, SaveResult } from "./types";

/**
 * The native default, on expo-media-library's object API (`Asset.create`,
 * which keeps the original file). A browser never loads this file: Metro
 * picks `expo.web.ts` there, because the module throws at import in a
 * browser (`requireNativeModule('ExpoMediaLibraryNext')`).
 *
 * iOS saves with add-only access (`NSPhotoLibraryAddUsageDescription`),
 * which `Asset.create` checks but never asks for. Android 11 and later save
 * through MediaStore without a permission; before, expo copies the file into
 * shared storage and needs `WRITE_EXTERNAL_STORAGE`. expo's write-only
 * request still asks for it on 11 and 12, where it grants nothing, so it is
 * not called there.
 */

const GRANTED: PermissionState = { status: "granted", canAskAgain: false };

function requiresPermission(): boolean {
  return (
    Platform.OS === "ios" ||
    (Platform.OS === "android" && Number(Platform.Version) < 30)
  );
}

function toFailure(error: unknown): SaveResult {
  return { status: "failed", detail: errorDetail(error) };
}

export const expoMediaLibraryAdapter: MediaLibraryAdapter = {
  isSupported: () => true,
  requiresPermission,
  async getPermission() {
    if (!requiresPermission()) return GRANTED;
    return toPermissionState(await getPermissionsAsync(true));
  },
  async requestPermission() {
    if (!requiresPermission()) return GRANTED;
    return toPermissionState(await requestPermissionsAsync(true));
  },
  async save(uri) {
    try {
      const asset = await Asset.create(uri);
      return { status: "saved", assetId: asset.id };
    } catch (error) {
      return toFailure(error);
    }
  },
};

import type { Unsubscribe } from "../core/types";

/**
 * The interface's orientation (how the app is drawn), not the device's: an
 * app held in portrait reads portrait whichever way the phone is turned.
 * Left and right are named as iOS names its interface orientations.
 */
export type Orientation =
  | "portrait-up"
  | "portrait-down"
  | "landscape-left"
  | "landscape-right"
  | "unknown";

/**
 * - `any`: rotate freely, as the device allows (not upside down on iPhones
 *   without a home button).
 * - `portrait`: upright portrait.
 * - `landscape`: either landscape side, following the sensor.
 * - `landscape-left` / `landscape-right`: one landscape side.
 */
export type OrientationLock =
  "any" | "portrait" | "landscape" | "landscape-left" | "landscape-right";

/** The contract between the orientation hooks and the platform. */
export interface OrientationAdapter {
  /** Whether the orientation can be read here. */
  isSupported(): boolean;
  getOrientation(): Promise<Orientation>;
  subscribe(listener: (orientation: Orientation) => void): Unsubscribe;
  /** Whether `lock()` can work here at all (it may still be refused). */
  supportsLock(): boolean;
  /** Rejects with an `OrientationError`. */
  lock(lock: OrientationLock): Promise<void>;
  /**
   * Gives the orientation back to the app's own configuration (what it was
   * before the first `lock()`), not to "anything goes". Never throws.
   */
  unlock(): Promise<void>;
}

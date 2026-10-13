import type { Unsubscribe } from "../core/types";

export type BiometricType = "fingerprint" | "face" | "iris";

/**
 * The strongest method enrolled on the device.
 *
 * - `none`: no lock screen at all; nothing can be prompted.
 * - `passcode`: a PIN, pattern or password, but no biometrics.
 * - `biometric-weak`: Android class 2 biometrics, such as a camera-based
 *   face unlock. iOS has none.
 * - `biometric-strong`: Android class 3 (fingerprint, 3D face), every iOS
 *   Touch ID and Face ID.
 */
export type BiometricLevel =
  "none" | "passcode" | "biometric-weak" | "biometric-strong";

export interface BiometricStatus {
  /** A fingerprint, face or iris sensor exists. */
  hasHardware: boolean;
  /** Biometrics are enrolled (on Android, at least weak ones). */
  isEnrolled: boolean;
  /** The sensors the device has, enrolled or not. */
  types: readonly BiometricType[];
  level: BiometricLevel;
}

export interface AuthenticateOptions {
  /** The prompt's title. Required: the platform default is English. */
  promptMessage: string;
  /**
   * The cancel button's label. Required for the same reason (expo replaces
   * a missing one with "Cancel"). Android shows it only with
   * `fallback: "none"`; with the passcode fallback the system draws its own.
   */
  cancelLabel: string;
  /**
   * `passcode` (default): the device PIN, pattern or password is offered
   * when biometrics fail or are missing. `none`: biometrics only; the result
   * is `fallback` when the user asks for another way (iOS), and a locked-out
   * user stays locked out, so the app needs a way in of its own.
   */
  fallback?: "passcode" | "none";
  /** iOS: the "Enter Passcode" button's label; `""` hides it. */
  fallbackLabel?: string;
  /** Android: a line under the title. */
  subtitle?: string;
  /** Android: a paragraph in the prompt's body. */
  description?: string;
  /**
   * Android: which biometrics may answer. `weak` (default) admits class 2,
   * such as a camera-based face unlock; `strong` only class 3. On Android 9
   * and 10 `strong` cannot be combined with the passcode fallback, so there
   * it prompts for biometrics only. iOS biometrics are all strong.
   */
  strength?: "weak" | "strong";
}

/**
 * Why an authentication did not succeed.
 *
 * - `cancelled`: the user, the app or the system dismissed the prompt (the
 *   app going to the background, an incoming call).
 * - `fallback`: with `fallback: "none"`, the user chose the iOS "Enter
 *   Password" button: offer the app's own way in.
 * - `lockout`: too many failed attempts; biometrics are disabled until the
 *   device is unlocked with its passcode.
 * - `not-enrolled`: nothing to authenticate with (no biometrics, or with the
 *   passcode fallback no lock screen either).
 * - `unavailable`: the sensor is busy or missing, or Face ID has no purpose
 *   string (see the config plugin's `biometrics.faceIDPermission`).
 * - `busy`: another authentication is still running; this one never started.
 * - `unsupported`: the platform has no local authentication (web).
 * - `failed`: anything else, such as an unrecognised attempt the platform
 *   gave up on.
 */
export type BiometricErrorCode =
  | "cancelled"
  | "fallback"
  | "lockout"
  | "not-enrolled"
  | "unavailable"
  | "busy"
  | "unsupported"
  | "failed";

/**
 * `success: true` says the device owner is present: with the passcode
 * fallback they may have typed their PIN rather than shown a finger. It is a
 * local gate, not proof of identity to a server.
 */
export type BiometricResult =
  | { success: true }
  | {
      success: false;
      error: BiometricErrorCode;
      /** The platform's own code and message, for logs. Not for display. */
      detail?: string;
    };

export interface BiometricsAdapter {
  isSupported(): boolean;
  /** Resolves on failure too, with what could not be read as absent. */
  getStatus(): Promise<BiometricStatus>;
  /** Resolves with the outcome; never rejects for one. */
  authenticate(options: AuthenticateOptions): Promise<BiometricResult>;
  /** Dismisses the running prompt where the platform allows it (Android). */
  cancel(): Promise<void>;
  /**
   * Optional: status changes the adapter learns of by itself. The hooks also
   * read the status again whenever the app returns to the foreground.
   */
  subscribe?(listener: (status: BiometricStatus) => void): Unsubscribe;
}

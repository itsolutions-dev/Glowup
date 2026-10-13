/**
 * `@its/glowup-device` — the root entry carries only what every capability
 * shares: the permission model and the subscription type. It imports no native
 * module, so depending on the package costs nothing until an app imports a
 * capability subpath (`/info`, `/location`, `/camera`), each of which brings
 * its own Expo peer.
 */
export type { PermissionState, PermissionStatus, Unsubscribe } from "./core";

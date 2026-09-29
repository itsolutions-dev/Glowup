import { tone } from "./tonal";

/**
 * Success roles, which Material 3 does not define. Like `error` they are kept
 * off the seed — a red brand must not turn "done" red — so they come from a
 * fixed green hue through the same tones M3 gives the error roles.
 */
const SUCCESS_HUE = 142;
const successTone = (t: number) => tone(SUCCESS_HUE, 48, t);

export interface SuccessRoles {
  success: string;
  onSuccess: string;
  successContainer: string;
  onSuccessContainer: string;
}

const SUCCESS_ROLES: { light: SuccessRoles; dark: SuccessRoles } = {
  light: {
    success: successTone(40),
    onSuccess: successTone(100),
    successContainer: successTone(90),
    onSuccessContainer: successTone(10),
  },
  dark: {
    success: successTone(80),
    onSuccess: successTone(20),
    successContainer: successTone(30),
    onSuccessContainer: successTone(90),
  },
};

/** The fixed success roles for a scheme. Internal: read by `Button`'s `tone`. */
export const getSuccessRoles = (isDark: boolean): SuccessRoles =>
  isDark ? SUCCESS_ROLES.dark : SUCCESS_ROLES.light;

/**
 * Warning, the other feedback colour Material 3 leaves out: an amber hue, off
 * the seed for the same reason as success. Only the container pair exists,
 * because only badges and banners need it.
 */
const WARNING_HUE = 80;
const warningTone = (t: number) => tone(WARNING_HUE, 48, t);

export interface WarningRoles {
  warningContainer: string;
  onWarningContainer: string;
}

const WARNING_ROLES: { light: WarningRoles; dark: WarningRoles } = {
  light: {
    warningContainer: warningTone(90),
    onWarningContainer: warningTone(10),
  },
  dark: {
    warningContainer: warningTone(30),
    onWarningContainer: warningTone(90),
  },
};

/** The fixed warning roles for a scheme. Internal: read by `StatusBadge`. */
export const getWarningRoles = (isDark: boolean): WarningRoles =>
  isDark ? WARNING_ROLES.dark : WARNING_ROLES.light;

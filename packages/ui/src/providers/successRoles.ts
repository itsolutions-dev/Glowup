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

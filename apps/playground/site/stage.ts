/** Widths the stage can be pinned to, so a reader can see the mobile case. */
export const STAGE_WIDTHS = {
  phone: 360,
  tablet: 720,
  full: undefined,
} as const;

export type StageWidth = keyof typeof STAGE_WIDTHS;

/** The options of the stage's width switch, shared by every stage on the site. */
export const STAGE_WIDTH_OPTIONS = [
  { value: "phone", icon: "cellphone", label: "360" },
  { value: "tablet", icon: "tablet", label: "720" },
  { value: "full", icon: "monitor", label: "Full" },
] as const;

import type { ViewStyle } from "react-native";
import { ToggleButtonGroup } from "@its/glowup-ui";

/** Widths a stage can be pinned to, so a reader can see the mobile case. */
const STAGE_WIDTHS = {
  phone: 360,
  tablet: 720,
  full: undefined,
} as const;

export type StageWidth = keyof typeof STAGE_WIDTHS;

/** The 360 / 720 / Full picker above a component's or a template's stage. */
export const StageWidthPicker = ({
  value,
  onChange,
}: {
  value: StageWidth;
  onChange: (value: StageWidth) => void;
}) => (
  <ToggleButtonGroup
    accessibilityLabel="Stage width"
    value={value}
    onValueChange={(next) => onChange(next as StageWidth)}
    options={[
      { value: "phone", icon: "cellphone", label: "360" },
      { value: "tablet", icon: "tablet", label: "720" },
      { value: "full", icon: "monitor", label: "Full" },
    ]}
  />
);

/**
 * The stage's own width for a pinned size. A fixed width, not a cap:
 * `alignSelf` takes the stage out of the column's stretch, so a maxWidth alone
 * let it shrink-wrap its content and 360 and 720 rendered identically.
 * maxWidth "100%" keeps it inside the column on a narrow screen.
 */
export const stageWidthStyle = (width: StageWidth): ViewStyle | undefined =>
  STAGE_WIDTHS[width] === undefined
    ? undefined
    : { width: STAGE_WIDTHS[width], maxWidth: "100%", alignSelf: "center" };

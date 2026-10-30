import { Platform } from "react-native";
import type { AccessibilityState, AccessibilityValue } from "react-native";

// "Selected" means a different attribute per role: only these roles take
// aria-selected; a radio is checked, a toggle button pressed, a link current.
const SELECTABLE = new Set([
  "tab",
  "option",
  "gridcell",
  "row",
  "treeitem",
  "columnheader",
  "rowheader",
]);
const CHECKABLE = new Set([
  "checkbox",
  "radio",
  "switch",
  "menuitemcheckbox",
  "menuitemradio",
]);
// The value attributes are only valid on a range.
const RANGES = new Set([
  "adjustable",
  "slider",
  "progressbar",
  "spinbutton",
  "scrollbar",
  "meter",
]);

const selectedAttr = (role: string, selected: boolean) => {
  if (SELECTABLE.has(role)) return { "aria-selected": selected };
  if (CHECKABLE.has(role)) return { "aria-checked": selected };
  if (role === "button" || role === "togglebutton")
    return { "aria-pressed": selected };
  if (role === "link") return selected ? { "aria-current": "page" } : {};
  return {};
};

const checkedAttr = (role: string, checked: boolean | "mixed") =>
  role === "button" || role === "togglebutton"
    ? { "aria-pressed": checked }
    : { "aria-checked": checked };

/**
 * The accessibility state of a control, for every platform. iOS and Android
 * read `accessibilityState` and `accessibilityValue`; react-native-web reads
 * neither (only `aria-*`), so on the web the same state is also spread as the
 * aria attributes its `role` takes. Spread the result on the element:
 * `{...a11yState("checkbox", { checked, disabled })}`.
 */
export const a11yState = (
  role: string | undefined,
  state?: AccessibilityState,
  value?: AccessibilityValue,
): Record<string, unknown> => {
  const native = { accessibilityState: state, accessibilityValue: value };
  if (Platform.OS !== "web") return native;
  const r = role ?? "";
  const aria: Record<string, unknown> = {};
  if (state?.disabled !== undefined) aria["aria-disabled"] = state.disabled;
  if (state?.expanded !== undefined) aria["aria-expanded"] = state.expanded;
  if (state?.busy !== undefined) aria["aria-busy"] = state.busy;
  if (state?.selected !== undefined)
    Object.assign(aria, selectedAttr(r, state.selected));
  // Checked wins over selected when a control sets both.
  if (state?.checked !== undefined)
    Object.assign(aria, checkedAttr(r, state.checked));
  if (value && RANGES.has(r)) {
    if (value.min !== undefined) aria["aria-valuemin"] = value.min;
    if (value.max !== undefined) aria["aria-valuemax"] = value.max;
    if (value.now !== undefined) aria["aria-valuenow"] = value.now;
    if (value.text !== undefined) aria["aria-valuetext"] = value.text;
  }
  return { ...native, ...aria };
};

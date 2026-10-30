import { useId } from "react";
import { Platform } from "react-native";

/**
 * Ties a text field to the label drawn above it, on Android: TalkBack reads a
 * filled edit box as its text and drops its description, so only `labelFor`
 * (`accessibilityLabelledBy`) keeps the label in what it says. It replaces the
 * field's `accessibilityLabel` there, which TalkBack would say a second time
 * ("Username. Edit box for Username"): spread `input` after it. iOS and the
 * web read `accessibilityLabel`, and get no id: `useId()` must not reach their
 * output (see packages/ui/CLAUDE.md).
 */
export const useFieldLabel = () => {
  const id = useId();
  return Platform.OS === "android"
    ? {
        label: { nativeID: id },
        input: { accessibilityLabelledBy: id, accessibilityLabel: undefined },
      }
    : { label: {}, input: {} };
};

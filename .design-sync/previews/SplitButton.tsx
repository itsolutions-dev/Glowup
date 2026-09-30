import React from "react";
import { SplitButton } from "@its/glowup-ui";

const row: React.CSSProperties = {
  display: "flex",
  gap: 16,
  alignItems: "center",
};

const SAVE_ITEMS = [
  { id: "copy", label: "Save a copy", icon: "content-copy", onPress: () => {} },
  {
    id: "draft",
    label: "Save as draft",
    icon: "file-outline",
    onPress: () => {},
  },
  {
    id: "discard",
    label: "Discard",
    icon: "delete-outline",
    destructive: true,
    dividerAbove: true,
    onPress: () => {},
  },
] as const;

export const Filled = () => (
  <SplitButton
    iconName="content-save-outline"
    items={[...SAVE_ITEMS]}
    onPress={() => {}}
    menuAccessibilityLabel="More save options"
  >
    Save
  </SplitButton>
);

export const Modes = () => (
  <div style={row}>
    {(["filled", "tonal", "outlined"] as const).map((mode) => (
      <SplitButton
        key={mode}
        mode={mode}
        items={[...SAVE_ITEMS]}
        onPress={() => {}}
        menuAccessibilityLabel="More save options"
      >
        Save
      </SplitButton>
    ))}
  </div>
);

export const Disabled = () => (
  <SplitButton
    disabled
    iconName="send-outline"
    items={[
      {
        id: "schedule",
        label: "Schedule send",
        icon: "clock-outline",
        onPress: () => {},
      },
    ]}
    onPress={() => {}}
    menuAccessibilityLabel="More send options"
  >
    Send
  </SplitButton>
);

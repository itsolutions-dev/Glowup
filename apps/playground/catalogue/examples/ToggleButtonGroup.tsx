import { useState } from "react";
import {
  ToggleButtonGroup,
  Typography,
  VStack,
  type ToggleButtonGroupProps,
  type ToggleButtonOption,
} from "@its/glowup-ui";

const props: Partial<ToggleButtonGroupProps> = {
  multiSelect: true,
};

const STYLES: ToggleButtonOption[] = [
  { value: "bold", label: "Bold", icon: "format-bold" },
  { value: "italic", label: "Italic", icon: "format-italic" },
  { value: "underline", label: "Underline", icon: "format-underline" },
];

export default function ToggleButtonGroupExample() {
  const [value, setValue] = useState<string | string[]>(["bold"]);
  const picked = [value].flat();

  return (
    <VStack spacing="s">
      <Typography variant="titleMedium">Format</Typography>
      <ToggleButtonGroup
        accessibilityLabel="Text style"
        {...props}
        options={STYLES}
        value={value}
        onValueChange={setValue}
      />
      <Typography
        variant="bodyLarge"
        style={{
          fontWeight: picked.includes("bold") ? "bold" : "normal",
          fontStyle: picked.includes("italic") ? "italic" : "normal",
          textDecorationLine: picked.includes("underline")
            ? "underline"
            : "none",
        }}
      >
        The quick brown fox jumps over the lazy dog.
      </Typography>
    </VStack>
  );
}

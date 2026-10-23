import { useState } from "react";
import { View } from "react-native";
import {
  Box,
  FAB,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
  type ToolbarProps,
} from "@its/glowup-ui";

const props: Partial<ToolbarProps> = {
  variant: "floating",
  accessibilityLabel: "Formatting",
};

const FORMATS = [
  { id: "bold", icon: "format-bold" },
  { id: "italic", icon: "format-italic" },
  { id: "underline", icon: "format-underline" },
] as const;

export default function ToolbarExample() {
  const { theme } = useTheme();
  const [on, setOn] = useState<string[]>(["bold"]);

  const toggle = (id: string) =>
    setOn((list) =>
      list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
    );

  return (
    <Box
      background="surface"
      radius="large"
      borderWidth={1}
      borderColor="outlineVariant"
      height={420}
      style={{ overflow: "hidden" }}
    >
      <Box padding={theme.spacing.m} gap={theme.spacing.s}>
        <Typography variant="titleMedium">Trip notes</Typography>
        <Typography
          variant="bodyLarge"
          style={{
            fontWeight: on.includes("bold") ? "bold" : "normal",
            fontStyle: on.includes("italic") ? "italic" : "normal",
            textDecorationLine: on.includes("underline") ? "underline" : "none",
          }}
        >
          Book the 9:40 train to Turin, then the hotel near the station. Ask
          Lena for the restaurant she mentioned.
        </Typography>
      </Box>
      {/* The toolbar lays its actions out; the screen decides where it sits. */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          paddingBottom: props.variant === "floating" ? theme.spacing.m : 0,
        }}
      >
        <Toolbar
          {...props}
          safeArea={false}
          fab={
            <FAB
              icon="format-clear"
              label="Clear formatting"
              placement="inline"
              onClick={() => setOn([])}
            />
          }
        >
          {FORMATS.map(({ id, icon }) => (
            <IconButton
              key={id}
              icon={icon}
              accessibilityLabel={id}
              selected={on.includes(id)}
              onClick={() => toggle(id)}
            />
          ))}
        </Toolbar>
      </View>
    </Box>
  );
}

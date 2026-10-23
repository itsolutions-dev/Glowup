import { useState } from "react";
import {
  Avatar,
  ToggleButton,
  Typography,
  VStack,
  type ToggleButtonProps,
} from "@its/glowup-ui";

const props: Partial<ToggleButtonProps> = {
  label: "Mute",
  icon: "microphone-off",
  isFirst: true,
  isLast: true,
};

export default function ToggleButtonExample() {
  const [muted, setMuted] = useState(false);

  return (
    <VStack spacing="m" align="center">
      <Avatar name="Weekly sync" size="large" />
      <VStack spacing="xs" align="center">
        <Typography variant="titleMedium">Weekly sync</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {muted ? "Your microphone is off." : "Everyone can hear you."}
        </Typography>
      </VStack>
      <ToggleButton
        {...props}
        active={muted}
        onPress={() => setMuted(!muted)}
      />
    </VStack>
  );
}

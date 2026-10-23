import { useState } from "react";
import {
  AbsoluteCenter,
  Box,
  Chip,
  IconButton,
  Typography,
  useTheme,
  type AbsoluteCenterProps,
} from "@its/glowup-ui";

const props: Partial<AbsoluteCenterProps> = {
  axis: "both",
};

export default function AbsoluteCenterExample() {
  const { theme } = useTheme();
  const [playing, setPlaying] = useState(false);

  return (
    <Box
      height={220}
      padding={theme.spacing.m}
      radius="large"
      background="primaryContainer"
      align="flex-start"
      justify="space-between"
      style={{ overflow: "hidden" }}
    >
      {/* In the flow: it stays at the corners whatever the layer does. */}
      <Chip label="Webinar" icon="video-outline" variant="tonal" />
      <Typography variant="titleMedium" color="onPrimaryContainer">
        Planning a quarter · 24 min
      </Typography>

      {/* Out of the flow: centred on the card, and the layer lets presses through. */}
      <AbsoluteCenter {...props}>
        <IconButton
          icon={playing ? "pause" : "play"}
          variant="filled"
          size="large"
          accessibilityLabel={playing ? "Pause video" : "Play video"}
          onClick={() => setPlaying(!playing)}
        />
      </AbsoluteCenter>
    </Box>
  );
}

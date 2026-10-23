import { useState } from "react";
import {
  AspectRatio,
  Button,
  Card,
  Icon,
  Typography,
  VStack,
  useTheme,
  type AspectRatioProps,
} from "@its/glowup-ui";

const props: Partial<AspectRatioProps> = {
  ratio: 1.5,
};

export default function AspectRatioExample() {
  const { theme } = useTheme();
  const [playing, setPlaying] = useState(false);

  return (
    <Card variant="outlined">
      <VStack spacing="s">
        <AspectRatio
          variant="centered-flex"
          radius="medium"
          background="surfaceContainerHighest"
          {...props}
        >
          <Icon
            source={playing ? "pause-circle-outline" : "play-circle-outline"}
            size={48}
            color={theme.colors.onSurfaceVariant}
          />
        </AspectRatio>
        <VStack spacing="xs">
          <Typography variant="titleSmall">Getting started</Typography>
          <Typography variant="bodySmall" color="onSurfaceVariant">
            {playing ? "Playing · 0:42 of 4:12" : "4:12 · 1.2k views"}
          </Typography>
        </VStack>
        <Button
          variant="tonal"
          iconName={playing ? "pause" : "play"}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? "Pause" : "Watch"}
        </Button>
      </VStack>
    </Card>
  );
}

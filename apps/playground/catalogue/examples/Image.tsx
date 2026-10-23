import { useState } from "react";
import {
  Image,
  Switch,
  Typography,
  VStack,
  useTheme,
  type ImageProps,
  type Theme,
} from "@its/glowup-ui";

const props: Partial<ImageProps> & Pick<ImageProps, "alt"> = {
  alt: "A cabin on a lake at sunset",
  ratio: 1.5,
  radius: "large",
};

// An SVG drawn in the theme's colours, inline: nothing to download. (Native
// image views do not draw SVG, so a phone shows the fallback icon instead.)
const lake = ({ colors }: Theme) => ({
  uri: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="${colors.primaryContainer}"/>
      <circle cx="440" cy="120" r="48" fill="${colors.tertiary}"/>
      <path d="M0 300 170 120 300 250 400 170 600 310V400H0Z" fill="${colors.secondary}"/>
      <path d="M0 340H600V400H0Z" fill="${colors.primary}"/>
    </svg>`,
  )}`,
});

// A source that cannot be decoded, to see what a failed load looks like.
const BROKEN = { uri: "data:image/png;base64,broken" };

export default function ImageExample() {
  const { theme } = useTheme();
  const [broken, setBroken] = useState(false);

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Lake cabin</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          Two nights, sleeps four, sunset over the water.
        </Typography>
      </VStack>
      <Image {...props} source={broken ? BROKEN : lake(theme)} />
      <Switch label="Photo unavailable" value={broken} onChange={setBroken} />
    </VStack>
  );
}

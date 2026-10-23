import { useState } from "react";
import {
  Button,
  Card,
  CardActions,
  CardCover,
  CardTitle,
  useTheme,
  type CardCoverProps,
} from "@its/glowup-ui";

const props: Omit<CardCoverProps, "source"> = {
  alt: "A soft gradient from violet to rose",
};

/** A gradient as an image, so the example needs no file and no network. */
const gradient = (from: string, to: string) => ({
  uri:
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">` +
        `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="${from}"/>` +
        `<stop offset="1" stop-color="${to}"/>` +
        `</linearGradient></defs>` +
        `<rect width="320" height="180" fill="url(#g)"/></svg>`,
    ),
});

export default function CardCoverExample() {
  const { theme } = useTheme();
  const [saved, setSaved] = useState(false);

  return (
    <Card variant="elevated">
      <CardCover
        {...props}
        source={gradient(theme.colors.primary, theme.colors.tertiary)}
      />
      <CardTitle
        title="Autumn on the Douro"
        subtitle="Photo essay · 8 min read"
      />
      <CardActions>
        <Button
          variant={saved ? "tonal" : "text"}
          iconName={saved ? "bookmark" : "bookmark-outline"}
          onClick={() => setSaved(!saved)}
        >
          {saved ? "Saved" : "Save"}
        </Button>
        <Button>Read</Button>
      </CardActions>
    </Card>
  );
}

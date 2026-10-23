import { useState } from "react";
import { Card, Typography, VStack, type TypographyProps } from "@its/glowup-ui";

const props: TypographyProps = {
  children: "How we rebuilt checkout in a week",
  variant: "h5",
};

export default function TypographyExample() {
  const [open, setOpen] = useState(false);

  return (
    <Card variant="outlined">
      <VStack spacing="s">
        <Typography variant="overline" color="primary">
          Engineering · 6 min read
        </Typography>
        <Typography
          {...props}
          accessibilityRole="button"
          onClick={() => setOpen(!open)}
        />
        <Typography variant="body2" color="onSurfaceVariant" nowrap={!open}>
          The old flow asked for the same address three times. We merged the
          steps into one screen and measured every change before it shipped.
        </Typography>
        <Typography variant="caption" color="onSurfaceVariant">
          {open
            ? "Press the title to fold the summary."
            : "Press the title to read the summary."}
        </Typography>
      </VStack>
    </Card>
  );
}

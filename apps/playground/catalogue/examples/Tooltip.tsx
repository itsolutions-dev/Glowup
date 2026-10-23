import { useState } from "react";
import {
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  VStack,
  type TooltipProps,
} from "@its/glowup-ui";

// `anchorAccessible` is off because the child, an IconButton, has a name of its own.
const props: Partial<TooltipProps> & Pick<TooltipProps, "content"> = {
  content: "Bold",
  position: "bottom",
  anchorAccessible: false,
};

export default function TooltipExample() {
  const [note, setNote] = useState(
    "Hover or focus a button. Long-press on a phone.",
  );

  return (
    <VStack spacing="m">
      <Typography variant="titleMedium">Format text</Typography>
      <Toolbar variant="floating" accessibilityLabel="Text formatting">
        <Tooltip
          {...props}
          // Only a rich tooltip draws its title and action.
          action={{
            label: "Learn more",
            onPress: () => setNote("Opened the formatting guide."),
          }}
        >
          <IconButton
            icon="format-bold"
            accessibilityLabel="Bold"
            onClick={() => setNote("Bold on.")}
          />
        </Tooltip>
        {/* IconButton's own title draws the same plain tooltip. */}
        <IconButton
          icon="format-italic"
          title="Italic"
          accessibilityLabel="Italic"
          onClick={() => setNote("Italic on.")}
        />
        <IconButton
          icon="format-underline"
          title="Underline"
          accessibilityLabel="Underline"
          onClick={() => setNote("Underline on.")}
        />
      </Toolbar>
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {note}
      </Typography>
    </VStack>
  );
}

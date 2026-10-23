import { useState } from "react";
import {
  Clipboard,
  ListItem,
  Typography,
  VStack,
  type ClipboardProps,
} from "@its/glowup-ui";

const props: Partial<ClipboardProps> & Pick<ClipboardProps, "value"> = {
  value: "sk_live_51Hx9A2eZvKYlo2C",
  label: "Copy API key",
};

export default function ClipboardExample() {
  const [copies, setCopies] = useState(0);

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Developer settings</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          Keep this key secret: it can read and write your data.
        </Typography>
      </VStack>
      {/* On the web the button writes to the clipboard. A phone has no default
          writer, so the app passes one (`copy`); here it only reports. */}
      <ListItem
        icon="key-outline"
        primaryText="Live API key"
        secondaryText={props.value}
        action={<Clipboard {...props} onCopy={() => setCopies((n) => n + 1)} />}
      />
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {copies === 0
          ? "Not copied yet."
          : `Copied ${copies} ${copies === 1 ? "time" : "times"}.`}
      </Typography>
    </VStack>
  );
}

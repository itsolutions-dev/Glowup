import { useState } from "react";
import {
  Card,
  IconButton,
  ListItem,
  Portal,
  Snackbar,
  Typography,
  VStack,
} from "@its/glowup-ui";

// `Portal` takes no props: it draws its children at the `Portal.Host` above it.
// An app mounts the host once at its root; the example brings its own.
export default function PortalExample() {
  const [trashed, setTrashed] = useState(false);

  return (
    <Portal.Host>
      <VStack spacing="m">
        <Typography variant="titleMedium">Drafts</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          The card clips whatever sticks out of it, but the notice that appears
          when you trash the draft is drawn by the host, above the page.
        </Typography>
        <Card variant="outlined">
          <ListItem
            icon="file-document-outline"
            primaryText="Quarterly report"
            secondaryText="Edited yesterday"
            dimmed={trashed}
            action={
              <IconButton
                icon="trash-can-outline"
                accessibilityLabel="Move to trash"
                onClick={() => setTrashed(true)}
              />
            }
          />
          {/* Without the Portal this snackbar would be drawn, and cut off,
              inside the card. */}
          {trashed && (
            <Portal>
              <Snackbar
                visible
                message="Moved to trash"
                action={{ label: "Undo", onClick: () => setTrashed(false) }}
                onDismiss={() => setTrashed(false)}
              />
            </Portal>
          )}
        </Card>
      </VStack>
    </Portal.Host>
  );
}

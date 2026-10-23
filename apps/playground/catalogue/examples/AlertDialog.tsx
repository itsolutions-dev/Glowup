import { useState } from "react";
import {
  AlertDialog,
  Button,
  ListItem,
  Typography,
  VStack,
  type AlertDialogProps,
} from "@its/glowup-ui";

const props: Partial<AlertDialogProps> = {
  severity: "warning",
  title: "You are offline",
  message: "Changes stay on this device and sync when you are back online.",
  actionText: "Try again",
  cancelText: "Work offline",
};

export default function AlertDialogExample() {
  const [open, setOpen] = useState(false);
  const [asking, setAsking] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [status, setStatus] = useState("Last synced 12 minutes ago.");
  const answer = (next: string) => {
    setStatus(next);
    setOpen(false);
  };

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Quarterly report</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {status}
        </Typography>
      </VStack>
      {deleted ? (
        <Button variant="text" onClick={() => setDeleted(false)}>
          Restore report
        </Button>
      ) : (
        <ListItem
          icon="file-document-outline"
          primaryText="Quarterly report.docx"
          secondaryText="Edited by you, 2 changes waiting"
        />
      )}
      <Button variant="tonal" iconName="sync" onClick={() => setOpen(true)}>
        Sync now
      </Button>
      <Button
        variant="outlined"
        color="error"
        iconName="delete-outline"
        onClick={() => setAsking(true)}
      >
        Delete report
      </Button>
      <AlertDialog
        {...props}
        visible={open}
        onAction={() => answer("Still offline. Trying again in a minute.")}
        onCancel={() => answer("Working offline. 2 changes waiting.")}
      />
      <AlertDialog
        visible={asking}
        icon="delete-outline"
        title="Delete the report?"
        message="It is removed for everyone. This cannot be undone."
        actionText="Delete"
        cancelText="Keep it"
        destructive
        disableBackdropClick={false}
        disableEscapeKeyDown={false}
        onAction={() => {
          setAsking(false);
          setDeleted(true);
        }}
        onCancel={() => setAsking(false)}
      />
    </VStack>
  );
}

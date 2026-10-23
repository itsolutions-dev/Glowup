import { useState } from "react";
import {
  Button,
  ConfirmDialog,
  ListItem,
  Typography,
  VStack,
  type ConfirmDialogProps,
} from "@its/glowup-ui";

const props: Partial<ConfirmDialogProps> = {
  title: "Delete Atlas?",
  message: "Its 42 files will be removed. This cannot be undone.",
  confirmText: "Delete project",
  cancelText: "Keep project",
  destructive: true,
  icon: "delete-outline",
};

export default function ConfirmDialogExample() {
  const [asking, setAsking] = useState(false);
  const [deleted, setDeleted] = useState(false);

  return (
    <VStack spacing="m">
      <Typography variant="titleMedium">Project settings</Typography>
      {deleted ? (
        <>
          <Typography variant="bodyMedium" color="onSurfaceVariant">
            Atlas was deleted.
          </Typography>
          <Button variant="text" onClick={() => setDeleted(false)}>
            Restore project
          </Button>
        </>
      ) : (
        <>
          <ListItem
            icon="folder-outline"
            primaryText="Atlas"
            secondaryText="42 files, last edited yesterday"
          />
          <Button
            variant="outlined"
            color="error"
            iconName="delete-outline"
            onClick={() => setAsking(true)}
          >
            Delete project
          </Button>
        </>
      )}
      <ConfirmDialog
        {...props}
        visible={asking}
        onCancel={() => setAsking(false)}
        onConfirm={() => {
          setAsking(false);
          setDeleted(true);
        }}
      />
    </VStack>
  );
}

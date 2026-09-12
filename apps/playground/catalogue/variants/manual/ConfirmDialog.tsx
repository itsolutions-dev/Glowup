import { View } from "react-native";
import { Button, ConfirmDialog, Typography } from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo, useOverlayDemo } from "./shared";

// Hand-written for the same reason as Modal, which ConfirmDialog wraps: the
// authored preview mounts it open, and an open dialog is a portal over the
// whole page. See `useOverlayDemo`.

const Destructive = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Typography variant="headlineSmall">Chip</Typography>
      <Typography variant="bodyMedium">
        Buttons & actions · 4 variants
      </Typography>
      <Button
        mode="outlined"
        tone="error"
        iconName="delete-outline"
        onPress={show}
      >
        Delete Chip
      </Button>
      <ConfirmDialog
        visible={open}
        destructive
        title="Delete Chip?"
        message="Chip is used by 6 screens. Deleting it removes those usages and cannot be undone."
        confirmText="Delete"
        cancelText="Keep"
        onConfirm={hide}
        onCancel={hide}
      />
    </View>
  );
};

const Confirm = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Button mode="filled" iconName="publish" onPress={show}>
        Publish 0.1.0
      </Button>
      <ConfirmDialog
        visible={open}
        title="Publish 0.1.0?"
        message="34 components will be pushed to the registry and every dependent workspace will see the update."
        confirmText="Publish"
        cancelText="Not yet"
        onConfirm={hide}
        onCancel={hide}
      />
    </View>
  );
};

const DefaultLabels = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Button mode="tonal" iconName="undo-variant" onPress={show}>
        Discard draft
      </Button>
      <ConfirmDialog
        visible={open}
        title="Discard draft?"
        message="Your unsaved changes to the login screen will be lost."
        onConfirm={hide}
        onCancel={hide}
      />
    </View>
  );
};

export const variants: Variant[] = [
  {
    name: "Destructive",
    title: "Destructive",
    description: "The confirm action takes the error tone.",
    render: Destructive,
  },
  { name: "Confirm", title: "Confirm", render: Confirm },
  {
    name: "DefaultLabels",
    title: "Default labels",
    description: "Without confirmText and cancelText: Confirm and Cancel.",
    render: DefaultLabels,
  },
];

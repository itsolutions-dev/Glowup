import { View } from "react-native";
import { Button, ConfirmDialog, Typography, useTheme } from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo, useOverlayDemo } from "./shared";

// Hand-written for the same reason as Dialog, which ConfirmDialog wraps: the
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
        variant="outlined"
        color="error"
        iconName="delete-outline"
        onClick={show}
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
      <Button variant="filled" iconName="publish" onClick={show}>
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
      <Button variant="tonal" iconName="undo-variant" onClick={show}>
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

const MustAnswer = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Button variant="outlined" iconName="logout" onClick={show}>
        Sign out everywhere
      </Button>
      <ConfirmDialog
        visible={open}
        icon="logout"
        title="Sign out everywhere?"
        message="A click outside and Escape are ignored: the answer has to be one of the buttons."
        confirmText="Sign out"
        cancelText="Stay signed in"
        dismissable={false}
        onConfirm={hide}
        onCancel={hide}
      />
    </View>
  );
};

const CustomSlots = () => {
  const { theme } = useTheme();
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Button variant="tonal" iconName="palette-outline" onClick={show}>
        Restyle the parts
      </Button>
      <ConfirmDialog
        visible={open}
        icon="palette-outline"
        title="Apply this theme?"
        message="slotStyles overrides the backdrop, the card, the title and the row of actions."
        confirmText="Apply"
        cancelText="Later"
        slotStyles={{
          backdrop: {
            backgroundColor: theme.colors.primaryContainer,
            opacity: 0.7,
          },
          container: {
            borderRadius: theme.shape.small,
            borderWidth: 2,
            borderColor: theme.colors.primary,
          },
          title: { color: theme.colors.primary },
          actions: { justifyContent: "space-between" },
        }}
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
  {
    name: "MustAnswer",
    title: "Must answer",
    description: "dismissable={false}: only the two buttons close it.",
    render: MustAnswer,
  },
  {
    name: "CustomSlots",
    title: "Custom slots",
    description: "slotStyles restyles the parts; actions covers both buttons.",
    render: CustomSlots,
  },
];

import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  AlertDialog,
  Button,
  Typography,
  type AlertDialogSeverity,
} from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo, useOverlayDemo } from "./shared";

// Hand-written because an alert is an overlay: it portals over the whole page
// through a Modal, so every entry starts closed, opens from its own trigger and
// closes for real. See `useOverlayDemo`.

const COPY: Record<AlertDialogSeverity, { title: string; message: string }> = {
  info: {
    title: "New version available",
    message: "Reload the app to get the latest fixes.",
  },
  success: {
    title: "Backup complete",
    message: "1,284 photos are safe in your account.",
  },
  warning: {
    title: "Storage almost full",
    message: "You have used 14.1 of 15 GB. Free up space to keep backing up.",
  },
  error: {
    title: "Payment failed",
    message: "Your card was declined. Update it to keep your plan.",
  },
};

const Severities = () => {
  const { open, show, hide } = useOverlayDemo();
  // Kept after closing, so the alert does not change while it fades out.
  const [severity, setSeverity] = useState<AlertDialogSeverity>("info");

  return (
    <View style={demo.row}>
      {(["info", "success", "warning", "error"] as const).map((kind) => (
        <Button
          key={kind}
          variant="outlined"
          onClick={() => {
            setSeverity(kind);
            show();
          }}
        >
          {kind}
        </Button>
      ))}
      <AlertDialog
        visible={open}
        severity={severity}
        title={COPY[severity].title}
        message={COPY[severity].message}
        onAction={hide}
      />
    </View>
  );
};

const Destructive = () => {
  const { open, show, hide } = useOverlayDemo();
  const [deleted, setDeleted] = useState(false);

  return (
    <View style={demo.panel}>
      <Typography variant="headlineSmall">Atlas</Typography>
      <Typography variant="bodyMedium">
        {deleted ? "Deleted." : "42 files · edited yesterday"}
      </Typography>
      <Button
        variant="outlined"
        color="error"
        iconName="delete-outline"
        onClick={show}
      >
        Delete project
      </Button>
      <AlertDialog
        visible={open}
        severity="error"
        title="Delete Atlas?"
        message="Its 42 files are removed for good."
        actionText="Delete"
        destructive
        cancelText="Keep it"
        onAction={() => {
          setDeleted(true);
          hide();
        }}
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
      <AlertDialog
        visible={open}
        icon="publish"
        title="Publish 0.1.0?"
        message="34 components will be pushed to the registry."
        actionText="Publish"
        cancelText="Not yet"
        disableBackdropClick={false}
        disableEscapeKeyDown={false}
        onAction={hide}
        onCancel={hide}
      />
    </View>
  );
};

const Loading = () => {
  const { open, show, hide } = useOverlayDemo();
  const [loading, setLoading] = useState(false);

  // The work finishes by itself, and the alert goes with it.
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      hide();
    }, 1500);
    return () => clearTimeout(timer);
  }, [loading, hide]);

  return (
    <View style={demo.panel}>
      <Button variant="tonal" iconName="cloud-upload-outline" onClick={show}>
        Publish changes
      </Button>
      <AlertDialog
        visible={open}
        severity="info"
        title="Publish changes?"
        message="Everyone with the link sees the new version."
        actionText="Publish"
        cancelText="Not yet"
        loading={loading}
        onAction={() => setLoading(true)}
        onCancel={hide}
      />
    </View>
  );
};

const Dismissable = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Button variant="outlined" iconName="lightbulb-outline" onClick={show}>
        Show a tip
      </Button>
      <AlertDialog
        visible={open}
        severity="info"
        title="Did you know?"
        message="Press Escape or click outside to dismiss this one."
        actionText="Got it"
        cancelText="Dismiss"
        disableBackdropClick={false}
        disableEscapeKeyDown={false}
        onAction={hide}
        onCancel={hide}
      />
    </View>
  );
};

const RichBody = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Button variant="outlined" iconName="alert-outline" onClick={show}>
        Review changes
      </Button>
      <AlertDialog
        visible={open}
        severity="warning"
        title="Unsaved changes"
        actionText="Save and close"
        cancelText="Discard"
        onAction={hide}
        onCancel={hide}
      >
        <View style={demo.stack}>
          <Typography variant="bodyMedium">
            These edits are not saved yet:
          </Typography>
          <Typography variant="bodySmall">Quarterly report.docx</Typography>
          <Typography variant="bodySmall">Budget 2026.xlsx</Typography>
        </View>
      </AlertDialog>
    </View>
  );
};

export const variants: Variant[] = [
  {
    name: "Severities",
    title: "Severities",
    description: "severity adds an icon in the colour of its status role.",
    render: Severities,
  },
  {
    name: "Destructive",
    title: "Destructive",
    description:
      "destructive draws the primary action in the error tone, and cancelText adds the secondary one.",
    render: Destructive,
  },
  {
    name: "Confirm",
    title: "Confirm",
    description:
      "A plain question: icon for a hero glyph, cancelText for the way out, and the two disable flags off so the backdrop and Escape also cancel.",
    render: Confirm,
  },
  {
    name: "Loading",
    title: "Loading",
    description:
      "loading puts a spinner in the action and keeps the alert up until the work is done.",
    render: Loading,
  },
  {
    name: "Dismissable",
    title: "Dismissable",
    description:
      "An alert ignores the backdrop and Escape by default; turn the two disable flags off to let them dismiss it.",
    render: Dismissable,
  },
  {
    name: "RichBody",
    title: "Rich body",
    description: "Children instead of, or after, the message.",
    render: RichBody,
  },
];

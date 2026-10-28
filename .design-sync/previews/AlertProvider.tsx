import React from "react";
import {
  AlertProvider,
  Alert,
  Typography,
  Paper,
  Divider,
  Button,
} from "@its/glowup-ui";

// AlertProvider renders nothing on its own — it hosts the cross-platform alert
// dialog (native Alert.alert on iOS/Android, this themed Dialog on web). What
// the card can honestly show is the dialog it puts on screen, so these cells
// mount the real provider stack and raise a real alert at mount.
//
// AlertProvider binds the Alert() singleton itself (AlertProviderWrapper is a
// deprecated pass-through), but in an effect that runs AFTER its children's —
// so the call is queued on a timer rather than fired straight from the child
// effect.

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  width: 400,
};

const lines: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

type Btn = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

const RaiseOnMount = ({
  title,
  message,
  buttons,
}: {
  title: string;
  message: string;
  buttons?: Btn[];
}) => {
  React.useEffect(() => {
    const id = setTimeout(() => Alert(title, message, buttons), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

export const HostedDialog = () => (
  <AlertProvider>
    <RaiseOnMount
      title="Discard draft?"
      message="The invoice for Northwind Ltd has unsaved changes. Discarding cannot be undone."
      buttons={[
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive" },
      ]}
    />
    <div style={stack}>
      <Paper outline style={{ padding: 16 }}>
        <div style={lines}>
          <Typography variant="titleSmall">Invoice INV-2026-0184</Typography>
          <Typography variant="bodySmall">
            Northwind Ltd · €4,280 · draft
          </Typography>
        </div>
      </Paper>
    </div>
  </AlertProvider>
);

export const DefaultOkButton = () => (
  <AlertProvider>
    <RaiseOnMount
      title="Export ready"
      message="component-audit-March-2026.xlsx has been added to your downloads."
    />
    <div style={stack}>
      <Paper outline style={{ padding: 16 }}>
        <div style={lines}>
          <Typography variant="titleSmall">Reports</Typography>
          <Typography variant="bodySmall">
            Called with no buttons array, the provider supplies a single OK.
          </Typography>
        </div>
      </Paper>
    </div>
  </AlertProvider>
);

export const TheApi = () => (
  <div style={stack}>
    <div style={lines}>
      <Typography variant="titleMedium">Raising an alert</Typography>
      <Typography variant="bodySmall">
        Consumers never touch the provider — they call the Alert() singleton
        from anywhere below it.
      </Typography>
    </div>
    <Paper outline style={{ padding: 12 }}>
      <div style={lines}>
        <Typography variant="labelSmall">
          Alert(title, message?, buttons?)
        </Typography>
        <Typography variant="labelSmall">
          buttons: {"{ text, style?, onPress? }[]"} — defaults to a single OK
        </Typography>
        <Typography variant="labelSmall">
          style: &quot;cancel&quot; is a text button, &quot;destructive&quot; an
          error-coloured one
        </Typography>
      </div>
    </Paper>
    <Divider contentSpacing={0} />
    <Button
      variant="outlined"
      iconName="alert-outline"
      onClick={() =>
        Alert("Delete workspace?", "All 42 projects will be removed.", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive" },
        ])
      }
    >
      Delete workspace
    </Button>
    <Typography variant="bodySmall">
      On iOS and Android the same call renders the OS dialog instead of this
      Dialog — one API, two presentations.
    </Typography>
  </div>
);

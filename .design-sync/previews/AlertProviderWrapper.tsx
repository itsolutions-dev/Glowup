import React from "react";
import {
  AlertProvider,
  AlertProviderWrapper,
  Alert,
  Typography,
  Paper,
  Divider,
} from "@glowup/ui";

// AlertProviderWrapper renders no markup at all — it is the binding that points
// the module-level Alert() singleton at the nearest AlertProvider. So the only
// honest visual is the consequence: with it mounted, Alert() puts the
// provider's dialog on screen; without it, the call only logs a warning.
//
// Its own effect runs AFTER its children's, so the demo call is queued on a
// timer instead of being fired straight from a child effect.

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  width: 400,
};

const lines: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 2 };

const RaiseOnMount = () => {
  React.useEffect(() => {
    const id = setTimeout(
      () =>
        Alert(
          "Session expiring",
          "You will be signed out in 2 minutes unless you continue working.",
          [{ text: "Sign out" }, { text: "Stay signed in" }],
        ),
      0,
    );
    return () => clearTimeout(id);
  }, []);
  return null;
};

export const BindsTheSingleton = () => (
  <AlertProvider>
    <AlertProviderWrapper>
      <RaiseOnMount />
      <div style={stack}>
        <Paper outline style={{ padding: 16 }}>
          <div style={lines}>
            <Typography variant="titleSmall">Component library</Typography>
            <Typography variant="bodySmall">
              A plain screen that imports nothing but Alert.
            </Typography>
          </div>
        </Paper>
        <Typography variant="bodySmall">
          Alert() was called from a child that has no provider reference of its
          own. The wrapper is what made that resolve.
        </Typography>
      </div>
    </AlertProviderWrapper>
  </AlertProvider>
);

export const WrapOrder = () => (
  <div style={stack}>
    <div style={lines}>
      <Typography variant="titleMedium">Where it goes</Typography>
      <Typography variant="bodySmall">
        Directly inside AlertProvider, above the app. It renders a fragment, so it
        adds no layout of its own.
      </Typography>
    </div>
    <Paper outline style={{ padding: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="labelSmall">&lt;ThemeProvider&gt;</Typography>
        <Typography variant="labelSmall">{"  <AlertProvider>"}</Typography>
        <Typography variant="labelSmall">
          {"    <AlertProviderWrapper>"}
        </Typography>
        <Typography variant="labelSmall">
          {"      <App />"}
        </Typography>
        <Typography variant="labelSmall">
          {"    </AlertProviderWrapper>"}
        </Typography>
        <Typography variant="labelSmall">{"  </AlertProvider>"}</Typography>
        <Typography variant="labelSmall">&lt;/ThemeProvider&gt;</Typography>
      </div>
    </Paper>
    <Divider contentSpacing={0} />
    <Typography variant="bodySmall">
      Omit it and every Alert() call is a no-op that warns
      &ldquo;AlertProvider is not initialized.&rdquo; — the provider still renders,
      nothing ever asks it to show anything.
    </Typography>
  </div>
);

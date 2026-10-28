import React from "react";
import {
  AlertProvider,
  AlertProviderWrapper,
  Alert,
  Typography,
  Paper,
  Divider,
} from "@its/glowup-ui";

// AlertProviderWrapper is deprecated: AlertProvider now binds the module-level
// Alert() singleton by itself, and the wrapper renders its children unchanged.
// The honest visuals are therefore "a tree that still carries it keeps working"
// and "what to write instead".
//
// AlertProvider's binding effect runs AFTER its children's, so the demo call is
// queued on a timer instead of being fired straight from a child effect.

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

const RaiseOnMount = () => {
  React.useEffect(() => {
    const id = setTimeout(
      () =>
        Alert(
          "Session expiring",
          "You will be signed out in 2 minutes unless you continue working.",
          [{ text: "Sign out", style: "cancel" }, { text: "Stay signed in" }],
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
            <Typography variant="titleSmall">Legacy app shell</Typography>
            <Typography variant="bodySmall">
              Still wrapped in AlertProviderWrapper; Alert() works unchanged.
            </Typography>
          </div>
        </Paper>
      </div>
    </AlertProviderWrapper>
  </AlertProvider>
);

// Side by side: the card is a 560x420 single-mode viewport (it shares the
// AlertProvider dialog override), so stacked code blocks would be cropped.
const Code = ({ title, rows }: { title: string; rows: string[] }) => (
  <div style={{ ...lines, flex: 1, gap: 4 }}>
    <Typography variant="labelMedium">{title}</Typography>
    <Paper outline style={{ padding: 12 }}>
      <div style={lines}>
        {rows.map((row) => (
          <Typography key={row} variant="labelSmall">
            {row}
          </Typography>
        ))}
      </div>
    </Paper>
  </div>
);

export const WrapOrder = () => (
  <div style={{ ...stack, width: 480 }}>
    <div style={lines}>
      <Typography variant="titleMedium">Deprecated — drop it</Typography>
      <Typography variant="bodySmall">
        AlertProvider binds Alert() by itself. The wrapper now renders its
        children unchanged and will be removed in a later release.
      </Typography>
    </div>
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <Code
        title="Before"
        rows={[
          "<ThemeProvider>",
          "  <AlertProvider>",
          "    <AlertProviderWrapper>",
          "      <App />",
          "    </AlertProviderWrapper>",
          "  </AlertProvider>",
          "</ThemeProvider>",
        ]}
      />
      <Code
        title="After"
        rows={[
          "<ThemeProvider>",
          "  <AlertProvider>",
          "    <App />",
          "  </AlertProvider>",
          "</ThemeProvider>",
        ]}
      />
    </div>
    <Divider contentSpacing={0} />
    <Typography variant="bodySmall">
      Nothing else changes: Alert(title, message?, buttons?) is called the same
      way from anywhere below AlertProvider.
    </Typography>
  </div>
);

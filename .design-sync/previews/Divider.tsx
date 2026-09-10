import React from "react";
import { Divider, Paper, Typography, Button } from "@its/glowup-ui";

const panel: React.CSSProperties = { width: 380, display: "flex" };

const rowBetween: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: 10,
  paddingBottom: 10,
};

// react-native-web renders Typography as an inline-flex <Text>, so sibling lines
// inside a plain <div> need an explicit column flex to stack.
const stat: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const vRule: React.CSSProperties = {
  width: 1,
  alignSelf: "stretch",
  display: "flex",
};

export const ListSeparators = () => (
  <div style={panel}>
    <Paper elevation={1} outline style={{ flex: 1 }}>
      <Typography variant="titleSmall">Notifications</Typography>
      <div style={rowBetween}>
        <Typography variant="bodyMedium">Email digest</Typography>
        <Typography variant="bodySmall">Weekly</Typography>
      </div>
      <Divider contentSpacing={0} />
      <div style={rowBetween}>
        <Typography variant="bodyMedium">Mentions</Typography>
        <Typography variant="bodySmall">Instant</Typography>
      </div>
      <Divider contentSpacing={0} />
      <div style={rowBetween}>
        <Typography variant="bodyMedium">Product updates</Typography>
        <Typography variant="bodySmall">Off</Typography>
      </div>
    </Paper>
  </div>
);

export const WithLabel = () => (
  <div
    style={{ width: 380, display: "flex", flexDirection: "column", gap: 16 }}
  >
    <Button mode="filled" fullWidth onPress={() => {}}>
      Sign in with email
    </Button>
    <Divider contentSpacing={12}>OR</Divider>
    <Button mode="outlined" fullWidth iconName="fingerprint" onPress={() => {}}>
      Use a passkey
    </Button>
    <Divider contentSpacing={12} inset={24}>
      Yesterday
    </Divider>
  </div>
);

export const Thickness = () => (
  <div
    style={{ width: 380, display: "flex", flexDirection: "column", gap: 14 }}
  >
    <Typography variant="labelMedium">
      thickness 1 — default hairline rule
    </Typography>
    <Divider contentSpacing={0} />
    <Typography variant="labelMedium">thickness 2</Typography>
    <Divider contentSpacing={0} thickness={2} />
    <Typography variant="labelMedium">thickness 4 — section break</Typography>
    <Divider contentSpacing={0} thickness={4} />
  </div>
);

export const Vertical = () => (
  <div style={panel}>
    <Paper elevation={2} style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "stretch", height: 56 }}>
        <div style={stat}>
          <Typography variant="titleMedium">128</Typography>
          <Typography variant="bodySmall">Components</Typography>
        </div>
        <div style={vRule}>
          <Divider orientation="vertical" />
        </div>
        <div style={stat}>
          <Typography variant="titleMedium">42</Typography>
          <Typography variant="bodySmall">Tokens</Typography>
        </div>
        <div style={vRule}>
          <Divider orientation="vertical" />
        </div>
        <div style={stat}>
          <Typography variant="titleMedium">7</Typography>
          <Typography variant="bodySmall">Groups</Typography>
        </div>
      </div>
    </Paper>
  </div>
);

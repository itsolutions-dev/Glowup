import React from "react";
import { Paper, Typography, Divider, StatusBadge, Button } from "@glowup/ui";

const grid: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  width: 380,
};

const tile: React.CSSProperties = { width: 116, display: "flex" };

export const Elevations = () => (
  <div style={grid}>
    {[0, 1, 2, 3, 4, 5].map((e) => (
      <div key={e} style={tile}>
        <Paper elevation={e} style={{ flex: 1 }}>
          <Typography variant="labelLarge">Level {e}</Typography>
          <Typography variant="bodySmall">surface</Typography>
        </Paper>
      </div>
    ))}
  </div>
);

export const Outlined = () => (
  <div style={{ width: 380, display: "flex" }}>
    <Paper elevation={0} outline style={{ flex: 1 }}>
      <Typography variant="titleSmall">API key</Typography>
      <Typography variant="bodySmall">
        Rotates automatically every 90 days.
      </Typography>
      <div style={{ height: 12 }} />
      <Divider contentSpacing={0} />
      <div style={{ height: 12 }} />
      <Typography variant="bodyMedium">gl_live_8f2a·····c41d</Typography>
    </Paper>
  </div>
);

export const Glow = () => (
  <div style={{ width: 380, display: "flex" }}>
    <Paper elevation={3} glow style={{ flex: 1 }}>
      <Typography variant="titleMedium">Pro plan</Typography>
      <Typography variant="bodySmall">
        Unlimited seats and priority support.
      </Typography>
      <div style={{ height: 16 }} />
      <Button
        mode="filled"
        iconName="arrow-right"
        iconPosition="right"
        onPress={() => {}}
      >
        Upgrade
      </Button>
    </Paper>
  </div>
);

export const AsPanel = () => (
  <div style={{ width: 380, display: "flex" }}>
    <Paper elevation={2} style={{ flex: 1 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="titleMedium">Build #418</Typography>
        <StatusBadge label="Passed" type="success" />
      </div>
      <div style={{ height: 12 }} />
      <Divider contentSpacing={0} />
      <div style={{ height: 12 }} />
      <Typography variant="bodyMedium">master · 75b8c46</Typography>
      <div style={{ height: 4 }} />
      <Typography variant="bodySmall">
        Finished in 2m 14s · 312 tests
      </Typography>
    </Paper>
  </div>
);

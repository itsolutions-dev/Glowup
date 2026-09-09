import React from "react";
import { Banner, Typography, Card, Chip } from "@glowup/ui";

// Banner is a full-width inline strip (width: "100%", bottom hairline), so it
// needs a parent with a real width — it is not an overlay and never portals.
const frame: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: 420,
};

const stack: React.CSSProperties = { ...frame, gap: 16 };

export const Types = () => (
  <div style={stack}>
    <Banner visible message="Component library synced 4 minutes ago." />
    <Banner
      visible
      type="info"
      message="A new Material You token set is available for this workspace."
    />
    <Banner
      visible
      type="warning"
      message="Your subscription renews on 12 October and the card on file expires first."
    />
    <Banner
      visible
      type="error"
      message="Publishing failed: two components still reference a deleted token."
    />
  </div>
);

export const WithActions = () => (
  <div style={frame}>
    <Banner
      visible
      type="warning"
      message="Your subscription is about to expire."
      actions={[
        { label: "Dismiss", onPress: () => {} },
        { label: "Renew", onPress: () => {} },
      ]}
    />
  </div>
);

export const Dismissable = () => (
  <div style={stack}>
    <Banner
      visible
      type="info"
      message="Draft autosave is on. We keep the last 30 versions of every screen."
      dismissable
      onDismiss={() => {}}
    />
    <Banner
      visible
      type="error"
      message="We could not reach the design token service."
      dismissable
      onDismiss={() => {}}
      actions={[{ label: "Retry", onPress: () => {} }]}
    />
  </div>
);

export const CustomIcon = () => (
  <div style={frame}>
    <Banner
      visible
      type="info"
      icon="cloud-off-outline"
      message="You are offline. Changes are queued and will publish when you reconnect."
      actions={[{ label: "Work offline", onPress: () => {} }]}
    />
  </div>
);

// A Banner in situ: pinned above the page content it interrupts.
export const AboveContent = () => (
  <div style={frame}>
    <Banner
      visible
      type="warning"
      message="2 of 34 components fail contrast in dark mode."
      dismissable
      onDismiss={() => {}}
      actions={[{ label: "Review", onPress: () => {} }]}
    />
    <div style={{ height: 16 }} />
    <Card variant="outlined">
      <Typography variant="titleMedium">Component health</Typography>
      <div style={{ height: 8 }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Chip label="32 passing" size="small" mode="tonal" onPress={() => {}} />
        <Chip
          label="2 failing"
          size="small"
          mode="outlined"
          onPress={() => {}}
        />
      </div>
    </Card>
  </div>
);

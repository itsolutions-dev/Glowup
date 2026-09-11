// GENERATED — do not edit.
// Source: .design-sync/previews/Banner.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Banner, Typography, Card, Chip } from "@its/glowup-ui";

// Banner is a full-width inline strip (width: "100%", bottom hairline), so it
// needs a parent with a real width — it is not an overlay and never portals.
const frame: ViewStyle = {
  flexDirection: "column",
  width: 420,
};

const stack: ViewStyle = { ...frame, gap: 16 };

export const Types = () => (
  <View style={stack}>
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
  </View>
);

export const WithActions = () => (
  <View style={frame}>
    <Banner
      visible
      type="warning"
      message="Your subscription is about to expire."
      actions={[
        { label: "Dismiss", onPress: () => {} },
        { label: "Renew", onPress: () => {} },
      ]}
    />
  </View>
);

export const Dismissable = () => (
  <View style={stack}>
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
  </View>
);

export const CustomIcon = () => (
  <View style={frame}>
    <Banner
      visible
      type="info"
      icon="cloud-off-outline"
      message="You are offline. Changes are queued and will publish when you reconnect."
      actions={[{ label: "Work offline", onPress: () => {} }]}
    />
  </View>
);

// A Banner in situ: pinned above the page content it interrupts.
export const AboveContent = () => (
  <View style={frame}>
    <Banner
      visible
      type="warning"
      message="2 of 34 components fail contrast in dark mode."
      dismissable
      onDismiss={() => {}}
      actions={[{ label: "Review", onPress: () => {} }]}
    />
    <View style={{ height: 16 }} />
    <Card variant="outlined">
      <Typography variant="titleMedium">Component health</Typography>
      <View style={{ height: 8 }} />
      <View style={{ gap: 8, flexWrap: "wrap" }}>
        <Chip label="32 passing" size="small" mode="tonal" onPress={() => {}} />
        <Chip
          label="2 failing"
          size="small"
          mode="outlined"
          onPress={() => {}}
        />
      </View>
    </Card>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Types",
    title: "Types",
    render: Types,
  },
  {
    name: "WithActions",
    title: "With actions",
    render: WithActions,
  },
  {
    name: "Dismissable",
    title: "Dismissable",
    render: Dismissable,
  },
  {
    name: "CustomIcon",
    title: "Custom icon",
    render: CustomIcon,
  },
  {
    name: "AboveContent",
    title: "Above content",
    render: AboveContent,
  },
];

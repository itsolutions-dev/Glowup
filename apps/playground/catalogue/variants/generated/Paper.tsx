// GENERATED — do not edit.
// Source: .design-sync/previews/Paper.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import {
  Paper,
  Typography,
  Divider,
  StatusBadge,
  Button,
} from "@its/glowup-ui";

const grid: ViewStyle = {
  flexWrap: "wrap",
  gap: 12,
  width: 380,
};

const tile: ViewStyle = { width: 116 };

export const Elevations = () => (
  <View style={grid}>
    {[0, 1, 2, 3, 4, 5].map((e) => (
      <View key={e} style={tile}>
        <Paper elevation={e} style={{ flex: 1 }}>
          <Typography variant="labelLarge">Level {e}</Typography>
          <Typography variant="bodySmall">surface</Typography>
        </Paper>
      </View>
    ))}
  </View>
);

export const Outlined = () => (
  <View style={{ width: 380 }}>
    <Paper elevation={0} outline style={{ flex: 1 }}>
      <Typography variant="titleSmall">API key</Typography>
      <Typography variant="bodySmall">
        Rotates automatically every 90 days.
      </Typography>
      <View style={{ height: 12 }} />
      <Divider contentSpacing={0} />
      <View style={{ height: 12 }} />
      <Typography variant="bodyMedium">gl_live_8f2a·····c41d</Typography>
    </Paper>
  </View>
);

export const Glow = () => (
  <View style={{ width: 380 }}>
    <Paper elevation={3} glow style={{ flex: 1 }}>
      <Typography variant="titleMedium">Pro plan</Typography>
      <Typography variant="bodySmall">
        Unlimited seats and priority support.
      </Typography>
      <View style={{ height: 16 }} />
      <Button
        mode="filled"
        iconName="arrow-right"
        iconPosition="right"
        onPress={() => {}}
      >
        Upgrade
      </Button>
    </Paper>
  </View>
);

export const AsPanel = () => (
  <View style={{ width: 380 }}>
    <Paper elevation={2} style={{ flex: 1 }}>
      <View
        style={{
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="titleMedium">Build #418</Typography>
        <StatusBadge label="Passed" type="success" />
      </View>
      <View style={{ height: 12 }} />
      <Divider contentSpacing={0} />
      <View style={{ height: 12 }} />
      <Typography variant="bodyMedium">master · 75b8c46</Typography>
      <View style={{ height: 4 }} />
      <Typography variant="bodySmall">
        Finished in 2m 14s · 312 tests
      </Typography>
    </Paper>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Elevations",
    title: "Elevations",
    render: Elevations,
  },
  {
    name: "Outlined",
    title: "Outlined",
    render: Outlined,
  },
  {
    name: "Glow",
    title: "Glow",
    render: Glow,
  },
  {
    name: "AsPanel",
    title: "As panel",
    render: AsPanel,
  },
];

// GENERATED — do not edit.
// Source: .design-sync/previews/Divider.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Divider, Paper, Typography, Button } from "@its/glowup-ui";

const panel: ViewStyle = { width: 380, flexDirection: "row" };

const rowBetween: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: 10,
  paddingBottom: 10,
};

// react-native-web renders Typography as an inline-flex <Text>, so sibling lines
// inside a plain <View> need an explicit column flex to stack.
const stat: ViewStyle = {
  flex: 1,
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

export const ListSeparators = () => (
  <View style={panel}>
    <Paper elevation={1} outline style={{ flex: 1 }}>
      <Typography variant="titleSmall">Notifications</Typography>
      <View style={rowBetween}>
        <Typography variant="bodyMedium">Email digest</Typography>
        <Typography variant="bodySmall">Weekly</Typography>
      </View>
      <Divider contentSpacing={0} />
      <View style={rowBetween}>
        <Typography variant="bodyMedium">Mentions</Typography>
        <Typography variant="bodySmall">Instant</Typography>
      </View>
      <Divider contentSpacing={0} />
      <View style={rowBetween}>
        <Typography variant="bodyMedium">Product updates</Typography>
        <Typography variant="bodySmall">Off</Typography>
      </View>
    </Paper>
  </View>
);

export const WithLabel = () => (
  <View style={{ width: 380, flexDirection: "column", gap: 16 }}>
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
  </View>
);

export const Thickness = () => (
  <View style={{ width: 380, flexDirection: "column", gap: 14 }}>
    <Typography variant="labelMedium">
      thickness 1 — default hairline rule
    </Typography>
    <Divider contentSpacing={0} />
    <Typography variant="labelMedium">thickness 2</Typography>
    <Divider contentSpacing={0} thickness={2} />
    <Typography variant="labelMedium">thickness 4 — section break</Typography>
    <Divider contentSpacing={0} thickness={4} />
  </View>
);

export const Vertical = () => (
  <View style={panel}>
    <Paper elevation={2} style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "stretch", height: 56 }}>
        <View style={stat}>
          <Typography variant="titleMedium">128</Typography>
          <Typography variant="bodySmall">Components</Typography>
        </View>
        <Divider orientation="vertical" />
        <View style={stat}>
          <Typography variant="titleMedium">42</Typography>
          <Typography variant="bodySmall">Tokens</Typography>
        </View>
        <Divider orientation="vertical" />
        <View style={stat}>
          <Typography variant="titleMedium">7</Typography>
          <Typography variant="bodySmall">Groups</Typography>
        </View>
      </View>
    </Paper>
  </View>
);

export const variants: Variant[] = [
  {
    name: "ListSeparators",
    title: "List separators",
    render: ListSeparators,
  },
  {
    name: "WithLabel",
    title: "With label",
    render: WithLabel,
  },
  {
    name: "Thickness",
    title: "Thickness",
    render: Thickness,
  },
  {
    name: "Vertical",
    title: "Vertical",
    render: Vertical,
  },
];

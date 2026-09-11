// GENERATED — do not edit.
// Source: .design-sync/previews/DrawerPreferenceItem.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import {
  Chip,
  Divider,
  DrawerPreferenceItem,
  Toggle,
  Typography,
} from "@its/glowup-ui";

const panel: ViewStyle = {
  width: 320,
  flexDirection: "column",
};

export const Preferences = () => (
  <View style={panel}>
    <DrawerPreferenceItem icon="theme-light-dark" label="Dark Mode">
      <Toggle value={false} onValueChange={() => {}} />
    </DrawerPreferenceItem>
    <DrawerPreferenceItem icon="pin" label="Pin Sidebar">
      <Toggle value onValueChange={() => {}} />
    </DrawerPreferenceItem>
  </View>
);

export const WithDivider = () => (
  <View style={panel}>
    <DrawerPreferenceItem icon="bell-outline" label="Notifications">
      <Toggle value onValueChange={() => {}} />
    </DrawerPreferenceItem>
    <Divider contentSpacing={0} />
    <DrawerPreferenceItem icon="cellphone-link" label="Sync on cellular">
      <Toggle value={false} onValueChange={() => {}} />
    </DrawerPreferenceItem>
  </View>
);

export const ValueTrailing = () => (
  <View style={panel}>
    <DrawerPreferenceItem icon="translate" label="Language">
      <Chip label="Italiano" mode="outlined" size="small" onPress={() => {}} />
    </DrawerPreferenceItem>
    <DrawerPreferenceItem icon="clock-outline" label="Time zone">
      <Typography variant="bodyMedium">CET · UTC+1</Typography>
    </DrawerPreferenceItem>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Preferences",
    title: "Preferences",
    render: Preferences,
  },
  {
    name: "WithDivider",
    title: "With divider",
    render: WithDivider,
  },
  {
    name: "ValueTrailing",
    title: "Value trailing",
    render: ValueTrailing,
  },
];

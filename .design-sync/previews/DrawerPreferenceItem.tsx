import React from "react";
import {
  Chip,
  Divider,
  DrawerPreferenceItem,
  Toggle,
  Typography,
} from "@glowup/ui";

const panel: React.CSSProperties = {
  width: 320,
  display: "flex",
  flexDirection: "column",
};

export const Preferences = () => (
  <div style={panel}>
    <DrawerPreferenceItem icon="theme-light-dark" label="Dark Mode">
      <Toggle value={false} onValueChange={() => {}} />
    </DrawerPreferenceItem>
    <DrawerPreferenceItem icon="pin" label="Pin Sidebar">
      <Toggle value onValueChange={() => {}} />
    </DrawerPreferenceItem>
  </div>
);

export const WithDivider = () => (
  <div style={panel}>
    <DrawerPreferenceItem icon="bell-outline" label="Notifications">
      <Toggle value onValueChange={() => {}} />
    </DrawerPreferenceItem>
    <Divider contentSpacing={0} />
    <DrawerPreferenceItem icon="cellphone-link" label="Sync on cellular">
      <Toggle value={false} onValueChange={() => {}} />
    </DrawerPreferenceItem>
  </div>
);

export const ValueTrailing = () => (
  <div style={panel}>
    <DrawerPreferenceItem icon="translate" label="Language">
      <Chip label="Italiano" mode="outlined" size="small" onPress={() => {}} />
    </DrawerPreferenceItem>
    <DrawerPreferenceItem icon="clock-outline" label="Time zone">
      <Typography variant="bodyMedium">CET · UTC+1</Typography>
    </DrawerPreferenceItem>
  </div>
);

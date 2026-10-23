// GENERATED — do not edit.
// Source: .design-sync/previews/ListSection.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import {
  ListSection,
  ListItem,
  Switch,
  Typography,
  Paper,
} from "@its/glowup-ui";

const panel: ViewStyle = { width: 380, flexDirection: "row" };

export const Grouped = () => (
  <View style={panel}>
    <Paper elevation={1} outline style={{ flex: 1 }}>
      <ListSection title="Notifications">
        <ListItem
          action={<Typography variant="bodySmall">Weekly</Typography>}
          primaryText="Email digest"
        />
        <ListItem
          action={<Typography variant="bodySmall">Instant</Typography>}
          primaryText="Mentions"
        />
      </ListSection>
    </Paper>
  </View>
);

// A settings screen is a sequence of labelled groups — not a pile of Cards.
export const SettingsScreen = () => {
  const [digest, setDigest] = React.useState(true);
  const [mentions, setMentions] = React.useState(false);
  const [beta, setBeta] = React.useState(false);

  return (
    <View style={panel}>
      <Paper elevation={1} outline style={{ flex: 1 }}>
        {/* `divider` closes the group with a rule. It used to be left off
            here: an unlabelled Divider still opened a contentSpacing-wide gap
            in the middle of itself, so the group ended in line + gap + line. */}
        <ListSection title="Notifications" divider>
          <ListItem
            action={<Switch value={digest} onChange={setDigest} />}
            primaryText="Email digest"
          />
          <ListItem
            action={<Switch value={mentions} onChange={setMentions} />}
            primaryText="Mentions"
          />
        </ListSection>
        <ListSection title="Advanced">
          <ListItem
            action={<Switch value={beta} onChange={setBeta} />}
            primaryText="Experimental features"
          />
        </ListSection>
      </Paper>
    </View>
  );
};

/** `variant="standard"` rows, a `gap` and `showDividers`: a plain list, like a sidebar's. */
export const PlainList = () => (
  <View style={panel}>
    <ListSection title="Projects" gap="xs" showDividers>
      <ListItem
        variant="standard"
        onClick={() => {}}
        icon="folder-outline"
        primaryText="Roadmap"
      />
      <ListItem
        variant="standard"
        onClick={() => {}}
        icon="folder-outline"
        primaryText="Design system"
      />
      <ListItem
        variant="standard"
        onClick={() => {}}
        icon="folder-outline"
        primaryText="Archive"
      />
    </ListSection>
  </View>
);

/** `gap` spaces the items; `divider` is the one rule after the last. */
export const GapAndDivider = () => (
  <View style={panel}>
    <ListSection title="Contained, gap l" gap="l" divider>
      <ListItem primaryText="Email digest" />
      <ListItem primaryText="Mentions" />
      <ListItem primaryText="Comments" />
    </ListSection>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Grouped",
    title: "Grouped",
    render: Grouped,
  },
  {
    name: "SettingsScreen",
    title: "Settings screen",
    render: SettingsScreen,
  },
  {
    name: "PlainList",
    title: "Plain list",
    description:
      '`variant="standard"` rows, a `gap` and `showDividers`: a plain list, like a sidebar\'s.',
    render: PlainList,
  },
  {
    name: "GapAndDivider",
    title: "Gap and divider",
    description:
      "`gap` spaces the items; `divider` is the one rule after the last.",
    render: GapAndDivider,
  },
];

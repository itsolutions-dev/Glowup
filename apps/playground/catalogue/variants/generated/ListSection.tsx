// GENERATED — do not edit.
// Source: .design-sync/previews/ListSection.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import {
  ListSection,
  ListItem,
  Toggle,
  Typography,
  Paper,
} from "@its/glowup-ui";

const panel: ViewStyle = { width: 380, flexDirection: "row" };

export const Grouped = () => (
  <View style={panel}>
    <Paper elevation={1} outline style={{ flex: 1 }}>
      <ListSection title="Notifications">
        <ListItem
          trailing={<Typography variant="bodySmall">Weekly</Typography>}
        >
          Email digest
        </ListItem>
        <ListItem
          trailing={<Typography variant="bodySmall">Instant</Typography>}
        >
          Mentions
        </ListItem>
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
            trailing={<Toggle value={digest} onValueChange={setDigest} />}
          >
            Email digest
          </ListItem>
          <ListItem
            trailing={<Toggle value={mentions} onValueChange={setMentions} />}
          >
            Mentions
          </ListItem>
        </ListSection>
        <ListSection title="Advanced">
          <ListItem trailing={<Toggle value={beta} onValueChange={setBeta} />}>
            Experimental features
          </ListItem>
        </ListSection>
      </Paper>
    </View>
  );
};

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
];

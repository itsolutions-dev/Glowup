import React from "react";
import {
  ListSection,
  ListItem,
  Toggle,
  Typography,
  Paper,
} from "@its/glowup-ui";

const panel: React.CSSProperties = { width: 380, display: "flex" };

export const Grouped = () => (
  <div style={panel}>
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
  </div>
);

// A settings screen is a sequence of labelled groups — not a pile of Cards.
export const SettingsScreen = () => {
  const [digest, setDigest] = React.useState(true);
  const [mentions, setMentions] = React.useState(false);
  const [beta, setBeta] = React.useState(false);

  return (
    <div style={panel}>
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
    </div>
  );
};

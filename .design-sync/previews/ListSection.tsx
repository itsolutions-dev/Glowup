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
      <ListSection title="Notifiche">
        <ListItem
          trailing={<Typography variant="bodySmall">Settimanale</Typography>}
        >
          Riepilogo email
        </ListItem>
        <ListItem
          trailing={<Typography variant="bodySmall">Immediato</Typography>}
        >
          Menzioni
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
        {/* `divider` is left off deliberately: ListSection emits
            <Divider contentSpacing={theme.spacing.s} />, which paints
            line + 16px gap + line. Same defect as Menu's dividerAbove. */}
        <ListSection title="Notifiche">
          <ListItem
            trailing={<Toggle value={digest} onValueChange={setDigest} />}
          >
            Riepilogo email
          </ListItem>
          <ListItem
            trailing={<Toggle value={mentions} onValueChange={setMentions} />}
          >
            Menzioni
          </ListItem>
        </ListSection>
        <ListSection title="Avanzate">
          <ListItem trailing={<Toggle value={beta} onValueChange={setBeta} />}>
            Funzioni sperimentali
          </ListItem>
        </ListSection>
      </Paper>
    </div>
  );
};

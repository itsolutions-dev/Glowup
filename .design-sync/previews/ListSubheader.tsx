import React from "react";
import { ListSubheader, ListItem, Divider, Paper } from "@its/glowup-ui";

export const GroupLabel = () => (
  <div style={{ width: 380, display: "flex" }}>
    <Paper elevation={1} outline style={{ flex: 1 }}>
      {/* Marked as a heading, so assistive tech can jump between groups —
          which a plain Typography line cannot do. */}
      <ListSubheader>Oggi</ListSubheader>
      <ListItem>Revisione impianto 4</ListItem>
      <ListItem>Taratura sensori linea 2</ListItem>
      <Divider contentSpacing={0} />
      <ListSubheader>Domani</ListSubheader>
      <ListItem>Sostituzione filtri</ListItem>
    </Paper>
  </div>
);

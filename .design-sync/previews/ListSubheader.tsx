import React from "react";
import { ListSubheader, ListItem, Divider, Paper } from "@its/glowup-ui";

export const GroupLabel = () => (
  <div style={{ width: 380, display: "flex" }}>
    <Paper elevation={1} outline style={{ flex: 1 }}>
      {/* Marked as a heading, so assistive tech can jump between groups —
          which a plain Typography line cannot do. */}
      <ListSubheader>Today</ListSubheader>
      <ListItem primaryText="Inspect line 4" />
      <ListItem primaryText="Calibrate line 2 sensors" />
      <Divider contentSpacing={0} />
      <ListSubheader>Tomorrow</ListSubheader>
      <ListItem primaryText="Replace filters" />
    </Paper>
  </div>
);

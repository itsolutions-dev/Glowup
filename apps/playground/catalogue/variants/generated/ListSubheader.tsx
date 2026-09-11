// GENERATED — do not edit.
// Source: .design-sync/previews/ListSubheader.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View } from "react-native";
import type { Variant } from "../types";
import { ListSubheader, ListItem, Divider, Paper } from "@its/glowup-ui";

export const GroupLabel = () => (
  <View style={{ width: 380 }}>
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
  </View>
);

export const variants: Variant[] = [
  {
    name: "GroupLabel",
    title: "Group label",
    render: GroupLabel,
  },
];

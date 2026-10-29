// The palette (spec §13): the manifest's components by catalogue group, with
// search. Each entry is a Draggable onto the canvas, and a tap adds it (§2).

import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Draggable,
  Icon,
  ScrollArea,
  SearchBar,
  Typography,
  useTheme,
  type IconSource,
  type Theme,
} from "@its/glowup-ui";

import { addTarget, type NewDragData } from "../canvasMath";
import { MANIFEST, type ManifestEntry } from "../manifest";
import { insertNode } from "../operations";
import type { Editor } from "./useEditor";

export const Palette = ({ editor }: { editor: Editor }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [query, setQuery] = useState("");

  // The manifest lists its entries in the catalogue's group order.
  const groups = useMemo(() => {
    const text = query.trim().toLowerCase();
    const byGroup = new Map<string, ManifestEntry[]>();
    for (const entry of Object.values(MANIFEST)) {
      if (!entry.type.toLowerCase().includes(text)) continue;
      const group = byGroup.get(entry.palette.group) ?? [];
      byGroup.set(entry.palette.group, [...group, entry]);
    }
    return [...byGroup];
  }, [query]);

  // A tap: into the selected container when it takes the type, else the page.
  const add = (type: string) => {
    const { doc, selected, tabs } = editor;
    const next = insertNode(doc, type, addTarget(doc, type, selected, tabs));
    if (!next.id) return;
    editor.apply(next.doc);
    editor.select(next.id);
  };

  return (
    <View style={styles.palette}>
      <View style={styles.search}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search components"
        />
      </View>
      <ScrollArea style={styles.list}>
        {groups.length === 0 ? (
          <Typography
            variant="bodyMedium"
            color="onSurfaceVariant"
            style={styles.empty}
          >
            No components match
          </Typography>
        ) : (
          groups.map(([group, entries]) => (
            <View key={group} style={styles.group}>
              <Typography
                variant="labelMedium"
                color="onSurfaceVariant"
                style={styles.label}
              >
                {group}
              </Typography>
              {entries.map(({ type, palette }) => (
                // The entry itself follows the pointer: the drag system draws a
                // preview at the item's size, and the canvas's draft draws the
                // real component where it will land.
                <Draggable
                  key={type}
                  id={`new:${type}`}
                  testID={`palette-${type}`}
                  data={{ kind: "new", type } satisfies NewDragData}
                  onPress={() => add(type)}
                  accessibilityLabel={`Add ${type}`}
                  style={styles.entry}
                >
                  <Icon
                    // A glyph name: the manifest stays free of library types.
                    source={palette.icon as IconSource}
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Typography variant="bodyMedium">{type}</Typography>
                </Draggable>
              ))}
            </View>
          ))
        )}
      </ScrollArea>
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    palette: {
      width: 280,
      borderRightWidth: 1,
      borderRightColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    search: { padding: 12 },
    list: { flexGrow: 1, flexShrink: 1 },
    empty: { paddingHorizontal: 16, paddingVertical: 8 },
    group: { paddingBottom: 8 },
    label: { paddingHorizontal: 16, paddingVertical: 8 },
    entry: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 40,
      paddingHorizontal: 16,
      borderRadius: theme.shape.small,
    },
  });

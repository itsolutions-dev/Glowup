// The Layers panel (spec §13): the document as a tree to select from, and
// "Move into…", the way to restructure without dragging.

import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  ScrollArea,
  Tree,
  Typography,
  useTheme,
  type Theme,
  type TreeNode,
} from "@its/glowup-ui";

import { layerTree, moveInto, moveTargets, type Layer } from "../panels";
import type { Editor } from "./useEditor";

const TAB_ROW = /^(.+):tab(\d+)$/;

/** The ids of every row that has rows under it: all open at first. */
const containers = (layers: Layer[]): string[] =>
  layers.flatMap((layer) =>
    layer.children ? [layer.id, ...containers(layer.children)] : [],
  );

export const LayersPanel = ({ editor }: { editor: Editor }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { doc, selected } = editor;
  const layers = useMemo(() => layerTree(doc), [doc]);
  const targets = selected ? moveTargets(doc, selected) : [];

  return (
    <ScrollArea style={styles.scroll}>
      <View style={styles.content}>
        <Tree
          data={layers as TreeNode[]}
          defaultExpanded={containers(layers)}
          selectionMode="single"
          selected={selected ? [selected] : []}
          onSelectedChange={(ids) => {
            const id = ids[0] ?? null;
            // A tab's row selects its TabbedPanel and shows that panel.
            const tab = id ? TAB_ROW.exec(id) : null;
            if (tab) {
              editor.select(tab[1]);
              editor.showTab(tab[1], Number(tab[2]));
            } else {
              editor.select(id);
            }
          }}
        />
        {selected && targets.length > 0 ? (
          <View style={styles.move}>
            <Typography variant="labelLarge" color="onSurfaceVariant">
              Move into…
            </Typography>
            {targets.map((target) => {
              const name = target.id
                ? `${target.label} (${target.id})`
                : target.label;
              return (
                <Button
                  key={target.id ?? "page"}
                  variant="text"
                  accessibilityLabel={`Move into ${name}`}
                  onClick={() =>
                    editor.apply(
                      moveInto(doc, selected, target.id, editor.tabs),
                    )
                  }
                >
                  {name}
                </Button>
              );
            })}
          </View>
        ) : null}
      </View>
    </ScrollArea>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { flexGrow: 1, flexShrink: 1 },
    content: { padding: theme.spacing.s, gap: theme.spacing.m },
    move: { gap: theme.spacing.xs, alignItems: "flex-start" },
  });

// The Layouts dialog (spec §12, §14): the saved layouts, newest first — open,
// rename, delete — and a new one, blank or from a starter.

import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Dialog,
  IconButton,
  Input,
  Typography,
  useTheme,
  type Theme,
} from "@its/glowup-ui";

import { emptyDocument, type LayoutDocument } from "../document";
import { recent, type Library } from "../library";
import { STARTERS } from "../starters";

/** A layout's name, committed when the field is left. */
const NameField = ({
  name,
  onRename,
}: {
  name: string;
  onRename: (name: string) => void;
}) => {
  const [text, setText] = useState(name);
  const [seen, setSeen] = useState(name);
  if (seen !== name) {
    setSeen(name);
    setText(name);
  }
  const commit = () => (text.trim() ? onRename(text) : setText(name));
  return (
    <Input
      label={`Name of ${name}`}
      value={text}
      onChange={setText}
      onBlur={commit}
      inputProps={{ onSubmitEditing: commit }}
    />
  );
};

export const LayoutsDialog = ({
  visible,
  onClose,
  library,
  onOpen,
  onNew,
  onRename,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  library: Library;
  onOpen: (id: string) => void;
  onNew: (doc: LayoutDocument) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Dialog visible={visible} onClose={onClose} title="Layouts" width="md">
      <View style={styles.list}>
        {recent(library).map(({ id, doc }) => (
          <View key={id} style={styles.row}>
            <View style={styles.grow}>
              <NameField
                name={doc.name}
                onRename={(name) => onRename(id, name)}
              />
            </View>
            {id === library.open ? (
              <Typography variant="labelMedium" color="primary">
                Open
              </Typography>
            ) : null}
            <IconButton
              icon="folder-open-outline"
              accessibilityLabel={`Open ${doc.name}`}
              disabled={id === library.open}
              onClick={() => onOpen(id)}
            />
            <IconButton
              icon="delete-outline"
              accessibilityLabel={`Delete ${doc.name}`}
              onClick={() => onDelete(id)}
            />
          </View>
        ))}
      </View>
      <Typography variant="labelLarge" color="onSurfaceVariant">
        New layout:
      </Typography>
      <View style={styles.starters}>
        <Button
          variant="tonal"
          onClick={() => onNew(emptyDocument("Nuovo layout"))}
        >
          Blank
        </Button>
        {STARTERS.map(({ id, doc }) => (
          <Button key={id} variant="tonal" onClick={() => onNew(doc)}>
            {doc.name}
          </Button>
        ))}
      </View>
    </Dialog>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    list: { gap: theme.spacing.s, marginBottom: theme.spacing.m },
    row: { flexDirection: "row", alignItems: "center", gap: theme.spacing.xs },
    grow: { flexGrow: 1, flexShrink: 1 },
    starters: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.s,
      marginTop: theme.spacing.s,
    },
  });

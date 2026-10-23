import { useState } from "react";
import {
  IconButton,
  ListItem,
  Snackbar,
  Typography,
  VStack,
  useTheme,
  type SnackbarProps,
} from "@its/glowup-ui";

const props: Partial<SnackbarProps> = {
  message: "Note deleted",
};

const NOTES = [
  { id: "groceries", title: "Groceries", text: "Oat milk, lemons, basil" },
  {
    id: "standup",
    title: "Standup",
    text: "Ship the invoice export on Thursday",
  },
  {
    id: "lisbon",
    title: "Flight to Lisbon",
    text: "Gate closes 20 minutes early",
  },
];

export default function SnackbarExample() {
  const { theme } = useTheme();
  const [notes, setNotes] = useState(NOTES);
  const [removed, setRemoved] = useState<(typeof NOTES)[number] | null>(null);

  const remove = (note: (typeof NOTES)[number]) => {
    setNotes((current) => current.filter((item) => item.id !== note.id));
    setRemoved(note);
  };
  const undo = () =>
    setNotes((current) =>
      NOTES.filter(
        (item) =>
          item.id === removed?.id ||
          current.some((kept) => kept.id === item.id),
      ),
    );

  return (
    // The snackbar sits on the edge of this box, as it does on a phone screen.
    <VStack spacing="s" style={{ minHeight: theme.spacing.xl * 8 }}>
      <Typography variant="titleMedium">Notes</Typography>
      {notes.length === 0 && (
        <Typography variant="bodyMedium" color="onSurfaceVariant">
          No notes left.
        </Typography>
      )}
      {notes.map((note) => (
        <ListItem
          key={note.id}
          icon="note-text-outline"
          primaryText={note.title}
          secondaryText={note.text}
          action={
            <IconButton
              icon="delete-outline"
              accessibilityLabel={`Delete ${note.title}`}
              onClick={() => remove(note)}
            />
          }
        />
      ))}
      <Snackbar
        {...props}
        visible={removed !== null}
        message={props.message ?? ""}
        action={{ label: "Undo", onClick: undo }}
        onDismiss={() => setRemoved(null)}
      />
    </VStack>
  );
}

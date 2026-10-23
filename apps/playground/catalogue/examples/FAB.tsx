import { useState } from "react";
import { ScrollView } from "react-native";
import { Box, FAB, ListItem, type FABProps } from "@its/glowup-ui";

const props: Partial<FABProps> = {
  icon: "plus",
  label: "New note",
  variant: "animated",
};

const NOTES = [
  "Grocery list",
  "Book club picks",
  "Trip packing",
  "Gift ideas",
  "Garden plan",
  "Recipe: shakshuka",
  "Ideas for the talk",
  "Bike service",
  "Movie night",
];

export default function FABExample() {
  const [notes, setNotes] = useState(NOTES);
  // The animated FAB folds into its icon once the list is scrolled.
  const [atTop, setAtTop] = useState(true);

  return (
    // A screen: the floating button sits in the corner of the nearest parent.
    <Box
      background="surfaceContainerLow"
      radius="large"
      height={360}
      style={{ overflow: "hidden" }}
    >
      <ScrollView
        onScroll={(event) => setAtTop(event.nativeEvent.contentOffset.y <= 0)}
        scrollEventThrottle={16}
      >
        {notes.map((note) => (
          <ListItem key={note} icon="note-text-outline" primaryText={note} />
        ))}
      </ScrollView>
      <FAB
        icon="plus"
        {...props}
        extended={atTop}
        onClick={() =>
          setNotes([
            `Untitled note ${notes.length - NOTES.length + 1}`,
            ...notes,
          ])
        }
      />
    </Box>
  );
}

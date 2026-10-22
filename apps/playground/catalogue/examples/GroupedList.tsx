import { useState } from "react";
import {
  IconButton,
  ListItem,
  ListSection,
  ListSubheader,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";

const FILES = [
  { id: "f1", name: "Roadmap 2027.pdf", detail: "Edited yesterday · 2.4 MB" },
  { id: "f2", name: "Q3 numbers.xlsx", detail: "Edited Monday · 640 KB" },
  { id: "f3", name: "Brand guidelines.pdf", detail: "Edited 8 Oct · 12 MB" },
  { id: "f4", name: "Meeting notes.docx", detail: "Edited 2 Oct · 38 KB" },
  { id: "f5", name: "Offsite photos.zip", detail: "Edited 28 Sep · 184 MB" },
];

export default function GroupedList() {
  const { theme } = useTheme();
  const [pinned, setPinned] = useState<string[]>(["f1", "f3"]);

  const toggle = (id: string) =>
    setPinned((all) =>
      all.includes(id) ? all.filter((x) => x !== id) : [...all, id],
    );
  const recent = FILES.filter((f) => !pinned.includes(f.id));
  const row = (file: (typeof FILES)[number]) => (
    <ListItem
      key={file.id}
      icon="file-outline"
      primaryText={file.name}
      secondaryText={file.detail}
      action={
        <IconButton
          icon={pinned.includes(file.id) ? "pin" : "pin-outline"}
          selected={pinned.includes(file.id)}
          accessibilityLabel={`Pin ${file.name}`}
          onClick={() => toggle(file.id)}
        />
      }
    />
  );
  // A section with nothing in it still says why.
  const empty = (text: string) => (
    <Typography
      variant="bodyMedium"
      color="onSurfaceVariant"
      style={{
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.s,
      }}
    >
      {text}
    </Typography>
  );

  return (
    <VStack spacing="xs">
      <ListSection title="Pinned" divider>
        {pinned.length === 0
          ? empty("Pin a file to keep it at the top.")
          : FILES.filter((f) => pinned.includes(f.id)).map(row)}
      </ListSection>
      <ListSection title="Recent" divider>
        {recent.length === 0 ? empty("Everything is pinned.") : recent.map(row)}
      </ListSection>
      <ListSubheader>Shared with you</ListSubheader>
      {empty("Nothing has been shared with you yet.")}
    </VStack>
  );
}

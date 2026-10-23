import { useState } from "react";
import {
  IconButton,
  ListItem,
  ListSubheader,
  Typography,
  VStack,
  type ListSubheaderProps,
} from "@its/glowup-ui";

const props: Pick<ListSubheaderProps, "children"> = {
  children: "Recent files",
};

const FILES = [
  { id: "f1", name: "Roadmap 2027.pdf", detail: "Edited yesterday · 2.4 MB" },
  { id: "f2", name: "Q3 numbers.xlsx", detail: "Edited Monday · 640 KB" },
  { id: "f3", name: "Brand guidelines.pdf", detail: "Edited 8 Oct · 12 MB" },
];

export default function ListSubheaderExample() {
  const [pinned, setPinned] = useState<string[]>(["f1"]);

  const toggle = (id: string) =>
    setPinned((all) =>
      all.includes(id) ? all.filter((x) => x !== id) : [...all, id],
    );

  return (
    <VStack spacing="xs">
      <ListSubheader {...props} />
      {FILES.map((file) => (
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
      ))}
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {pinned.length} of {FILES.length} pinned
      </Typography>
    </VStack>
  );
}

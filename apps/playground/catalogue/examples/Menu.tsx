import { useState } from "react";
import {
  IconButton,
  ListItem,
  Menu,
  Typography,
  VStack,
  type MenuItem,
  type MenuProps,
} from "@its/glowup-ui";

const props: Partial<MenuProps> = {
  anchorPosition: { vertical: "bottom", horizontal: "left" },
};

const ITEMS: MenuItem[] = [
  { id: "rename", label: "Rename", icon: "pencil-outline" },
  {
    id: "duplicate",
    label: "Duplicate",
    icon: "content-copy",
    trailing: "Ctrl+D",
  },
  { id: "share", label: "Share", icon: "share-variant-outline" },
  {
    id: "delete",
    label: "Delete",
    icon: "delete-outline",
    destructive: true,
    dividerAbove: true,
  },
];

export default function MenuExample() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  return (
    <VStack spacing="s">
      <ListItem
        icon="file-pdf-box"
        primaryText="Q3 report.pdf"
        secondaryText={
          last ? `Last action: ${last}` : "2.4 MB, edited yesterday"
        }
        action={
          <Menu
            {...props}
            visible={open}
            onClose={() => setOpen(false)}
            items={ITEMS}
            onClick={(item) => setLast(item.label)}
            anchor={
              <IconButton
                icon="dots-vertical"
                accessibilityLabel="File actions"
                onClick={() => setOpen(true)}
              />
            }
          />
        }
      />
      <Typography variant="bodySmall" color="onSurfaceVariant">
        Open the menu from the three dots.
      </Typography>
    </VStack>
  );
}

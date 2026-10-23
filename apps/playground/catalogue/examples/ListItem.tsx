import { useState } from "react";
import {
  IconButton,
  ListItem,
  Typography,
  VStack,
  type ListItemProps,
} from "@its/glowup-ui";

const props: Partial<ListItemProps> & Pick<ListItemProps, "primaryText"> = {
  primaryText: "Roadmap 2027.pdf",
  secondaryText: "Edited yesterday · 2.4 MB",
  icon: "file-pdf-box",
  variant: "contained",
};

export default function ListItemExample() {
  const [opened, setOpened] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <VStack spacing="xs">
      <Typography variant="titleMedium">Attachments</Typography>
      {/* The whole row opens the file; the download button is a control of its own and never opens the row. */}
      <ListItem
        {...props}
        onClick={() => setOpened(true)}
        action={
          <IconButton
            icon={saved ? "check" : "download-outline"}
            accessibilityLabel="Download"
            onClick={() => setSaved(true)}
          />
        }
      />
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {saved
          ? "Saved to your downloads."
          : opened
            ? `Opened ${props.primaryText}.`
            : "Press the row to open the file, or the arrow to save it without opening it."}
      </Typography>
    </VStack>
  );
}

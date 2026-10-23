import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  ListItem,
  Popover,
  Typography,
  VStack,
  useTheme,
  type PopoverProps,
} from "@its/glowup-ui";

const props: Partial<PopoverProps> = {
  anchorPosition: { vertical: "bottom", horizontal: "left" },
};

const MESSAGES = [
  {
    id: "1",
    from: "Ada",
    subject: "Design review notes",
    unread: true,
    files: true,
  },
  {
    id: "2",
    from: "Marco",
    subject: "Lunch on Friday?",
    unread: true,
    files: false,
  },
  {
    id: "3",
    from: "Billing",
    subject: "Your March invoice",
    unread: false,
    files: true,
  },
];

export default function PopoverExample() {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [withFiles, setWithFiles] = useState(false);

  const shown = MESSAGES.filter(
    (message) =>
      (!unreadOnly || message.unread) && (!withFiles || message.files),
  );

  return (
    <VStack spacing="s">
      <Typography variant="titleMedium">Inbox</Typography>
      <Popover
        {...props}
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Button
            variant="tonal"
            iconName="filter-variant"
            onClick={() => setOpen(true)}
          >
            Filters
          </Button>
        }
      >
        <Box padding={theme.spacing.m} gap={theme.spacing.s}>
          <Checkbox
            label="Unread only"
            checked={unreadOnly}
            onValueChange={setUnreadOnly}
          />
          <Checkbox
            label="With attachments"
            checked={withFiles}
            onValueChange={setWithFiles}
          />
        </Box>
      </Popover>
      {shown.length === 0 && (
        <Typography variant="bodyMedium" color="onSurfaceVariant">
          Nothing matches these filters.
        </Typography>
      )}
      {shown.map((message) => (
        <ListItem
          key={message.id}
          icon={message.files ? "paperclip" : "email-outline"}
          primaryText={message.from}
          secondaryText={message.subject}
          dimmed={!message.unread}
        />
      ))}
    </VStack>
  );
}

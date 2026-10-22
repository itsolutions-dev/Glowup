import { useState } from "react";
import {
  Button,
  HStack,
  ListItem,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";

const MESSAGES = [
  {
    id: "m1",
    from: "Grace Hopper",
    subject: "Release notes for 2.4",
    time: "09:41",
    unread: true,
  },
  {
    id: "m2",
    from: "Alan Turing",
    subject: "Design review moved to Thursday, 3pm",
    time: "08:12",
    unread: true,
  },
  {
    id: "m3",
    from: "Billing",
    subject: "Invoice INV-2041 is ready to download",
    time: "Mon",
    unread: true,
  },
  {
    id: "m4",
    from: "Katherine Johnson",
    subject: "Quarterly numbers, final report attached",
    time: "Mon",
    unread: false,
  },
  { id: "m5", from: "Hedy Lamarr", subject: "", time: "Sun", unread: false },
  {
    id: "m6",
    from: "Linus Torvalds",
    subject: "Re: build times",
    time: "12 Oct",
    unread: false,
  },
];

export default function InboxList() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState(MESSAGES);
  const unread = messages.filter((message) => message.unread).length;

  const markRead = (id: string) =>
    setMessages((all) =>
      all.map((m) => (m.id === id ? { ...m, unread: false } : m)),
    );

  return (
    <VStack spacing="xs">
      <HStack justify="space-between" align="center">
        <Typography variant="titleMedium">
          {unread ? `Inbox (${unread} unread)` : "Inbox"}
        </Typography>
        <Button
          variant="text"
          disabled={unread === 0}
          onClick={() =>
            setMessages((all) => all.map((m) => ({ ...m, unread: false })))
          }
        >
          Mark all read
        </Button>
      </HStack>
      {messages.map((message) => (
        <ListItem
          key={message.id}
          primaryText={message.from}
          secondaryText={message.subject || "(no subject)"}
          primaryTextStyle={message.unread ? { fontWeight: "700" } : undefined}
          indicatorColor={message.unread ? theme.colors.primary : undefined}
          action={
            <Typography variant="labelSmall" color="onSurfaceVariant">
              {message.time}
            </Typography>
          }
          trailingWidth={56}
          onClick={() => markRead(message.id)}
        />
      ))}
    </VStack>
  );
}

import { useState } from "react";
import {
  Button,
  EmptyState,
  ListItem,
  Typography,
  VStack,
  type EmptyStateProps,
} from "@its/glowup-ui";

const props: EmptyStateProps = {
  icon: "email-check-outline",
  title: "You're all caught up",
  description: "New messages from your team will show up here.",
};

const MESSAGES = [
  { id: "m1", from: "Maya Chen", subject: "Invoice for March" },
  { id: "m2", from: "Jonas Weber", subject: "Design review moved" },
  { id: "m3", from: "Priya Nair", subject: "Welcome aboard" },
];

export default function EmptyStateExample() {
  const [messages, setMessages] = useState<typeof MESSAGES>([]);

  return (
    <VStack spacing="s">
      <Typography variant="titleMedium">Inbox</Typography>
      {messages.length === 0 ? (
        <EmptyState
          {...props}
          action={{
            label: "Check for new mail",
            iconName: "refresh",
            onPress: () => setMessages(MESSAGES),
          }}
        />
      ) : (
        <>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              icon="email-outline"
              primaryText={message.subject}
              secondaryText={message.from}
            />
          ))}
          <Button variant="text" onClick={() => setMessages([])}>
            Archive all
          </Button>
        </>
      )}
    </VStack>
  );
}

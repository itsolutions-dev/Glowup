import { useState } from "react";
import {
  ListItem,
  ListSection,
  Switch,
  Typography,
  VStack,
  type SwitchProps,
} from "@its/glowup-ui";

const props: Partial<SwitchProps> = {
  label: "Allow notifications",
};

const TOPICS = [
  {
    id: "mentions",
    icon: "at",
    title: "Mentions",
    detail: "When someone tags you",
  },
  {
    id: "replies",
    icon: "reply-outline",
    title: "Replies",
    detail: "When someone answers you",
  },
  {
    id: "digest",
    icon: "email-newsletter",
    title: "Weekly digest",
    detail: "A summary every Sunday evening",
  },
] as const;

export default function SwitchExample() {
  const [allowed, setAllowed] = useState(true);
  const [topics, setTopics] = useState<Record<string, boolean>>({
    mentions: true,
    replies: true,
  });
  const count = Object.values(topics).filter(Boolean).length;

  return (
    <VStack spacing="s">
      <Switch {...props} value={allowed} onChange={setAllowed} />
      <ListSection title="Notify me about" divider>
        {TOPICS.map((topic) => (
          <ListItem
            key={topic.id}
            icon={topic.icon}
            primaryText={topic.title}
            secondaryText={topic.detail}
            dimmed={!allowed}
            action={
              <Switch
                size={props.size}
                value={!!topics[topic.id]}
                disabled={!allowed}
                onChange={(on) =>
                  setTopics((all) => ({ ...all, [topic.id]: on }))
                }
              />
            }
          />
        ))}
      </ListSection>
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {allowed
          ? `${count} of ${TOPICS.length} topics on`
          : "Notifications are paused."}
      </Typography>
    </VStack>
  );
}

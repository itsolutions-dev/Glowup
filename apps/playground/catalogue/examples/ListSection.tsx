import { useState } from "react";
import {
  ListItem,
  ListSection,
  Switch,
  Typography,
  VStack,
  type ListSectionProps,
} from "@its/glowup-ui";

const props: Partial<ListSectionProps> = {
  title: "Notifications",
  divider: true,
  gap: "xs",
  showDividers: true,
};

const SETTINGS = [
  {
    id: "push",
    icon: "bell-outline",
    title: "Push notifications",
    detail: "Alerts on this device",
  },
  {
    id: "mentions",
    icon: "at",
    title: "Mentions",
    detail: "When someone tags you",
  },
  {
    id: "digest",
    icon: "email-newsletter",
    title: "Weekly digest",
    detail: "A summary every Sunday evening",
  },
] as const;

export default function ListSectionExample() {
  const [on, setOn] = useState<Record<string, boolean>>({
    push: true,
    mentions: true,
    digest: false,
  });
  const count = Object.values(on).filter(Boolean).length;

  return (
    <VStack spacing="s">
      <ListSection {...props}>
        {SETTINGS.map((setting) => {
          // The rows after the first depend on the master switch.
          const off = setting.id !== "push" && !on.push;
          return (
            <ListItem
              key={setting.id}
              variant="standard"
              icon={setting.icon}
              primaryText={setting.title}
              secondaryText={setting.detail}
              dimmed={off}
              action={
                <Switch
                  value={on[setting.id]}
                  disabled={off}
                  onChange={(value) =>
                    setOn((all) => ({ ...all, [setting.id]: value }))
                  }
                />
              }
            />
          );
        })}
      </ListSection>
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {count} of {SETTINGS.length} settings on
      </Typography>
    </VStack>
  );
}

import { useState } from "react";
import {
  ListItem,
  ListSection,
  Switch,
  Typography,
  VStack,
} from "@its/glowup-ui";

const SECTIONS = [
  {
    title: "Notifications",
    items: [
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
        needsPush: true,
      },
      {
        id: "digest",
        icon: "email-newsletter",
        title: "Weekly digest",
        detail: "A summary every Sunday evening",
        needsPush: true,
      },
    ],
  },
  {
    title: "Security",
    items: [
      {
        id: "twoStep",
        icon: "shield-lock-outline",
        title: "Two-step verification",
        detail: "Ask for a code at sign-in",
      },
      {
        id: "biometrics",
        icon: "fingerprint",
        title: "Biometric unlock",
        detail: "Not available on this device",
        unavailable: true,
      },
    ],
  },
] as const;

export default function SettingsList() {
  const [on, setOn] = useState<Record<string, boolean>>({
    push: true,
    mentions: true,
    twoStep: false,
  });
  const count = Object.values(on).filter(Boolean).length;
  const total = SECTIONS.reduce((n, s) => n + s.items.length, 0);

  return (
    <VStack spacing="s">
      {SECTIONS.map((section) => (
        <ListSection key={section.title} title={section.title} divider>
          {section.items.map((item) => {
            // Rows that depend on the master switch fade and lock with it.
            const off = "needsPush" in item && !on.push;
            const locked = "unavailable" in item || off;
            return (
              <ListItem
                key={item.id}
                icon={item.icon}
                primaryText={item.title}
                secondaryText={item.detail}
                dimmed={off}
                disabled={"unavailable" in item}
                action={
                  <Switch
                    value={!!on[item.id]}
                    disabled={locked}
                    onChange={(value) =>
                      setOn((all) => ({ ...all, [item.id]: value }))
                    }
                  />
                }
              />
            );
          })}
        </ListSection>
      ))}
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {count} of {total} settings on
      </Typography>
    </VStack>
  );
}

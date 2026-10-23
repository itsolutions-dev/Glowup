import { useState } from "react";
import {
  Box,
  Button,
  Drawer,
  DrawerItem,
  DrawerSection,
  Typography,
  useTheme,
  type DrawerProps,
} from "@its/glowup-ui";

const props: Partial<DrawerProps> = {
  variant: "swipeable",
  title: "Settings",
  width: 280,
};

const PAGES = {
  profile: {
    label: "Profile",
    icon: "account-outline",
    text: "Your name, photo and email address.",
  },
  security: {
    label: "Security",
    icon: "shield-lock-outline",
    text: "Password and two-step verification.",
  },
  notifications: {
    label: "Notifications",
    icon: "bell-outline",
    text: "What we email you, and when.",
  },
  appearance: {
    label: "Appearance",
    icon: "palette-outline",
    text: "Theme, colours and density.",
  },
  language: {
    label: "Language",
    icon: "translate",
    text: "The language of the app.",
  },
} as const;

type PageId = keyof typeof PAGES;

export default function DrawerExample() {
  const { theme } = useTheme();
  const [page, setPage] = useState<PageId>("profile");
  const [open, setOpen] = useState(false);

  // A static drawer sits beside the screen, on the edge `position` names.
  const vertical = props.position === "top" || props.position === "bottom";
  const atEnd = props.position === "right" || props.position === "bottom";
  const direction = vertical
    ? atEnd
      ? "column-reverse"
      : "column"
    : atEnd
      ? "row-reverse"
      : "row";

  const items = (ids: PageId[]) =>
    ids.map((id) => (
      <DrawerItem
        key={id}
        label={PAGES[id].label}
        icon={PAGES[id].icon}
        selected={page === id}
        onClick={() => {
          setPage(id);
          setOpen(false);
        }}
      />
    ));

  return (
    <Box
      radius="large"
      borderWidth={1}
      borderColor="outlineVariant"
      height={420}
      style={{ flexDirection: direction, overflow: "hidden" }}
    >
      <Drawer {...props} visible={open} onClose={() => setOpen(false)}>
        <DrawerSection>
          {items(["profile", "security", "notifications"])}
        </DrawerSection>
        <DrawerSection title="Preferences" showDivider>
          {items(["appearance", "language"])}
        </DrawerSection>
      </Drawer>
      <Box padding={theme.spacing.m} gap={theme.spacing.s} style={{ flex: 1 }}>
        {props.variant === "swipeable" && (
          <Button variant="tonal" iconName="menu" onClick={() => setOpen(true)}>
            Settings
          </Button>
        )}
        <Typography variant="titleLarge">{PAGES[page].label}</Typography>
        <Typography variant="bodyMedium" color="onSurfaceVariant">
          {PAGES[page].text}
        </Typography>
      </Box>
    </Box>
  );
}

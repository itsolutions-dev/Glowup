import { useState } from "react";
import {
  Box,
  Button,
  Drawer,
  DrawerItem,
  DrawerSection,
  LinkProvider,
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
  theme: {
    label: "Theme",
    icon: "palette-outline",
    text: "Light, dark or the system's.",
  },
  density: {
    label: "Density",
    icon: "view-compact-outline",
    text: "How much fits on a screen.",
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

  // Each item is a link: an anchor on the web (Ctrl-click opens a new tab),
  // and a plain click goes through `navigate`, the app's router.
  const navigate = (href: string) => {
    setPage(href.slice(1) as PageId);
    setOpen(false);
  };

  const items = (ids: PageId[]) =>
    ids.map((id) => (
      <DrawerItem
        key={id}
        label={PAGES[id].label}
        icon={PAGES[id].icon}
        href={`#${id}`}
        selected={page === id}
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
      <LinkProvider navigate={navigate}>
        <Drawer {...props} visible={open} onClose={() => setOpen(false)}>
          <DrawerSection>
            {items(["profile", "security", "notifications"])}
          </DrawerSection>
          <DrawerSection title="Preferences" showDivider>
            <DrawerItem label="Appearance" icon="eye-outline" defaultExpanded>
              {items(["theme", "density"])}
            </DrawerItem>
            {items(["language"])}
          </DrawerSection>
        </Drawer>
      </LinkProvider>
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

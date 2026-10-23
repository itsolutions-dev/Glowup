import { useState } from "react";
import {
  Box,
  FAB,
  IconButton,
  NavigationRail,
  Typography,
  useTheme,
  type NavBarItem,
  type NavigationRailProps,
} from "@its/glowup-ui";

const props: Partial<NavigationRailProps> = {
  showLabels: "always",
  alignment: "top",
};

const PLACES: NavBarItem[] = [
  { id: "files", label: "Files", icon: "folder-outline" },
  { id: "recent", label: "Recent", icon: "clock-outline" },
  {
    id: "shared",
    label: "Shared",
    icon: "account-multiple-outline",
    badgeCount: 2,
  },
  { id: "trash", label: "Trash", icon: "trash-can-outline" },
];

export default function NavigationRailExample() {
  const { theme } = useTheme();
  const [place, setPlace] = useState("files");
  const [files, setFiles] = useState(128);

  const summary: Record<string, string> = {
    files: `${files} files in your drive.`,
    recent: "12 files opened this week.",
    shared: "2 files are waiting for your review.",
    trash: "Files are deleted for good after 30 days.",
  };

  return (
    <Box
      variant="flex"
      radius="large"
      borderWidth={1}
      borderColor="outlineVariant"
      height={400}
      style={{ overflow: "hidden" }}
    >
      <NavigationRail
        {...props}
        items={PLACES}
        activeId={place}
        onItemPress={setPlace}
        header={
          <>
            <IconButton icon="menu" accessibilityLabel="Open menu" />
            <FAB
              icon="plus"
              label="New file"
              placement="inline"
              onClick={() => setFiles((count) => count + 1)}
            />
          </>
        }
      />
      <Box padding={theme.spacing.m} gap={theme.spacing.xs} style={{ flex: 1 }}>
        <Typography variant="headlineSmall">
          {PLACES.find((item) => item.id === place)?.label}
        </Typography>
        <Typography variant="bodyMedium" color="onSurfaceVariant">
          {summary[place]}
        </Typography>
      </Box>
    </Box>
  );
}

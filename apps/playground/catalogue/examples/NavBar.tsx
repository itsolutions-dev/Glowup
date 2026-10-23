import { useState } from "react";
import {
  Avatar,
  Box,
  ListItem,
  NavBar,
  Typography,
  useTheme,
  type NavBarItem,
  type NavBarProps,
} from "@its/glowup-ui";

const props: Partial<NavBarProps> = {
  showLabels: "always",
};

const FOLDERS: NavBarItem[] = [
  { id: "inbox", label: "Inbox", icon: "inbox-outline", badgeCount: 3 },
  { id: "starred", label: "Starred", icon: "star-outline" },
  { id: "sent", label: "Sent", icon: "send-outline" },
  { id: "trash", label: "Trash", icon: "trash-can-outline" },
];

const MAIL: Record<string, [sender: string, subject: string][]> = {
  inbox: [
    ["Lena Fischer", "Lunch on Friday?"],
    ["Omar Haddad", "Invoice 2049"],
    ["Priya Nair", "Roadmap draft"],
  ],
  starred: [["Jonas Weber", "Re: Train tickets"]],
  sent: [
    ["Sofia Rossi", "Photos from Sunday"],
    ["Kenji Mori", "Standup moved"],
  ],
  trash: [],
};

export default function NavBarExample() {
  const { theme } = useTheme();
  const [folder, setFolder] = useState("inbox");
  const mail = MAIL[folder];

  return (
    <Box
      background="surface"
      radius="large"
      borderWidth={1}
      borderColor="outlineVariant"
      height={480}
      width="100%"
      style={{ maxWidth: 360, alignSelf: "center", overflow: "hidden" }}
    >
      <Box padding={theme.spacing.m} style={{ flex: 1 }}>
        <Typography variant="headlineSmall">
          {FOLDERS.find((item) => item.id === folder)?.label}
        </Typography>
        {mail.length === 0 && (
          <Typography variant="bodyMedium" color="onSurfaceVariant">
            Nothing here.
          </Typography>
        )}
        {mail.map(([sender, subject]) => (
          <ListItem
            key={sender}
            icon={<Avatar name={sender} size="small" />}
            primaryText={sender}
            secondaryText={subject}
          />
        ))}
      </Box>
      <NavBar
        {...props}
        items={FOLDERS}
        activeId={folder}
        onClick={setFolder}
      />
    </Box>
  );
}

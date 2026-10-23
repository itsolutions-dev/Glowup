import { useState } from "react";
import { ScrollView } from "react-native";
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  ListItem,
  Typography,
  useTheme,
  type AppBarProps,
} from "@its/glowup-ui";

const props: Partial<AppBarProps> = {
  title: "Inbox",
  variant: "small",
};

const MAIL = [
  ["Lena Fischer", "Lunch on Friday?", "Are you free around one o'clock?"],
  ["Omar Haddad", "Invoice 2049", "The PDF is attached, due on the 30th."],
  ["Priya Nair", "Roadmap draft", "I added the Q1 items, can you review?"],
  ["Jonas Weber", "Re: Train tickets", "Booked, the 9:40 from Turin."],
  ["Sofia Rossi", "Photos from Sunday", "Here is the album, 42 pictures."],
  ["Kenji Mori", "Standup moved", "We start at 10:15 from tomorrow."],
  ["Elif Demir", "New logo options", "Three directions, my favourite is B."],
  ["Noah Okafor", "Welcome aboard", "Your accounts are ready to use."],
] as const;

export default function AppBarExample() {
  const { theme } = useTheme();
  const [open, setOpen] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const mail = open === null ? null : MAIL[open];

  const show = (next: number | null) => {
    setOpen(next);
    setScrolled(false);
  };

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
      <AppBar
        elevated={scrolled}
        {...props}
        safeArea={false}
        leading={
          mail ? (
            <IconButton
              icon="arrow-left"
              accessibilityLabel="Back"
              onClick={() => show(null)}
            />
          ) : (
            <IconButton icon="menu" accessibilityLabel="Open menu" />
          )
        }
        actions={
          mail ? (
            <IconButton
              icon="delete-outline"
              accessibilityLabel="Delete"
              onClick={() => show(null)}
            />
          ) : (
            <IconButton icon="magnify" accessibilityLabel="Search" />
          )
        }
      />
      <ScrollView
        scrollEventThrottle={16}
        onScroll={(event) => setScrolled(event.nativeEvent.contentOffset.y > 0)}
      >
        {mail ? (
          <Box padding={theme.spacing.m} gap={theme.spacing.s}>
            <Typography variant="titleMedium">{mail[1]}</Typography>
            <Typography variant="bodySmall" color="onSurfaceVariant">
              From {mail[0]}
            </Typography>
            <Typography variant="bodyMedium">{mail[2]}</Typography>
          </Box>
        ) : (
          MAIL.map(([sender, subject], index) => (
            <ListItem
              key={sender}
              icon={<Avatar name={sender} size="small" />}
              primaryText={sender}
              secondaryText={subject}
              onClick={() => show(index)}
            />
          ))
        )}
      </ScrollView>
    </Box>
  );
}

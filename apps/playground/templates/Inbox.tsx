import { useState } from "react";
import { View } from "react-native";
import {
  Avatar,
  Badge,
  Box,
  Button,
  ChipGroup,
  ConfirmDialog,
  Divider,
  EmptyState,
  HStack,
  IconButton,
  ListItem,
  SearchBar,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";

interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  starred: boolean;
}

const MESSAGES: Message[] = [
  {
    id: "1",
    from: "Grace Hopper",
    subject: "Release notes for 2.4",
    preview: "I went through the changelog and flagged two breaking changes…",
    time: "09:41",
    unread: true,
    starred: true,
  },
  {
    id: "2",
    from: "Alan Turing",
    subject: "Design review on Thursday",
    preview:
      "Can we move the review to 3pm? The prototype needs one more pass.",
    time: "08:12",
    unread: true,
    starred: false,
  },
  {
    id: "3",
    from: "Katherine Johnson",
    subject: "Quarterly numbers",
    preview: "Attached the final report. Revenue is up 12% on last quarter.",
    time: "Yesterday",
    unread: false,
    starred: true,
  },
  {
    id: "4",
    from: "Linus Torvalds",
    subject: "Re: build times",
    preview: "Caching the dependencies cut the pipeline from 14 to 6 minutes.",
    time: "Mon",
    unread: false,
    starred: false,
  },
];

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread", icon: "email-outline" },
  { value: "starred", label: "Starred", icon: "star-outline" },
] as const;

/**
 * List–detail mail. Side by side on a wide container; on a narrow one the
 * detail replaces the list and a back button returns to it.
 */
export default function Inbox() {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const [messages, setMessages] = useState(MESSAGES);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>("1");
  // On a narrow container the detail covers the list only while reading.
  const [reading, setReading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isWide = width >= 640;

  const visible = messages.filter(
    (message) =>
      (filter === "all" ||
        (filter === "unread" && message.unread) ||
        (filter === "starred" && message.starred)) &&
      `${message.from} ${message.subject}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const selected = messages.find((message) => message.id === selectedId);

  const open = (id: string) => {
    setSelectedId(id);
    setReading(true);
    setMessages((all) =>
      all.map((m) => (m.id === id ? { ...m, unread: false } : m)),
    );
  };

  const toggleStar = (id: string) =>
    setMessages((all) =>
      all.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)),
    );

  const remove = () => {
    setMessages((all) => all.filter((m) => m.id !== selectedId));
    setSelectedId(null);
    setReading(false);
    setConfirmDelete(false);
  };

  const list = (
    <VStack spacing="m" style={{ flex: 1 }}>
      <VStack spacing="s" px="m" pt="m">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search mail"
        />
        <ChipGroup
          required
          accessibilityLabel="Filter"
          options={[...FILTERS]}
          value={filter}
          onValueChange={setFilter}
        />
      </VStack>
      {visible.length === 0 ? (
        <EmptyState
          icon="email-search-outline"
          title="No messages"
          description="Nothing matches this search and filter."
          action={{
            label: "Clear filters",
            onPress: () => {
              setQuery("");
              setFilter("all");
            },
          }}
        />
      ) : (
        <View>
          {visible.map((message) => (
            <ListItem
              key={message.id}
              onPress={() => open(message.id)}
              leading={<Avatar name={message.from} size={40} />}
              secondary={`${message.subject} — ${message.preview}`}
              trailing={
                <HStack spacing="s" align="center">
                  {message.unread && <Badge size="small" />}
                  <Typography
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {message.time}
                  </Typography>
                </HStack>
              }
              itemContainerStyle={
                isWide && message.id === selectedId
                  ? { backgroundColor: theme.colors.primaryContainer }
                  : undefined
              }
              itemTextStyle={message.unread ? { fontWeight: "700" } : undefined}
            >
              {message.from}
            </ListItem>
          ))}
        </View>
      )}
    </VStack>
  );

  const detail = selected ? (
    <VStack spacing="l" p="l" style={{ flex: 1 }}>
      <HStack justify="space-between" align="center">
        {!isWide ? (
          <IconButton
            icon="arrow-left"
            accessibilityLabel="Back to inbox"
            onPress={() => setReading(false)}
          />
        ) : (
          <View />
        )}
        <HStack spacing="xs">
          <IconButton
            icon={selected.starred ? "star" : "star-outline"}
            selected={selected.starred}
            accessibilityLabel="Star"
            onPress={() => toggleStar(selected.id)}
          />
          <IconButton icon="archive-outline" accessibilityLabel="Archive" />
          <IconButton
            icon="delete-outline"
            accessibilityLabel="Delete"
            onPress={() => setConfirmDelete(true)}
          />
        </HStack>
      </HStack>

      <Typography
        variant="headlineSmall"
        style={{ color: theme.colors.onSurface }}
      >
        {selected.subject}
      </Typography>

      <HStack spacing="m" align="center">
        <Avatar name={selected.from} size={40} />
        <VStack flex={1}>
          <Typography
            variant="titleSmall"
            style={{ color: theme.colors.onSurface }}
          >
            {selected.from}
          </Typography>
          <Typography
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            to me · {selected.time}
          </Typography>
        </VStack>
      </HStack>

      <Divider />

      <Typography variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
        {selected.preview} Let me know what you think before Friday, and I will
        fold your notes into the next draft.
      </Typography>

      <HStack spacing="s" wrap>
        <Button iconName="reply">Reply</Button>
        <Button mode="outlined" iconName="share-outline">
          Forward
        </Button>
      </HStack>
    </VStack>
  ) : (
    <EmptyState
      icon="email-open-outline"
      title="No message selected"
      description="Pick a conversation from the list to read it here."
    />
  );

  return (
    <Box
      radius="extraLarge"
      bg="surface"
      borderWidth={1}
      borderColor="outlineVariant"
      style={{ overflow: "hidden", minHeight: 480 }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {isWide ? (
        <HStack align="stretch" spacing={0} style={{ flex: 1 }}>
          <View style={{ width: 320 }}>{list}</View>
          <Divider orientation="vertical" />
          {detail}
        </HStack>
      ) : reading && selected ? (
        detail
      ) : (
        list
      )}

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this message?"
        message="It will be moved to the bin and removed after 30 days."
        confirmText="Delete"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </Box>
  );
}

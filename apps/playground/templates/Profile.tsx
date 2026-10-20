import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardTitle,
  Chip,
  Divider,
  HStack,
  IconButton,
  LinearProgress,
  ListItem,
  ListSection,
  StatusBadge,
  TabContent,
  Tabs,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";

const SKILLS = [
  "React Native",
  "TypeScript",
  "Design systems",
  "Accessibility",
];

const COUNTS = [
  { label: "Projects", value: "24" },
  { label: "Followers", value: "1.2k" },
  { label: "Following", value: "180" },
];

const ACTIVITY = [
  { icon: "source-pull", text: "Merged “Dark theme tokens”", time: "2h ago" },
  {
    icon: "comment-outline",
    text: "Commented on “Checkout flow”",
    time: "5h ago",
  },
  { icon: "star-outline", text: "Starred glowup-ui", time: "Yesterday" },
] as const;

const PROJECTS = [
  { name: "Atlas", summary: "Mobile banking app", progress: 0.82, live: true },
  {
    name: "Beacon",
    summary: "Fleet tracking dashboard",
    progress: 0.41,
    live: false,
  },
];

/**
 * A public profile: identity first (avatar, name, the two actions), then the
 * three counts, then tabs. Projects are cards because each one is acted on as
 * a whole; activity and details are lists.
 */
export default function Profile() {
  const { theme } = useTheme();
  const [tab, setTab] = useState(0);
  const [following, setFollowing] = useState(false);

  return (
    <Box
      radius="extraLarge"
      bg="surface"
      borderWidth={1}
      borderColor="outlineVariant"
      style={{ overflow: "hidden" }}
    >
      {/* Cover band; the avatar overlaps its lower edge. */}
      <Box bg="tertiaryContainer" height={112} />

      <VStack
        spacing="m"
        px="l"
        style={{ marginTop: -(theme.spacing.xl + theme.spacing.m) }}
      >
        <HStack justify="space-between" align="flex-end" wrap spacing="m">
          <Box
            radius={56}
            p="xs"
            bg="surface"
            style={{ alignSelf: "flex-start" }}
          >
            <Avatar name="Ada Lovelace" size={96} status="online" />
          </Box>
          <HStack spacing="s">
            <Button
              variant={following ? "tonal" : "filled"}
              iconName={following ? "check" : "account-plus-outline"}
              onClick={() => setFollowing((value) => !value)}
            >
              {following ? "Following" : "Follow"}
            </Button>
            <Button variant="outlined" iconName="message-outline">
              Message
            </Button>
            <IconButton icon="dots-vertical" accessibilityLabel="More" />
          </HStack>
        </HStack>

        <VStack spacing="xs">
          <Typography
            variant="headlineSmall"
            style={{ color: theme.colors.onSurface }}
          >
            Ada Lovelace
          </Typography>
          <Typography
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Staff engineer · London · Building analytical engines since 1843
          </Typography>
        </VStack>

        <HStack spacing="s" wrap>
          {SKILLS.map((skill) => (
            <Chip key={skill} label={skill} variant="outlined" size="small" />
          ))}
        </HStack>

        <HStack spacing="xl">
          {COUNTS.map((count) => (
            <VStack key={count.label}>
              <Typography
                variant="titleLarge"
                style={{ color: theme.colors.onSurface }}
              >
                {count.value}
              </Typography>
              <Typography
                variant="labelMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {count.label}
              </Typography>
            </VStack>
          ))}
        </HStack>
      </VStack>

      <Box mt="m">
        <Tabs
          tabs={["Activity", "Projects", "About"]}
          activeTab={tab}
          onChange={setTab}
        />
        <Divider />
      </Box>

      <TabContent
        activeTab={tab}
        style={{ backgroundColor: theme.colors.surface }}
      >
        <Box py="s">
          {ACTIVITY.map((item) => (
            <ListItem
              key={item.text}
              leading={<Avatar icon={item.icon} size={36} variant="rounded" />}
              secondary={item.time}
            >
              {item.text}
            </ListItem>
          ))}
        </Box>

        <Box p="l">
          <HStack wrap spacing="m" align="stretch">
            {PROJECTS.map((project) => (
              <Card
                key={project.name}
                variant="outlined"
                style={{ flexGrow: 1, flexBasis: 240 }}
              >
                <CardTitle
                  title={project.name}
                  subtitle={project.summary}
                  endIcon={
                    <StatusBadge
                      label={project.live ? "Live" : "Draft"}
                      type={project.live ? "success" : "warning"}
                    />
                  }
                />
                <CardContent>
                  <VStack spacing="xs">
                    <Typography
                      variant="labelMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {Math.round(project.progress * 100)}% complete
                    </Typography>
                    <LinearProgress progress={project.progress} />
                  </VStack>
                </CardContent>
                <CardActions>
                  <Button variant="text">Open</Button>
                </CardActions>
              </Card>
            ))}
          </HStack>
        </Box>

        <ListSection title="Contact">
          <ListItem
            leading={
              <Avatar icon="email-outline" size={36} variant="rounded" />
            }
            secondary="ada@example.com"
          >
            Email
          </ListItem>
          <ListItem
            leading={<Avatar icon="web" size={36} variant="rounded" />}
            secondary="ada.dev"
          >
            Website
          </ListItem>
          <ListItem
            leading={
              <Avatar icon="calendar-outline" size={36} variant="rounded" />
            }
            secondary="March 2019"
          >
            Member since
          </ListItem>
        </ListSection>
      </TabContent>
    </Box>
  );
}

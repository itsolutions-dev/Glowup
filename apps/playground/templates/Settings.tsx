import { useState } from "react";
import {
  Avatar,
  Banner,
  Box,
  Button,
  ButtonGroup,
  Chip,
  ConfirmDialog,
  Divider,
  HStack,
  Icon,
  ListItem,
  ListSection,
  Select,
  Slider,
  Switch,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";

const LANGUAGES = [
  { id: "en", label: "English", value: "en" },
  { id: "it", label: "Italiano", value: "it" },
  { id: "de", label: "Deutsch", value: "de" },
];

const INITIAL = {
  push: true,
  email: false,
  digest: true,
  language: "en",
  textSize: 100,
};

/**
 * Settings as a sequence of labelled groups — ListSection, not a pile of
 * cards. Edits are held as a draft against the saved values; a banner offers
 * Save and Discard as soon as they differ. The appearance switch drives the
 * real theme.
 */
export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [saved, setSaved] = useState(INITIAL);
  const [draft, setDraft] = useState(INITIAL);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  const set = <K extends keyof typeof INITIAL>(
    key: K,
    value: (typeof INITIAL)[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <Box
      radius="extraLarge"
      background="surface"
      borderWidth={1}
      borderColor="outlineVariant"
      style={{ overflow: "hidden" }}
    >
      <VStack spacing="xs" padding={24}>
        <Typography
          variant="headlineSmall"
          style={{ color: theme.colors.onSurface }}
        >
          Settings
        </Typography>
        <Typography
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Manage your account and how the app behaves on this device.
        </Typography>
      </VStack>

      <Banner
        visible={dirty}
        type="info"
        icon="content-save-alert-outline"
        message="You have unsaved changes."
        actions={[
          { label: "Discard", onPress: () => setDraft(saved) },
          { label: "Save", onPress: () => setSaved(draft) },
        ]}
      />

      <ListSection title="Account" divider>
        <ListItem
          icon={<Avatar name="Ada Lovelace" size={40} status="online" />}
          secondaryText="ada@example.com"
          action={<Chip label="Admin" size="small" variant="tonal" />}
          onClick={() => {}}
          primaryText="Ada Lovelace"
        />
        <ListItem
          icon={<Icon source="lock-outline" />}
          secondaryText="Last changed 3 months ago"
          action={<Icon source="chevron-right" />}
          onClick={() => {}}
          primaryText="Password"
        />
        <ListItem
          icon={<Icon source="shield-check-outline" />}
          secondaryText="Authenticator app"
          action={<Chip label="On" size="small" icon="check" />}
          onClick={() => {}}
          primaryText="Two-step verification"
        />
      </ListSection>

      <ListSection title="Appearance" divider>
        <VStack
          spacing="m"
          style={{ paddingHorizontal: 16, paddingBottom: 16 }}
        >
          <ButtonGroup
            type="connected"
            accessibilityLabel="Theme"
            options={[
              { value: "light", label: "Light", icon: "white-balance-sunny" },
              { value: "dark", label: "Dark", icon: "weather-night" },
            ]}
            value={theme.isDark ? "dark" : "light"}
            onValueChange={(value: string) =>
              value !== (theme.isDark ? "dark" : "light") && toggleTheme()
            }
          />
          <Slider
            label="Text size"
            value={draft.textSize}
            onValueChange={(value) => set("textSize", value)}
            min={80}
            max={140}
            step={10}
            marks
            showValueLabel
          />
          <Select
            label="Language"
            value={draft.language}
            onChange={(value) => set("language", value)}
            options={LANGUAGES}
          />
        </VStack>
      </ListSection>

      <ListSection title="Notifications" divider>
        <ListItem
          secondaryText="Mentions, replies and assignments"
          action={
            <Switch
              value={draft.push}
              onChange={(value) => set("push", value)}
            />
          }
          primaryText="Push notifications"
        />
        <ListItem
          secondaryText="Everything that needs your attention"
          action={
            <Switch
              value={draft.email}
              onChange={(value) => set("email", value)}
            />
          }
          primaryText="Email alerts"
        />
        <ListItem
          secondaryText="One summary every Monday"
          action={
            <Switch
              value={draft.digest}
              onChange={(value) => set("digest", value)}
            />
          }
          primaryText="Weekly digest"
        />
      </ListSection>

      <VStack spacing="s" padding={24}>
        <Typography variant="titleSmall" style={{ color: theme.colors.error }}>
          Danger zone
        </Typography>
        <Divider />
        <HStack justify="space-between" align="center" wrap spacing="m">
          <Typography
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, flexShrink: 1 }}
          >
            Delete the account and every project in it. This cannot be undone.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            iconName="delete-outline"
            onClick={() => setConfirmDelete(true)}
          >
            Delete account
          </Button>
        </HStack>
      </VStack>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete your account?"
        message="All 24 projects and their history will be removed permanently."
        confirmText="Delete"
        onConfirm={() => setConfirmDelete(false)}
        onCancel={() => setConfirmDelete(false)}
      />
    </Box>
  );
}

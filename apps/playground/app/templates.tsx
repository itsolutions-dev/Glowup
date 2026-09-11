import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  CardTitle,
  Checkbox,
  Chip,
  DataGrid,
  Divider,
  FormControl,
  Input,
  LinearProgress,
  Link,
  ListItem,
  ListSection,
  Select,
  Stat,
  StatusBadge,
  Toggle,
  Typography,
  useTheme,
  type Theme,
} from "@its/glowup-ui";

import { CodeBlock } from "../site/CodeBlock";
import { DemoErrorBoundary } from "../site/ErrorBoundary";
import { Page, Section } from "../site/Page";
import { useLayout } from "../site/breakpoints";

/**
 * Whole screens assembled from the kit.
 *
 * The component reference answers "what does this prop do"; this page answers
 * "what does a screen built out of these look like" — hierarchy, density and
 * spacing at the scale of a page rather than a widget. Everything here is
 * generic on purpose: the playground carries no product code, no API client and
 * no domain model, so these are shapes to copy, not an app to run.
 */
const NAVIGATION = `import { createDrawerNavigator } from "@react-navigation/drawer";
import { AppBar, useTheme } from "@its/glowup-ui";

const Drawer = createDrawerNavigator();

export const AppNavigator = ({ routes }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isPinned = width >= 840;

  return (
    <Drawer.Navigator
      screenOptions={{
        // AppBar renders the navigator's header: it reads navigation, route
        // and options straight from the header contract.
        header: (props) => <AppBar {...props} isPinned={isPinned} />,
        drawerType: isPinned ? "permanent" : "front",
        headerStyle: { backgroundColor: theme.colors.surface },
        headerShadowVisible: false,
      }}
    >
      {routes.map((route) => (
        <Drawer.Screen key={route.name} {...route} />
      ))}
    </Drawer.Navigator>
  );
};`;

export default function Templates() {
  return (
    <Page
      eyebrow="Composition"
      title="Templates"
      description="Three screens built only from Glowup components and theme tokens — the level at which spacing, hierarchy and surface choices actually get decided."
    >
      <Section
        title="Sign in"
        description="Form controls, validation copy and the action row. FormControl owns the label, the required marker and the error line so no screen re-invents them."
      >
        <TemplateFrame maxWidth={420} label="Sign in">
          <SignInTemplate />
        </TemplateFrame>
      </Section>

      <Section
        title="Settings"
        description="A grouped list. ListSection gives the group its heading and dividers; the trailing slot is where a Toggle or a value goes."
      >
        <TemplateFrame maxWidth={520} label="Settings">
          <SettingsTemplate />
        </TemplateFrame>
      </Section>

      <Section
        title="Navigation"
        description="The library ships navigation widgets but no navigator — picking a router is the app's call. AppBar takes react-navigation's header contract, so wiring it up looks like this."
      >
        <CodeBlock code={NAVIGATION} title="AppNavigator.tsx" />
      </Section>

      <Section
        title="Dashboard"
        description="Stat tiles over a data table. The tiles carry the numbers a reader scans for; the grid carries the rows they drill into."
      >
        <TemplateFrame maxWidth={880} label="Dashboard">
          <DashboardTemplate />
        </TemplateFrame>
      </Section>
    </Page>
  );
}

/** A neutral surface to put a screen on, capped at the width it was designed for. */
const TemplateFrame = ({
  children,
  maxWidth,
  label,
}: {
  children: React.ReactNode;
  maxWidth: number;
  label: string;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.frame}>
      <View style={[styles.frameInner, { maxWidth }]}>
        <DemoErrorBoundary label={label}>{children}</DemoErrorBoundary>
      </View>
    </View>
  );
};

const SignInTemplate = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const emailError =
    email.length > 0 && !email.includes("@") ? "Enter a valid address" : "";

  return (
    <Card variant="outlined">
      <CardTitle
        title="Welcome back"
        subtitle="Sign in to continue"
        left={<Avatar name="Glowup" size={40} />}
      />
      <CardContent>
        <View style={styles.formGap}>
          <FormControl label="Email" required error={emailError}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              leadingIcon="email-outline"
              placeholder="you@example.com"
            />
          </FormControl>
          <FormControl
            label="Password"
            required
            helperText="At least 8 characters"
          >
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leadingIcon="lock-outline"
            />
          </FormControl>
          <View style={styles.row}>
            <Checkbox
              checked={remember}
              onValueChange={setRemember}
              label="Remember me"
            />
            <Link href="#" onPress={() => {}}>
              Forgot password?
            </Link>
          </View>
        </View>
      </CardContent>
      <CardActions align="end">
        <Button mode="text" onPress={() => {}}>
          Create account
        </Button>
        <Button mode="filled" iconName="login" onPress={() => {}}>
          Sign in
        </Button>
      </CardActions>
    </Card>
  );
};

const SettingsTemplate = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [notifications, setNotifications] = useState(true);
  const [digest, setDigest] = useState(false);
  const [locale, setLocale] = useState("en");

  return (
    <View style={styles.card}>
      <ListSection title="Account" divider>
        <ListItem
          leading={<Avatar name="Ada Lovelace" size={36} status="online" />}
          secondary="ada@example.com"
          trailing={<Chip label="Admin" size="small" mode="tonal" />}
          onPress={() => {}}
        >
          Ada Lovelace
        </ListItem>
        <ListItem secondary="Last changed 3 months ago" onPress={() => {}}>
          Password
        </ListItem>
      </ListSection>

      <ListSection title="Notifications" divider>
        <ListItem
          secondary="Push alerts on this device"
          trailing={
            <Toggle value={notifications} onValueChange={setNotifications} />
          }
        >
          Push notifications
        </ListItem>
        <ListItem
          secondary="One email every Monday"
          trailing={<Toggle value={digest} onValueChange={setDigest} />}
        >
          Weekly digest
        </ListItem>
      </ListSection>

      <ListSection title="Preferences">
        <View style={styles.inlineControl}>
          <Select
            label="Language"
            value={locale}
            onSelect={setLocale}
            options={[
              { id: "en", label: "English", value: "en" },
              { id: "it", label: "Italiano", value: "it" },
              { id: "fr", label: "Français", value: "fr" },
            ]}
          />
        </View>
      </ListSection>
    </View>
  );
};

const ROWS = [
  { id: 1, project: "Atlas", owner: "Ada", status: "On track", progress: 0.82 },
  {
    id: 2,
    project: "Beacon",
    owner: "Grace",
    status: "At risk",
    progress: 0.41,
  },
  {
    id: 3,
    project: "Cascade",
    owner: "Alan",
    status: "On track",
    progress: 0.66,
  },
  {
    id: 4,
    project: "Delta",
    owner: "Katherine",
    status: "Blocked",
    progress: 0.12,
  },
];

const DashboardTemplate = () => {
  const { theme } = useTheme();
  const layout = useLayout();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const columns = useMemo(
    () => [
      { id: "project", label: "Project", width: 160 },
      { id: "owner", label: "Owner", width: 140 },
      { id: "status", label: "Status", width: 140 },
    ],
    [],
  );

  return (
    <View style={styles.dashboard}>
      <View style={[styles.tiles, layout.isCompact && styles.tilesStacked]}>
        <View style={styles.tile}>
          <Stat
            label="Active projects"
            value="12"
            icon="folder-outline"
            trend="up"
            delta="+2"
          />
        </View>
        <View style={styles.tile}>
          <Stat label="On track" value="8" icon="check-circle-outline" />
        </View>
        <View style={styles.tile}>
          <Stat
            label="At risk"
            value="3"
            icon="alert-circle-outline"
            trend="down"
            delta="-1"
            invertTrendColors
          />
        </View>
      </View>

      <Card variant="outlined">
        <CardTitle
          title="Delivery"
          subtitle="This quarter"
          right={<StatusBadge label="Live" type="success" />}
        />
        <CardContent>
          <View style={styles.formGap}>
            <Typography
              variant="labelMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Overall completion
            </Typography>
            <LinearProgress progress={0.63} height={8} />
            <Divider />
            <DataGrid data={ROWS} columns={columns} density="dense" />
          </View>
        </CardContent>
      </Card>
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    frame: {
      alignItems: "center",
      padding: theme.spacing.l,
      borderRadius: theme.shape.large,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    frameInner: { width: "100%" },
    card: {
      borderRadius: theme.shape.large,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
    },
    formGap: { gap: theme.spacing.m },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: theme.spacing.s,
    },
    inlineControl: { padding: theme.spacing.m },
    dashboard: { gap: theme.spacing.m },
    tiles: { flexDirection: "row", gap: theme.spacing.m },
    tilesStacked: { flexDirection: "column" },
    tile: { flexGrow: 1, flexBasis: 160 },
  });

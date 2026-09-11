import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { Banner, Typography, useTheme, type Theme } from "@its/glowup-ui";

import { CodeBlock } from "../site/CodeBlock";
import { Page, Section } from "../site/Page";

const INSTALL = `npm install @its/glowup-ui`;

const PEERS = `npx expo install \\
  react-native-safe-area-context \\
  react-native-svg \\
  @expo/vector-icons`;

const PROVIDERS = `import {
  ThemeProvider,
  AlertProvider,
  AlertProviderWrapper,
  ToastProvider,
} from "@its/glowup-ui";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AlertProvider>
          <AlertProviderWrapper>
            <ToastProvider>
              <Screens />
            </ToastProvider>
          </AlertProviderWrapper>
        </AlertProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}`;

const FIRST_SCREEN = `import { Button, Typography, VStack } from "@its/glowup-ui";

export const Screens = () => (
  <VStack p="m" spacing="s">
    <Typography variant="headlineMedium">Hello</Typography>
    <Button iconName="check" onPress={() => {}}>
      Tap me
    </Button>
  </VStack>
);`;

const THEME_HOOK = `import { useTheme } from "@its/glowup-ui";

const { theme, toggleTheme } = useTheme();
// theme.colors.primary, theme.spacing.m, theme.shape.large, theme.isDark`;

const OPTIONAL_PEERS: { components: string; peer: string }[] = [
  {
    components:
      "DateTimePicker, DatePicker, DatePickerInput, DateRangePicker, TimePicker",
    peer: "expo-localization",
  },
  { components: "StatusBar", peer: "expo-status-bar" },
];

export default function GettingStarted() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Page
      eyebrow="Setup"
      title="Getting started"
      description="Install the package, mount the providers, and everything in the reference works as documented."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message="Glowup is pre-1.0. The API can still change between minor versions — pin the version you build against."
        />
      }
    >
      <Section title="1. Install" description="The package itself.">
        <CodeBlock code={INSTALL} language="bash" title="Terminal" />
      </Section>

      <Section
        title="2. Install the peer dependencies"
        description="Native modules are peers so your app owns their versions. These three are needed by the library as a whole."
      >
        <CodeBlock code={PEERS} language="bash" title="Terminal" />
        <View style={styles.peerTable}>
          <Typography
            variant="labelSmall"
            style={[styles.tableHead, { color: theme.colors.onSurfaceVariant }]}
          >
            ONLY IF YOU USE THEM
          </Typography>
          {OPTIONAL_PEERS.map((row) => (
            <View key={row.peer} style={styles.peerRow}>
              <Icons
                name="package-variant-closed"
                size={16}
                color={theme.colors.primary}
              />
              <Typography
                variant="bodySmall"
                style={{ color: theme.colors.onSurface, flex: 1 }}
              >
                {row.components}
              </Typography>
              <Typography
                variant="labelMedium"
                style={{ color: theme.colors.primary }}
              >
                {row.peer}
              </Typography>
            </View>
          ))}
        </View>
      </Section>

      <Section
        title="3. Mount the providers"
        description="ThemeProvider is required; AlertProvider and ToastProvider only if you call Alert() or useToast(). AlertProviderWrapper is what binds the Alert singleton to the web dialog — mount it inside AlertProvider."
      >
        <CodeBlock code={PROVIDERS} title="App.tsx" />
      </Section>

      <Section
        title="4. Build a screen"
        description="Layout primitives take token names, not numbers, so a screen never hardcodes a spacing value."
      >
        <CodeBlock code={FIRST_SCREEN} title="Screens.tsx" />
      </Section>

      <Section
        title="5. Read the theme"
        description="Everything the library paints comes from here, and so should everything you build beside it."
      >
        <CodeBlock code={THEME_HOOK} title="anywhere.tsx" />
      </Section>
    </Page>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    peerTable: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.shape.medium,
      overflow: "hidden",
    },
    tableHead: {
      letterSpacing: 1.2,
      fontWeight: "700",
      padding: theme.spacing.s,
      backgroundColor: theme.colors.surfaceContainerHigh,
    },
    peerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
      padding: theme.spacing.m,
      flexWrap: "wrap",
    },
  });

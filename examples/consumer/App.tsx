/**
 * A consumer of `@its/glowup-ui` as an outside app sees it: installed from the
 * npm registry, reached only through the package name, typed only by the
 * published `.d.ts`.
 *
 * It is deliberately small — the playground is what demos all 85 components.
 * What this file has to touch is the part of the contract a local workspace
 * install cannot prove:
 *
 *  - the export map resolves for a bundler (the runtime entry),
 *  - the published types resolve and are usable, including the explicit theme
 *    token types added in 0.4.0. Those exist because the emitted `.d.ts` used
 *    to import `theme.json`, which is not shipped; typing a value as
 *    `ThemeColorTokens` here fails the smoke test if that ever regresses,
 *  - the declared peer dependencies are enough to render.
 */
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Input,
  StatusBar,
  ThemeProvider,
  Toggle,
  ToastProvider,
  Typography,
  useTheme,
  useToast,
} from "@its/glowup-ui";
import type {
  MaterialCommunityIconsGlyphs,
  Theme,
  ThemeColorTokens,
} from "@its/glowup-ui";

// Type-only assertions on the published surface: if the shipped .d.ts stops
// resolving (or changes shape), `tsc --noEmit` fails here before anything renders.
const ICON: MaterialCommunityIconsGlyphs = "check-circle-outline";

const Showcase = () => {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [name, setName] = useState("");
  const [dark, setDark] = useState(theme.isDark);

  // The tokens come off the theme with their own published type.
  const colors: ThemeColorTokens = theme.colors;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Typography variant="headlineSmall" style={{ color: colors.onSurface }}>
        Glowup consumer smoke
      </Typography>
      <Typography
        variant="bodyMedium"
        style={{ color: colors.onSurfaceVariant }}
      >
        Installed from npm — not from the workspace.
      </Typography>

      <Divider />

      <Card>
        <CardContent>
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Type something"
          />
          <View style={styles.row}>
            <Chip label="Material You" selected />
            <Chip label="React Native" mode="outlined" />
          </View>
          <View style={styles.row}>
            <Typography
              variant="bodyMedium"
              style={{ color: colors.onSurface }}
            >
              Dark theme
            </Typography>
            <Toggle
              value={dark}
              onValueChange={(next) => {
                setDark(next);
                toggleTheme();
              }}
            />
          </View>
          <Button
            mode="filled"
            iconName={ICON}
            onPress={() => toast.show({ message: `Hello ${name || "there"}` })}
          >
            Show a toast
          </Button>
        </CardContent>
      </Card>
    </ScrollView>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ToastProvider>
          <StatusBar />
          <Showcase />
        </ToastProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    page: {
      backgroundColor: theme.colors.background,
      flexGrow: 1,
      gap: theme.spacing.m,
      padding: theme.spacing.l,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.s,
      justifyContent: "space-between",
      marginVertical: theme.spacing.s,
    },
  });

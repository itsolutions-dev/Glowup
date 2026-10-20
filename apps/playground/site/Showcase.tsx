import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Avatar,
  Card,
  Chip,
  DatePicker,
  Icon,
  IconButton,
  LinearProgress,
  Slider,
  Stepper,
  Tabs,
  ToggleButtonGroup,
  Typography,
  useTheme,
  type Theme,
} from "@its/glowup-ui";
import { useHydrated } from "./useHydrated";

const STEPS = ["Install", "Theme", "Compose"];
const PLATFORMS = [
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
  { value: "web", label: "Web" },
];
const TABS = ["Components", "Theming", "Templates"];

/**
 * A sampler of the library on the landing page: live components, in the
 * theme the reader has picked, arranged as the screen of an imaginary app. It
 * is the first thing that shows what the rest of the site documents.
 */
export const Showcase = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const hydrated = useHydrated();

  const [date, setDate] = useState<Date | null>(() => new Date());
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState<string>("ios");
  const [elevation, setElevation] = useState(60);
  const [tab, setTab] = useState(0);
  const [playing, setPlaying] = useState(false);

  const onPrimary = { color: theme.colors.onPrimary };

  return (
    <View style={styles.panel} accessibilityLabel="Live component sampler">
      <View style={styles.column}>
        {/* The one saturated block: the eye lands here first. */}
        <Card variant="filled" style={styles.task}>
          <View style={styles.body}>
            <View style={styles.line}>
              <Icon
                source="clock-outline"
                size={16}
                color={theme.colors.onPrimary}
              />
              <Typography variant="caption" style={onPrimary}>
                Release day
              </Typography>
            </View>
            <Typography variant="subtitle1" style={onPrimary}>
              Ship one screen to iOS, Android and the web
            </Typography>
            <View style={styles.line}>
              <Avatar name="Lucas Smith" size="large" />
              <View style={styles.flex}>
                <Typography variant="caption" style={onPrimary}>
                  Assigned to
                </Typography>
                <Typography variant="subtitle2" style={onPrimary}>
                  Lucas Smith
                </Typography>
              </View>
            </View>
            <View style={styles.line}>
              <View style={styles.flex}>
                <LinearProgress
                  progress={0.6}
                  color={theme.colors.onPrimary}
                  trackColor={theme.colors.primaryContainer}
                />
              </View>
              <Typography variant="subtitle2" style={onPrimary}>
                60%
              </Typography>
            </View>
          </View>
        </Card>

        <View style={styles.chips}>
          <Chip
            label="Material 3"
            variant="outlined"
            color="primary"
            border="circular"
          />
          <Chip
            label="Expo"
            variant="outlined"
            color="info"
            border="circular"
          />
          <Chip
            label="TypeScript"
            variant="outlined"
            color="success"
            border="circular"
          />
          <Chip
            label="Dark mode"
            variant="outlined"
            color="warning"
            border="circular"
          />
          <Chip
            label="Open source"
            variant="outlined"
            color="neutral"
            border="circular"
          />
        </View>

        <Card variant="elevated" style={styles.calendar}>
          {hydrated ? (
            <DatePicker variant="static" value={date} onChange={setDate} />
          ) : (
            <View style={styles.calendarPlaceholder} />
          )}
        </Card>
      </View>

      <View style={styles.column}>
        <Card variant="outlined">
          <View style={styles.body}>
            <View style={styles.text}>
              <Typography
                variant="subtitle2"
                style={{ color: theme.colors.onSurface }}
              >
                Start in three steps
              </Typography>
              <Typography
                variant="body2"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Install the package, wrap the app in the theme, then compose the
                screen from components.
              </Typography>
            </View>
            <Stepper steps={STEPS} activeStep={step} onClick={setStep} />
          </View>
        </Card>

        <ToggleButtonGroup
          accessibilityLabel="Platform"
          value={platform}
          onValueChange={(value) => setPlatform(value as string)}
          fullWidth
          options={PLATFORMS}
        />

        <Card variant="outlined">
          <Slider
            label="Elevation"
            value={elevation}
            onValueChange={setElevation}
            min={0}
            max={100}
            step={10}
            marks
            showValueLabel
          />
        </Card>

        <Card variant="outlined" style={styles.tabsCard}>
          <Tabs tabs={TABS} activeTab={tab} onChange={setTab} />
        </Card>

        <Card variant="elevated">
          <View style={styles.body}>
            <Card.Title
              title="Contemplative Reptile"
              subtitle="Sounds of Nature"
              startIcon={
                <Avatar variant="rounded" size="large" icon="music-note" />
              }
            />
            <View style={styles.player}>
              <IconButton
                icon="shuffle-variant"
                accessibilityLabel="Shuffle"
                title="Shuffle"
                size="small"
              />
              <IconButton
                icon="skip-previous"
                accessibilityLabel="Previous"
                title="Previous"
              />
              <IconButton
                icon={playing ? "pause" : "play"}
                accessibilityLabel={playing ? "Pause" : "Play"}
                title={playing ? "Pause" : "Play"}
                variant="filled"
                size="large"
                onClick={() => setPlaying((on) => !on)}
              />
              <IconButton
                icon="skip-next"
                accessibilityLabel="Next"
                title="Next"
              />
              <IconButton
                icon="repeat"
                accessibilityLabel="Repeat"
                title="Repeat"
                size="small"
              />
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
};

export default Showcase;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    // Two columns that fall to one when the panel is narrow: each takes at
    // least 320 and the row wraps, so no breakpoint has to be asked.
    panel: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "flex-start",
      gap: theme.spacing.m,
      padding: theme.spacing.m,
      borderRadius: theme.shape.extraLarge,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    column: {
      flexGrow: 1,
      flexBasis: 320,
      gap: theme.spacing.m,
    },
    flex: { flex: 1 },
    // `Card` puts its children in a box of its own, so the spacing between
    // them is set on a wrapper inside it, not on the card.
    body: { gap: theme.spacing.m },
    text: { gap: theme.spacing.xs },
    task: {
      padding: theme.spacing.l,
      backgroundColor: theme.colors.primary,
    },
    line: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.xs },
    calendar: { padding: 0, alignItems: "center" },
    // The picker is drawn after hydration (it reads the reader's clock and
    // locale); this holds its place so the page does not jump.
    calendarPlaceholder: { height: 312 },
    tabsCard: { padding: 0, overflow: "hidden" },
    player: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
    },
  });

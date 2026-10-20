import { Platform } from "react-native";
import {
  Banner,
  HStack,
  LinearProgress,
  ListItem,
  ListSection,
  StatusBadge,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";
import { useBattery, type ChargingState } from "@its/glowup-device/battery";

import { CodeBlock } from "../../site/CodeBlock";
import { Page, Section } from "../../site/Page";

const USAGE = `import { useBattery } from "@its/glowup-device/battery";

function SyncSettings() {
  const { level, charging, lowPowerMode } = useBattery();
  // Defer the heavy sync on a low battery that is not charging.
  const defer =
    lowPowerMode === true ||
    (charging === "unplugged" && level !== null && level < 0.2);
  return <Typography>{defer ? "Sync paused" : "Syncing"}</Typography>;
}`;

const CHARGING: Record<
  ChargingState,
  { label: string; type: "success" | "warning" | "error" }
> = {
  charging: { label: "Charging", type: "success" },
  full: { label: "Full", type: "success" },
  unplugged: { label: "On battery", type: "warning" },
  unknown: { label: "Unknown", type: "warning" },
};

export default function BatteryPage() {
  const { theme } = useTheme();
  const battery = useBattery();
  const charging = CHARGING[battery.charging];
  const percent =
    battery.level === null ? null : Math.round(battery.level * 100);

  return (
    <Page
      eyebrow="@its/glowup-device/battery"
      title="Battery"
      description="Level, charging state and Low Power Mode, kept live with one shared subscription. Unknown values are null."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            Platform.OS === "web"
              ? "In a browser this is the Battery Status API: Chromium only (Firefox and Safari report no battery), a desktop on mains power reads as full, and Low Power Mode is never exposed."
              : "Simulators have no battery. Plug the charger in or out, or switch Low Power Mode / Battery Saver: the page follows."
          }
        />
      }
    >
      <Section title="This device">
        {battery.isLoading ? (
          <StatusBadge label="Checking…" type="warning" />
        ) : !battery.isAvailable ? (
          <StatusBadge label="No battery to read here" type="warning" />
        ) : (
          <VStack spacing="m">
            <HStack spacing="m" align="center" wrap>
              <Typography
                variant="displaySmall"
                style={{ color: theme.colors.onSurface }}
              >
                {percent === null ? "—" : `${percent}%`}
              </Typography>
              <StatusBadge label={charging.label} type={charging.type} />
            </HStack>
            <LinearProgress progress={battery.level ?? 0} />
          </VStack>
        )}
        <ListSection>
          <ListItem
            secondaryText={battery.isAvailable ? "Yes" : "No"}
            primaryText="Battery available"
          />
          <ListItem
            secondaryText={charging.label}
            primaryText="Charging state"
          />
          <ListItem
            secondaryText={
              battery.lowPowerMode === null
                ? "Unknown"
                : battery.lowPowerMode
                  ? "On"
                  : "Off"
            }
            primaryText="Low Power Mode / Battery Saver"
          />
        </ListSection>
      </Section>

      <Section
        title="Wire it up"
        description="On native the three expo-battery events (level, state, power mode) are merged into one status, so every update carries all of it."
      >
        <CodeBlock
          code="npx expo install expo-battery @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={USAGE} title="SyncSettings.tsx" />
      </Section>
    </Page>
  );
}

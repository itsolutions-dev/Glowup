import { useState } from "react";
import { Animated, Platform, View } from "react-native";
import { useIsFocused } from "expo-router";
import {
  Banner,
  ListItem,
  ListSection,
  StatusBadge,
  Switch,
  ToggleButtonGroup,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";
import {
  DEFAULT_SENSOR_INTERVAL,
  useDeviceMotion,
  useDeviceOrientation,
  useSensorListener,
  useSensorPermission,
  type DeviceOrientation,
  type SensorName,
  type SensorReadings,
  type Vector3,
} from "@its/glowup-device/sensors";

import { CodeBlock } from "../../site/CodeBlock";
import { DevicePermission } from "../../site/DevicePermission";
import { Page, Section } from "../../site/Page";

const INTERVALS = [
  { value: "50", label: "50 ms" },
  { value: String(DEFAULT_SENSOR_INTERVAL), label: "200 ms" },
  { value: "1000", label: "1 s" },
];

const ORIENTATION_COPY: Record<DeviceOrientation, string> = {
  "portrait-up": "Upright",
  "portrait-down": "Upside down",
  "landscape-left": "On its right edge",
  "landscape-right": "On its left edge",
  "face-up": "Lying face up",
  "face-down": "Lying face down",
};

const STANDARD_GRAVITY = 9.80665;
const LEVEL_SIZE = 160;
const BUBBLE_SIZE = 28;
const LEVEL_RANGE = (LEVEL_SIZE - BUBBLE_SIZE) / 2;

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

const vector = ({ x, y, z }: Vector3, unit: string) =>
  `x ${x.toFixed(2)} · y ${y.toFixed(2)} · z ${z.toFixed(2)} ${unit}`;

const USAGE = `import {
  useAccelerometer,
  useDeviceOrientation,
  useSensorListener,
} from "@its/glowup-device/sensors";

function TiltHint({ visible }: { visible: boolean }) {
  // m/s², the device's axes, the same signs on iOS, Android and the web.
  const { isAvailable, reading } = useAccelerometer({ enabled: visible });
  if (isAvailable === false || !reading) return null;
  return <Typography>{Math.abs(reading.z) > 9.6 ? "Level" : "Tilted"}</Typography>;
}

function CameraControls() {
  // How the phone is held, even in a portrait-locked app.
  const { orientation } = useDeviceOrientation();
  return <Controls rotated={orientation === "landscape-left"} />;
}

function Bubble({ offset }: { offset: Animated.ValueXY }) {
  // Every 50 ms without a render: for animations and games.
  useSensorListener("accelerometer", ({ x, y }) => offset.setValue({ x, y }), {
    interval: 50,
  });
  return <Animated.View style={{ transform: offset.getTranslateTransform() }} />;
}`;

const PERMISSION = `import { useBarometer, useSensorPermission } from "@its/glowup-device/sensors";

function Altimeter() {
  // iOS's barometer and iOS Safari's motion sensors need it; elsewhere it
  // reads granted with isRequired false. The sensor hooks never prompt.
  const permission = useSensorPermission("barometer");
  const { reading } = useBarometer();
  if (permission.status === "undetermined") {
    // On the web, straight from the press: Safari grants only in the gesture.
    return <Button onClick={permission.request}>Allow motion data</Button>;
  }
  return <Typography>{reading ? \`\${reading.pressure.toFixed(1)} hPa\` : "…"}</Typography>;
}`;

const PLUGIN = `// app.config.ts
plugins: [
  [
    "@its/glowup-device",
    {
      sensors: {
        motionPermission: "Measures the floors you climb.", // iOS barometer
        highSamplingRate: true, // Android 12+: faster than every 200 ms
      },
    },
  ],
],`;

interface SensorRowProps<S extends SensorName> {
  sensor: S;
  title: string;
  /** Why it may be missing here. */
  hint: string;
  enabled: boolean;
  interval: number;
  format: (reading: SensorReadings[S]) => string;
}

function SensorRow<S extends SensorName>({
  sensor,
  title,
  hint,
  enabled,
  interval,
  format,
}: SensorRowProps<S>) {
  const [reading, setReading] = useState<SensorReadings[S] | null>(null);
  const { isAvailable } = useSensorListener(sensor, setReading, {
    enabled,
    interval,
  });
  const permission = useSensorPermission(sensor);
  const blocked = permission.isRequired && permission.status !== "granted";

  const [label, type]: [string, "success" | "warning"] =
    isAvailable === null
      ? ["Checking…", "warning"]
      : !isAvailable
        ? ["Not here", "warning"]
        : blocked
          ? ["Needs motion access", "warning"]
          : !enabled
            ? ["Paused", "warning"]
            : reading
              ? ["Live", "success"]
              : ["Waiting…", "warning"];

  return (
    <ListItem
      secondaryText={
        isAvailable === false
          ? hint
          : reading
            ? format(reading)
            : "No reading yet"
      }
      action={<StatusBadge label={label} type={type} />}
      primaryText={title}
    />
  );
}

/** A spirit level on useSensorListener: the bubble moves without a render. */
function Level({ enabled }: { enabled: boolean }) {
  const { theme } = useTheme();
  const [offset] = useState(() => new Animated.ValueXY());
  const { isAvailable } = useSensorListener(
    "accelerometer",
    ({ x, y }) =>
      // The reading points up: the bubble floats towards the higher edge.
      offset.setValue({
        x: clamp(x / STANDARD_GRAVITY) * LEVEL_RANGE,
        y: clamp(-y / STANDARD_GRAVITY) * LEVEL_RANGE,
      }),
    { enabled, interval: 50 },
  );

  if (isAvailable === false) {
    return <StatusBadge label="No accelerometer here" type="warning" />;
  }
  return (
    <View
      accessibilityLabel="Spirit level"
      style={{
        width: LEVEL_SIZE,
        height: LEVEL_SIZE,
        borderRadius: LEVEL_SIZE / 2,
        borderWidth: 2,
        borderColor: theme.colors.outline,
        backgroundColor: theme.colors.surfaceContainerHigh,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: BUBBLE_SIZE + 8,
          height: BUBBLE_SIZE + 8,
          borderRadius: (BUBBLE_SIZE + 8) / 2,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
        }}
      />
      <Animated.View
        style={{
          width: BUBBLE_SIZE,
          height: BUBBLE_SIZE,
          borderRadius: BUBBLE_SIZE / 2,
          backgroundColor: theme.colors.primary,
          transform: offset.getTranslateTransform(),
        }}
      />
    </View>
  );
}

export default function SensorsPage() {
  const { theme } = useTheme();
  const [listening, setListening] = useState(true);
  const [interval, setIntervalChoice] = useState(
    String(DEFAULT_SENSOR_INTERVAL),
  );
  // A page left in the stack stays mounted: its sensors stop when another
  // page is on screen.
  const focused = useIsFocused();
  const enabled = listening && focused;
  const options = { enabled, interval: Number(interval) };

  const { orientation, isAvailable: hasAccelerometer } =
    useDeviceOrientation(options);
  const motion = useDeviceMotion(options);

  // One motion permission, gating different sensors per platform.
  const motionAccess = useSensorPermission("accelerometer");
  const barometerAccess = useSensorPermission("barometer");
  const gate = motionAccess.isRequired
    ? motionAccess
    : barometerAccess.isRequired
      ? barometerAccess
      : null;

  return (
    <Page
      eyebrow="@its/glowup-device/sensors"
      title="Sensors"
      description="Accelerometer, gyroscope, magnetometer, barometer, light sensor and device motion in one set of units and axes on every platform, plus how the device is held. One platform subscription per sensor, shared by every reader and paused in the background."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            Platform.OS === "web"
              ? "A browser exposes the accelerometer, gyroscope and device motion only (HTTPS, and a phone or tablet: desktops have none). iOS Safari sends nothing until motion access is allowed below."
              : "The iOS Simulator has no sensors; the Android emulator's are under Extended controls → Virtual sensors. The light sensor is Android only."
          }
        />
      }
    >
      {gate ? (
        <Section
          title="Motion access"
          description={
            Platform.OS === "web"
              ? "iOS Safari asks before sending any motion data, and only from a tap: the button calls request() inside the press."
              : "iOS reads the barometer only with Motion & Fitness access. The other sensors need no permission."
          }
        >
          <DevicePermission
            status={gate.status}
            canAskAgain={gate.canAskAgain}
            isLoading={gate.isLoading}
            request={gate.request}
            openSettings={Platform.OS === "web" ? undefined : gate.openSettings}
            requestLabel="Allow motion access"
          />
        </Section>
      ) : null}

      <Section
        title="Listen"
        description="Every reader on this page runs only while the switch is on and the page is focused. The interval is the most often a reading arrives."
      >
        <ListSection>
          <ListItem
            secondaryText="{ enabled } on every hook below."
            action={<Switch value={listening} onChange={setListening} />}
            primaryText="Read the sensors"
          />
        </ListSection>
        <ToggleButtonGroup
          options={INTERVALS}
          value={interval}
          onValueChange={(next: string) => setIntervalChoice(next)}
        />
      </Section>

      <Section
        title="How it's held"
        description="useDeviceOrientation(), from gravity alone: it does not follow the interface, so it answers even in a portrait-locked app. Tilted halfway, it keeps its previous answer."
      >
        <VStack spacing="s">
          <Typography
            variant="displaySmall"
            style={{ color: theme.colors.onSurface }}
          >
            {hasAccelerometer === false
              ? "—"
              : orientation
                ? ORIENTATION_COPY[orientation]
                : "…"}
          </Typography>
          <Typography
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {hasAccelerometer === false
              ? "No accelerometer here."
              : (orientation ?? "Waiting for a clear reading")}
          </Typography>
        </VStack>
      </Section>

      <Section
        title="Level"
        description="useSensorListener() at 50 ms moves the bubble through an Animated value: no render per reading. It shares the accelerometer with the rows below, which run at their own interval."
      >
        <Level enabled={enabled} />
      </Section>

      <Section
        title="Every sensor"
        description="Acceleration in m/s² including gravity (lying face up: z ≈ +9.81), rotation in rad/s, the magnetic field in µT, pressure in hPa, light in lux. x points right, y to the top, z out of the screen."
      >
        <ListSection>
          <SensorRow
            sensor="accelerometer"
            title="Accelerometer"
            hint="No accelerometer here."
            enabled={enabled}
            interval={options.interval}
            format={(reading) => vector(reading, "m/s²")}
          />
          <SensorRow
            sensor="gyroscope"
            title="Gyroscope"
            hint="No gyroscope here."
            enabled={enabled}
            interval={options.interval}
            format={(reading) => vector(reading, "rad/s")}
          />
          <SensorRow
            sensor="magnetometer"
            title="Magnetometer"
            hint="Native only: browsers expose no magnetometer."
            enabled={enabled}
            interval={options.interval}
            format={(reading) => vector(reading, "µT")}
          />
          <SensorRow
            sensor="barometer"
            title="Barometer"
            hint="Native only, and not every phone has one."
            enabled={enabled}
            interval={options.interval}
            format={({ pressure, relativeAltitude }) =>
              relativeAltitude === null
                ? `${pressure.toFixed(1)} hPa`
                : `${pressure.toFixed(1)} hPa · ${relativeAltitude.toFixed(2)} m since start`
            }
          />
          <SensorRow
            sensor="light"
            title="Light"
            hint="Android only."
            enabled={enabled}
            interval={options.interval}
            format={({ illuminance }) => `${illuminance.toFixed(0)} lx`}
          />
        </ListSection>
      </Section>

      <Section
        title="Device motion"
        description="useDeviceMotion(): the platform's sensor fusion splits the accelerometer into the user's acceleration and gravity. Tilt reads from gravity; there is no attitude, and a compass heading belongs to location."
      >
        <ListSection>
          {motion.isAvailable === false ? (
            <ListItem
              secondaryText="It needs a gyroscope."
              primaryText="No device motion here"
            />
          ) : (
            <>
              <ListItem
                secondaryText={
                  motion.reading
                    ? vector(motion.reading.acceleration, "m/s²")
                    : "No reading yet"
                }
                primaryText="User acceleration"
              />
              <ListItem
                secondaryText={
                  motion.reading
                    ? vector(motion.reading.gravity, "m/s²")
                    : "No reading yet"
                }
                primaryText="Gravity"
              />
              <ListItem
                secondaryText={
                  motion.reading
                    ? vector(motion.reading.rotationRate, "rad/s")
                    : "No reading yet"
                }
                primaryText="Rotation rate"
              />
            </>
          )}
        </ListSection>
      </Section>

      <Section
        title="Wire it up"
        description="The value hooks render once per reading; useSensorListener calls back without rendering. Readers of one sensor share a platform subscription at the fastest interval asked for."
      >
        <CodeBlock
          code="npx expo install expo-sensors @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={USAGE} title="Sensors.tsx" />
        <CodeBlock code={PERMISSION} title="Altimeter.tsx" />
        <CodeBlock code={PLUGIN} title="app.config.ts" />
      </Section>
    </Page>
  );
}

import { useState, type ReactNode } from "react";
import { Platform } from "react-native";
import {
  Banner,
  Button,
  HStack,
  ListItem,
  ListSection,
  StatusBadge,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";
import { DeviceAdaptersProvider } from "@its/glowup-device";
import {
  BLUETOOTH_CHARACTERISTICS,
  BLUETOOTH_SERVICES,
  bleManagerAdapter,
  decodeUtf8,
  encodeUtf8,
  isBluetoothError,
  readBatteryLevel,
  readDeviceInformation,
  shortBluetoothUuid,
  toBluetoothUuid,
  useBluetoothDevice,
  useBluetoothNotifications,
  useBluetoothPermission,
  useBluetoothScan,
  useBluetoothState,
  type BluetoothAdapter,
  type BluetoothErrorCode,
  type BluetoothState,
  type DeviceInformation,
} from "@its/glowup-device/bluetooth";

import { createBluetoothDemo } from "../../site/bluetoothDemo";
import { CodeBlock } from "../../site/CodeBlock";
import { DevicePermission } from "../../site/DevicePermission";
import { Page, Section } from "../../site/Page";

const ERROR_COPY: Record<BluetoothErrorCode, string> = {
  unsupported: "No Bluetooth Low Energy here.",
  "permission-denied": "Not allowed yet: grant the permission above.",
  "powered-off": "Bluetooth is off: turn it on above.",
  timeout: "The device did not answer in time.",
  "not-connected": "Connect to the device first.",
  disconnected: "The device disconnected.",
  failed: "The device or the platform refused.",
};

const RADIO: Record<
  BluetoothState,
  { label: string; type: "success" | "error" | "warning" }
> = {
  on: { label: "On", type: "success" },
  off: { label: "Off", type: "error" },
  unauthorized: { label: "Not allowed", type: "error" },
  unsupported: { label: "Unsupported", type: "warning" },
  unknown: { label: "Unknown until asked", type: "warning" },
};

const HEART_RATE = toBluetoothUuid("180D");
const HEART_RATE_MEASUREMENT = toBluetoothUuid("2A37");
const { battery, deviceInformation, nordicUart } = BLUETOOTH_SERVICES;
const { nordicUartRx, nordicUartTx } = BLUETOOTH_CHARACTERISTICS;

const USAGE = `const permission = useBluetoothPermission();
const scan = useBluetoothScan();
const device = useBluetoothDevice(scan.devices[0]?.id);

useEffect(() => {
  permission.request(); // on iOS, once per launch: no UI after the first answer
}, []);

await scan.start({ services: ["180D"] }); // heart rate monitors, 10 s
await device.connect();
const level = await readBatteryLevel(device);

useBluetoothNotifications(device.id, "180D", "2A37", (value) => {
  setBpm(value[1]);
});`;

const PLUGIN = `["@its/glowup-device", {
  bluetooth: {
    permission: "Reads your heart rate monitor.",
    // false only for beacons: scans that locate the user
    neverForLocation: true,
  },
}]`;

function errorText(error: unknown): string {
  if (isBluetoothError(error)) return ERROR_COPY[error.code];
  return error instanceof Error ? error.message : String(error);
}

const ErrorLine = ({ text }: { text: string }) => {
  const { theme } = useTheme();
  return (
    <Typography variant="bodyMedium" style={{ color: theme.colors.error }}>
      {text}
    </Typography>
  );
};

const Muted = ({ children }: { children: ReactNode }) => {
  const { theme } = useTheme();
  return (
    <Typography
      variant="bodySmall"
      style={{ color: theme.colors.onSurfaceVariant }}
    >
      {children}
    </Typography>
  );
};

/** Runs an action, keeping its failure as text for the section. */
function useAction() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      setBusy(false);
    }
  };
  return { error, busy, run };
}

// The web and Expo Go have no Bluetooth module: the page then runs on
// simulated devices. Created once, so they survive leaving the page.
let demo: BluetoothAdapter | null = null;

function getDemo(): BluetoothAdapter {
  demo ??= createBluetoothDemo();
  return demo;
}

export default function BluetoothPage() {
  // The same answer while prerendering and in the browser (false on the web).
  const simulated = !bleManagerAdapter.isSupported();
  const content = <BluetoothContent simulated={simulated} />;
  if (!simulated) return content;
  return (
    <DeviceAdaptersProvider adapters={{ bluetooth: getDemo() }}>
      {content}
    </DeviceAdaptersProvider>
  );
}

function BluetoothContent({ simulated }: { simulated: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Page
      eyebrow="@its/glowup-device/bluetooth"
      title="Bluetooth"
      description="Bluetooth Low Energy with the phone as the central: the radio and its permission, a scan, then a connection to one device to read, write and listen to its characteristics. Nothing here prompts by itself."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            simulated
              ? `Simulated devices: ${Platform.OS === "web" ? "a browser" : "Expo Go"} has no Bluetooth module, so this page runs on the package's in-memory adapter. A development build with the bluetooth plugin key uses the real radio.`
              : "Real Bluetooth Low Energy: the scan finds the devices around you."
          }
        />
      }
    >
      <RadioSection />
      <ScanSection selected={selected} onSelect={setSelected} />
      {selected ? <DeviceSection key={selected} id={selected} /> : null}

      <Section
        title="Wire it up"
        description="react-native-ble-manager is the native side, so the page needs a development build; the plugin writes the purpose string and Android's nearby devices permissions."
      >
        <CodeBlock
          code="npx expo install react-native-ble-manager @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={USAGE} title="HeartRateScreen.tsx" />
        <CodeBlock code={PLUGIN} title="app.config.ts → plugins" />
      </Section>
    </Page>
  );
}

const RadioSection = () => {
  const permission = useBluetoothPermission();
  const radio = useBluetoothState();
  const { error, busy, run } = useAction();
  const badge = RADIO[radio.state];

  return (
    <Section
      title="Permission and radio"
      description="Android 12 and later ask for nearby devices, earlier versions for the location. iOS cannot read the permission before asking: it reads not asked until a request in this launch, and asks once per install."
    >
      <VStack spacing="m">
        <DevicePermission
          status={permission.status}
          canAskAgain={permission.canAskAgain}
          isLoading={permission.isLoading}
          request={permission.request}
          openSettings={permission.openSettings}
          requestLabel="Allow"
        />
        <HStack spacing="m" align="center" wrap>
          <StatusBadge
            label={radio.isLoading ? "Checking…" : `Radio: ${badge.label}`}
            type={badge.type}
          />
          {radio.state === "off" && radio.canEnable ? (
            <Button
              iconName="bluetooth"
              mode="outlined"
              loading={busy}
              onPress={() => run(radio.enable)}
            >
              Turn on
            </Button>
          ) : null}
        </HStack>
        {radio.state === "off" && !radio.canEnable ? (
          <Muted>
            iOS lets no app switch Bluetooth on: use Control Center.
          </Muted>
        ) : null}
        {error ? <ErrorLine text={error} /> : null}
      </VStack>
    </Section>
  );
};

const ScanSection = ({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) => {
  const scan = useBluetoothScan();
  const { error, run } = useAction();

  return (
    <Section
      title="Scan"
      description="useBluetoothScan() lists each device once with its latest signal, for 10 seconds. One scan runs per app; it pauses in the background and stops when the page goes away."
    >
      <HStack spacing="m" align="center" wrap>
        {scan.isScanning ? (
          <Button
            iconName="stop"
            mode="outlined"
            onPress={() => run(scan.stop)}
          >
            Stop
          </Button>
        ) : (
          <>
            <Button
              iconName="bluetooth-audio"
              onPress={() => run(() => scan.start())}
            >
              Scan all
            </Button>
            <Button
              iconName="heart-pulse"
              mode="outlined"
              onPress={() => run(() => scan.start({ services: ["180D"] }))}
            >
              Heart rate only
            </Button>
          </>
        )}
        {scan.isScanning ? (
          <StatusBadge label="Scanning…" type="success" />
        ) : null}
      </HStack>
      {error ? <ErrorLine text={error} /> : null}
      {scan.devices.length === 0 ? (
        <Muted>
          {scan.isScanning ? "Listening…" : "No device yet: start a scan."}
        </Muted>
      ) : (
        <ListSection>
          {scan.devices.map((device) => (
            <ListItem
              key={device.id}
              onPress={() => onSelect(device.id)}
              secondary={`${device.id} · ${device.rssi} dBm`}
              trailing={
                device.id === selected ? (
                  <StatusBadge label="Selected" type="success" />
                ) : undefined
              }
            >
              {device.name ?? "Unnamed device"}
            </ListItem>
          ))}
        </ListSection>
      )}
    </Section>
  );
};

const STATUS_BADGE = {
  disconnected: { label: "Disconnected", type: "warning" },
  connecting: { label: "Connecting…", type: "warning" },
  connected: { label: "Connected", type: "success" },
  disconnecting: { label: "Disconnecting…", type: "warning" },
} as const;

const DeviceSection = ({ id }: { id: string }) => {
  const device = useBluetoothDevice(id);
  const { error, busy, run } = useAction();
  const [level, setLevel] = useState<number | null>(null);
  const [info, setInfo] = useState<DeviceInformation | null>(null);
  const has = (uuid: string) =>
    device.services?.some((service) => service.uuid === uuid) ?? false;

  return (
    <Section
      title="Device"
      description="useBluetoothDevice() connects, discovers the services and shares the connection with every component using the same id; it closes when the page goes away."
    >
      <HStack spacing="m" align="center" wrap>
        <StatusBadge
          label={STATUS_BADGE[device.status].label}
          type={STATUS_BADGE[device.status].type}
        />
        {device.isConnected ? (
          <Button
            iconName="link-off"
            mode="outlined"
            loading={busy}
            onPress={() => run(device.disconnect)}
          >
            Disconnect
          </Button>
        ) : (
          <Button
            iconName="link"
            loading={busy || device.status === "connecting"}
            onPress={() => run(() => device.connect())}
          >
            Connect
          </Button>
        )}
      </HStack>
      {device.error ? <ErrorLine text={errorText(device.error)} /> : null}
      {error ? <ErrorLine text={error} /> : null}
      {device.services ? (
        <Muted>
          {`Services: ${device.services.map((s) => shortBluetoothUuid(s.uuid)).join(", ")}`}
        </Muted>
      ) : null}

      {device.isConnected ? (
        <VStack spacing="m">
          <HStack spacing="m" align="center" wrap>
            {has(battery) ? (
              <Button
                iconName="battery-outline"
                mode="outlined"
                onPress={() =>
                  run(async () => setLevel(await readBatteryLevel(device)))
                }
              >
                Read battery
              </Button>
            ) : null}
            {has(deviceInformation) ? (
              <Button
                iconName="information-outline"
                mode="outlined"
                onPress={() =>
                  run(async () => setInfo(await readDeviceInformation(device)))
                }
              >
                Device information
              </Button>
            ) : null}
          </HStack>
          {level !== null ? (
            <Typography variant="bodyMedium">{`Battery: ${level}%`}</Typography>
          ) : null}
          {info ? (
            <Typography variant="bodyMedium">
              {[info.manufacturerName, info.modelNumber, info.firmwareRevision]
                .filter(Boolean)
                .join(" · ")}
            </Typography>
          ) : null}
          {has(HEART_RATE) ? <HeartRate id={id} /> : null}
          {has(nordicUart) ? <SerialLine id={id} /> : null}
        </VStack>
      ) : null}
    </Section>
  );
};

/** The Heart Rate Measurement's value: 8 or 16 bits, after its flags. */
function beatsPerMinute(value: Uint8Array): number | null {
  if (value.length < 2) return null;
  return value[0] & 0x01 ? value[1] | (value[2] << 8) : value[1];
}

const HeartRate = ({ id }: { id: string }) => {
  const [bpm, setBpm] = useState<number | null>(null);
  const notifications = useBluetoothNotifications(
    id,
    HEART_RATE,
    HEART_RATE_MEASUREMENT,
    (value) => setBpm(beatsPerMinute(value)),
  );
  return (
    <HStack spacing="m" align="center" wrap>
      <StatusBadge
        label={notifications.isActive ? "Notifying" : "Not notifying"}
        type={notifications.isActive ? "success" : "warning"}
      />
      <Typography variant="titleMedium">
        {bpm === null ? "Heart rate: —" : `Heart rate: ${bpm} bpm`}
      </Typography>
      {notifications.error ? (
        <ErrorLine text={errorText(notifications.error)} />
      ) : null}
    </HStack>
  );
};

const SerialLine = ({ id }: { id: string }) => {
  const device = useBluetoothDevice(id);
  const [lines, setLines] = useState<string[]>([]);
  const { error, run } = useAction();
  useBluetoothNotifications(id, nordicUart, nordicUartTx, (value) =>
    setLines((previous) => [...previous, decodeUtf8(value).trim()].slice(-5)),
  );
  return (
    <VStack spacing="s">
      <HStack spacing="m" align="center" wrap>
        <Button
          iconName="send"
          mode="outlined"
          onPress={() =>
            run(() =>
              device.write(nordicUart, nordicUartRx, encodeUtf8("PING\n")),
            )
          }
        >
          Send PING
        </Button>
        <Muted>Nordic UART: serial over BLE, as time clocks often speak.</Muted>
      </HStack>
      {lines.map((line, index) => (
        <Typography key={`${index}:${line}`} variant="bodyMedium">
          {`← ${line}`}
        </Typography>
      ))}
      {error ? <ErrorLine text={error} /> : null}
    </VStack>
  );
};

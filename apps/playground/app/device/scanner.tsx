import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import { useIsFocused } from "expo-router";
import {
  Banner,
  Button,
  ChipGroup,
  HStack,
  ListItem,
  ListSection,
  Paper,
  StatusBadge,
  Toggle,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";
import { DeviceAdaptersProvider } from "@its/glowup-device";
import { CameraView, useCameraPermission } from "@its/glowup-device/camera";
import {
  isBarcodeScannerError,
  useBarcodeScanner,
  type BarcodeScan,
  type BarcodeScannerErrorCode,
  type BarcodeScannerInfo,
  type BarcodeScannerState,
  type BarcodeType,
} from "@its/glowup-device/scanner";

import { CodeBlock } from "../../site/CodeBlock";
import { DevicePermission } from "../../site/DevicePermission";
import { Page, Section } from "../../site/Page";
import {
  createScannerDemo,
  DEMO_LABELS,
  type ScannerDemo,
} from "../../site/scannerDemo";

/** The labels a warehouse screen reads; the scanner ignores every other. */
const SYMBOLOGIES: readonly BarcodeType[] = [
  "qr",
  "code128",
  "ean13",
  "datamatrix",
];

/** What the confirmation takes when it is slow (a request to a server). */
const SLOW_MS = 1500;

const ERROR_COPY: Record<BarcodeScannerErrorCode, string> = {
  unsupported: "No hardware scanner here.",
  "incompatible-adapter":
    "The vendor package implements another contract version.",
  unavailable: "Another app holds the scanner.",
  "not-open": "The scanner is not held by this page.",
  failed: "The scanner refused.",
};

const STATE_BADGE: Record<
  BarcodeScannerState,
  { label: string; type: "success" | "warning" }
> = {
  closed: { label: "Closed", type: "warning" },
  opening: { label: "Opening…", type: "warning" },
  open: { label: "Open", type: "success" },
};

const INSTALL = `npm install @its/glowup-device @its/scanner-honeywell
# Honeywell's Data Collection SDK is yours to download: its licence keeps it out of npm.`;

const PLUGIN = `["@its/scanner-honeywell", {
  dataCollectionAarPath: "./honeywell/DataCollection.aar",
}]`;

const PROVIDER = `import { DeviceAdaptersProvider } from "@its/glowup-device";
import { getHoneywellBarcodeScannerAdapter } from "@its/scanner-honeywell";

// The one line that picks the vendor: the screens use /scanner only.
<DeviceAdaptersProvider adapters={{ barcodeScanner: getHoneywellBarcodeScannerAdapter() }}>
  <App />
</DeviceAdaptersProvider>`;

const USAGE = `import { CameraView } from "@its/glowup-device/camera";
import { useBarcodeScanner, type BarcodeScan } from "@its/glowup-device/scanner";

const SYMBOLOGIES = ["qr", "code128", "ean13", "datamatrix"] as const;

function ScanScreen({ focused }: { focused: boolean }) {
  // A promise keeps the next reads out until it settles.
  const onScan = (scan: BarcodeScan) => submit(scan.data);
  const scanner = useBarcodeScanner({
    onScan,
    enabled: focused, // a stack keeps the screens behind mounted
    symbologies: SYMBOLOGIES,
  });
  // A phone without an imager reads through the camera, with the same handler.
  return scanner.isSupported ? (
    <Text>{scanner.isBusy ? "Sending…" : "Pull the trigger"}</Text>
  ) : (
    <CameraView onBarcodeScanned={onScan} barcodeTypes={SYMBOLOGIES} />
  );
}`;

interface Read {
  key: number;
  data: string;
  type: BarcodeScan["type"];
  rawType: string;
  aimId: string | null;
  source: "scanner" | "camera";
  at: number;
}

function errorText(error: unknown): string {
  if (isBarcodeScannerError(error)) return ERROR_COPY[error.code];
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

const Switch = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) => (
  <HStack spacing="s" align="center">
    <Toggle value={value} onValueChange={onChange} />
    <Typography variant="bodyMedium">{label}</Typography>
  </HStack>
);

const noSubscription = () => () => {};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// No vendor ships with the site: the page runs on a simulated scanner, created
// once (the package keeps one engine per adapter, so one per visit would pile up).
let demo: ScannerDemo | null = null;

function getDemo(): ScannerDemo {
  demo ??= createScannerDemo();
  return demo;
}

export default function ScannerPage() {
  // "none" is the package's own answer without a vendor: the same while
  // prerendering and in the browser, so the page hydrates. Not enabled: this
  // hook only asks, the page's own hook holds the scanner.
  const simulated =
    useBarcodeScanner({ onScan: () => {}, enabled: false }).vendor === "none";
  const content = <ScannerContent demo={simulated ? getDemo() : null} />;
  if (!simulated) return content;
  return (
    <DeviceAdaptersProvider adapters={{ barcodeScanner: getDemo().adapter }}>
      {content}
    </DeviceAdaptersProvider>
  );
}

function ScannerContent({ demo }: { demo: ScannerDemo | null }) {
  const focused = useIsFocused();
  const [firstScope, setFirstScope] = useState(true);
  const [slow, setSlow] = useState(false);
  const [repeat, setRepeat] = useState(true);
  const [camera, setCamera] = useState(false);
  const [reads, setReads] = useState<Read[]>([]);
  const count = useRef(0);

  // One handler for the scanner and the camera.
  const onScan = (scan: BarcodeScan, source: Read["source"]) => {
    const key = ++count.current;
    setReads((list) =>
      [
        {
          key,
          data: scan.data,
          type: scan.type,
          rawType: scan.rawType,
          aimId: "aimId" in scan ? (scan.aimId as string | null) : null,
          source,
          at: Date.now(),
        },
        ...list,
      ].slice(0, 20),
    );
    if (slow) return wait(SLOW_MS);
  };

  const scanner = useBarcodeScanner({
    onScan: (scan) => onScan(scan, "scanner"),
    enabled: focused && !camera,
    symbologies: firstScope ? SYMBOLOGIES : null,
    repeatInterval: repeat ? undefined : 0,
  });

  return (
    <Page
      eyebrow="@its/glowup-device/scanner"
      title="Barcode scanner"
      description="A rugged device's hardware imager (Honeywell's CT40 and others) behind one contract: the screen that holds the scanner gets each read in onScan, which confirms by itself, with no Enter key. The vendor is an adapter from its own package; a phone without an imager reads through the camera with the same handler."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            demo
              ? "Simulated scanner: no vendor ships with this site, so the page runs on the package's in-memory adapter with five labels in front of it. An app passes its vendor's adapter (@its/scanner-honeywell for the CT40) to DeviceAdaptersProvider."
              : "A real scanner, through the app's adapter."
          }
        />
      }
    >
      <Section
        title="Scanner"
        description="useBarcodeScanner() holds the scanner while the page is focused and the app in the foreground, and gives it back otherwise. The symbologies turn those on and every other off, for this screen only; the guards drop the same code within a second and every read while the confirmation runs."
      >
        <VStack spacing="m">
          <HStack spacing="m" align="center" wrap>
            <StatusBadge {...STATE_BADGE[scanner.state]} />
            {scanner.isActive ? (
              <StatusBadge label="Held by this page" type="success" />
            ) : null}
            {scanner.isTriggerPressed ? (
              <StatusBadge label="Trigger pressed" type="success" />
            ) : null}
            {scanner.isBusy ? (
              <StatusBadge label="Confirming…" type="warning" />
            ) : null}
          </HStack>
          <VStack spacing="s">
            <Switch
              label="Only QR, Code 128, EAN-13 and Data Matrix (off: the device's own settings)"
              value={firstScope}
              onChange={setFirstScope}
            />
            <Switch
              label={`A slow confirmation (${SLOW_MS / 1000} s): reads meanwhile are dropped`}
              value={slow}
              onChange={setSlow}
            />
            <Switch
              label="The same code once a second"
              value={repeat}
              onChange={setRepeat}
            />
            <Switch
              label="A phone without an imager: read through the camera"
              value={camera}
              onChange={setCamera}
            />
          </VStack>
          {scanner.error ? (
            <HStack spacing="m" align="center" wrap>
              <ErrorLine text={errorText(scanner.error)} />
              <Button
                iconName="refresh"
                mode="outlined"
                onPress={scanner.retry}
              >
                Retry
              </Button>
            </HStack>
          ) : null}
        </VStack>
      </Section>

      {camera ? (
        <CameraFallback
          active={focused}
          onScan={(scan) => onScan(scan, "camera")}
        />
      ) : (
        <TriggerSection
          demo={demo}
          softwareTrigger={
            scanner.capabilities.softwareTrigger
              ? scanner.softwareTrigger
              : null
          }
          held={scanner.isActive}
          getScannerInfo={scanner.getScannerInfo}
        />
      )}

      <ReadsSection reads={reads} onClear={() => setReads([])} />

      <Section
        title="Wire it up"
        description="The vendor package is an Android Expo module: it needs a development build, and its config plugin takes the app's own copy of the vendor's SDK. One build per vendor."
      >
        <CodeBlock code={INSTALL} language="bash" title="Terminal" />
        <CodeBlock code={PLUGIN} title="app.config.ts → plugins" />
        <CodeBlock code={PROVIDER} title="App.tsx" />
        <CodeBlock code={USAGE} title="ScanScreen.tsx" />
      </Section>
    </Page>
  );
}

const TriggerSection = ({
  demo,
  softwareTrigger,
  held,
  getScannerInfo,
}: {
  demo: ScannerDemo | null;
  softwareTrigger: ((pressed: boolean) => Promise<void>) | null;
  held: boolean;
  getScannerInfo: () => Promise<BarcodeScannerInfo | null>;
}) => {
  const [label, setLabel] = useState(DEMO_LABELS[0]!.id);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const decodes = useSyncExternalStore(
    demo?.subscribe ?? noSubscription,
    () => demo?.getDecodes() ?? null,
    () => demo?.getDecodes() ?? null,
  );

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (failure) {
      setError(errorText(failure));
    }
  };

  const pick = (id: string) => {
    setLabel(id);
    const found = DEMO_LABELS.find((candidate) => candidate.id === id);
    if (found) demo?.aim(found);
  };

  return (
    <Section
      title="Trigger"
      description={
        demo
          ? "Pick the label in front of the imager, then pull the trigger or press the on-screen scan button (softwareTrigger). The EAN-8 is not in this screen's symbologies: the scanner ignores it until the first switch above is off."
          : "Pull the scanner's own trigger, or press the on-screen scan button (softwareTrigger)."
      }
    >
      <VStack spacing="m">
        {demo ? (
          <ChipGroup
            options={DEMO_LABELS.map((candidate) => ({
              value: candidate.id,
              label: candidate.name,
            }))}
            value={label}
            onValueChange={pick}
            required
            accessibilityLabel="The label in front of the imager"
          />
        ) : null}
        <HStack spacing="m" align="center" wrap>
          {demo ? (
            <Button
              iconName="barcode-scan"
              disabled={!held}
              onPress={() => void demo.pullTrigger()}
            >
              Pull the trigger
            </Button>
          ) : null}
          {softwareTrigger ? (
            <Button
              iconName="gesture-tap-button"
              mode="outlined"
              onPress={() =>
                run(async () => {
                  await softwareTrigger(true);
                  await wait(300);
                  await softwareTrigger(false);
                })
              }
            >
              Scan button
            </Button>
          ) : null}
          {demo ? (
            <Button
              iconName="cellphone-arrow-down"
              mode="outlined"
              disabled={!held}
              onPress={() => demo.takeAway()}
            >
              Another app takes it
            </Button>
          ) : null}
          <Button
            iconName="information-outline"
            mode="text"
            onPress={() =>
              run(async () => {
                const found = await getScannerInfo();
                setInfo(
                  found
                    ? [
                        found.name,
                        found.model,
                        found.firmwareVersion &&
                          `firmware ${found.firmwareVersion}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "The adapter does not report it.",
                );
              })
            }
          >
            Scanner info
          </Button>
        </HStack>
        {info ? <Typography variant="bodyMedium">{info}</Typography> : null}
        {decodes?.ignored ? (
          <Muted>{`The scanner did not decode ${decodes.ignored.name}: its symbology is off for this screen.`}</Muted>
        ) : null}
        {error ? <ErrorLine text={error} /> : null}
      </VStack>
    </Section>
  );
};

const CameraFallback = ({
  active,
  onScan,
}: {
  active: boolean;
  onScan: (scan: BarcodeScan) => unknown;
}) => {
  const permission = useCameraPermission();
  const granted = permission.status === "granted";

  return (
    <Section
      title="Camera"
      description="The scanner is given back, and CameraView reads the same symbologies into the same onScan, with the same busy guard. In a browser the camera needs HTTPS."
    >
      <VStack spacing="m">
        <DevicePermission
          status={permission.status}
          canAskAgain={permission.canAskAgain}
          isLoading={permission.isLoading}
          request={permission.request}
          openSettings={permission.openSettings}
          requestLabel="Allow the camera"
        />
        {granted ? (
          <Paper elevation={1} style={styles.stage}>
            <CameraView
              style={styles.preview}
              active={active}
              barcodeTypes={SYMBOLOGIES}
              onBarcodeScanned={onScan}
            />
          </Paper>
        ) : null}
      </VStack>
    </Section>
  );
};

const ReadsSection = ({
  reads,
  onClear,
}: {
  reads: Read[];
  onClear: () => void;
}) => (
  <Section
    title="Reads"
    description="What reached onScan, newest first: the text as decoded, the type from the AIM id (ISO/IEC 15424) and the vendor's own id."
  >
    <VStack spacing="m">
      <HStack spacing="m" align="center">
        <Typography variant="bodyMedium">{`${reads.length} reads`}</Typography>
        <Button
          iconName="broom"
          mode="outlined"
          disabled={reads.length === 0}
          onPress={onClear}
        >
          Clear
        </Button>
      </HStack>
      {reads.length === 0 ? (
        <Muted>No read yet.</Muted>
      ) : (
        <ListSection>
          {reads.map((read) => (
            <ListItem
              key={read.key}
              secondary={[
                read.type,
                read.aimId && `AIM ${read.aimId}`,
                `id ${read.rawType}`,
                read.source,
                new Date(read.at).toLocaleTimeString(),
              ]
                .filter(Boolean)
                .join(" · ")}
            >
              {read.data}
            </ListItem>
          ))}
        </ListSection>
      )}
    </VStack>
  </Section>
);

const styles = StyleSheet.create({
  stage: { overflow: "hidden", borderRadius: 16 },
  preview: { height: 320, width: "100%" },
});

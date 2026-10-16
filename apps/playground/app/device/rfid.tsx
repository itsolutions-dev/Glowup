import { useState, type ReactNode } from "react";
import { View } from "react-native";
import {
  Banner,
  Button,
  HStack,
  LinearProgress,
  ListItem,
  ListSection,
  StatusBadge,
  Toggle,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";
import { DeviceAdaptersProvider } from "@its/glowup-device";
import {
  isRfidError,
  useRfidInventory,
  useRfidLocate,
  useRfidPermission,
  useRfidReader,
  useRfidReaderDiscovery,
  useRfidSingleRead,
  useRfidTrigger,
  type RfidAdapter,
  type RfidConnectionState,
  type RfidErrorCode,
  type RfidReaderInfo,
  type RfidTag,
} from "@its/glowup-device/rfid";

import { CodeBlock } from "../../site/CodeBlock";
import { DevicePermission } from "../../site/DevicePermission";
import { Page, Section } from "../../site/Page";
import { createRfidDemo, pullDemoTrigger } from "../../site/rfidDemo";

const ERROR_COPY: Record<RfidErrorCode, string> = {
  unsupported: "No RFID reader here.",
  "incompatible-adapter":
    "The vendor package implements another contract version.",
  "permission-denied": "Not allowed yet: grant the permission above.",
  "not-connected": "Connect to a reader first.",
  disconnected: "The reader disconnected.",
  timeout: "The reader did not answer in time.",
  cancelled: "Replaced by another read.",
  failed: "The reader refused.",
};

const STATE_BADGE: Record<
  RfidConnectionState,
  { label: string; type: "success" | "error" | "warning" }
> = {
  disconnected: { label: "Disconnected", type: "warning" },
  connecting: { label: "Connecting…", type: "warning" },
  connected: { label: "Connected", type: "success" },
  reconnecting: { label: "Reconnecting…", type: "warning" },
};

const INSTALL = `npm install @its/glowup-device @its/rfid-honeywell
# Honeywell's SDKs are yours to download: their licence keeps them out of npm.`;

const PLUGIN = `["@its/rfid-honeywell", {
  aarPath: "./honeywell/honeywell_rfid_sdk_v1.1.0.aar",
  dataCollectionAarPath: "./honeywell/DataCollection.aar",
}]`;

const PROVIDER = `import { DeviceAdaptersProvider } from "@its/glowup-device";
import { getHoneywellRfidAdapter } from "@its/rfid-honeywell";

// The one line that picks the vendor: the screens use /rfid only.
<DeviceAdaptersProvider adapters={{ rfid: getHoneywellRfidAdapter() }}>
  <App />
</DeviceAdaptersProvider>`;

const USAGE = `const reader = useRfidReader();
const inventory = useRfidInventory();
const locate = useRfidLocate();

await reader.connect(address); // resolves once the reader is ready
useRfidTrigger({ onPress: () => inventory.start(), onRelease: inventory.stop });

inventory.tags; // nearest first: epc, tid, rssi (dBm), proximity (0–1)
await locate.start(inventory.tags[0].epc); // locate.proximity rises as you near it`;

function errorText(error: unknown): string {
  if (isRfidError(error)) return ERROR_COPY[error.code];
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

/**
 * A section's failures, each once: a hook's own error and the action's
 * rejection are often the same one.
 */
const Errors = ({ errors }: { errors: unknown[] }) => {
  const texts = [
    ...new Set(
      errors.map((error) =>
        typeof error === "string" || error === null ? error : errorText(error),
      ),
    ),
  ].filter((text): text is string => !!text);
  return (
    <>
      {texts.map((text) => (
        <ErrorLine key={text} text={text} />
      ))}
    </>
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

// No vendor ships with the site: the page runs on a simulated reader, created
// once so it keeps its connection when the page is left.
let demo: RfidAdapter | null = null;

function getDemo(): RfidAdapter {
  demo ??= createRfidDemo();
  return demo;
}

export default function RfidPage() {
  // "none" is the package's own answer without a vendor: the same while
  // prerendering and in the browser, so the page hydrates.
  const simulated = useRfidReader().vendor === "none";
  const content = <RfidContent simulated={simulated} />;
  if (!simulated) return content;
  return (
    <DeviceAdaptersProvider adapters={{ rfid: getDemo() }}>
      {content}
    </DeviceAdaptersProvider>
  );
}

function RfidContent({ simulated }: { simulated: boolean }) {
  const [target, setTarget] = useState<string | null>(null);

  return (
    <Page
      eyebrow="@its/glowup-device/rfid"
      title="RFID"
      description="UHF RFID through a handheld reader, behind one contract: the multiple scan with each tag's proximity, the single read of the tag in front of the reader, and the search for one tag. The vendor is an adapter from its own package; the screens never change with it."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            simulated
              ? "Simulated reader: no vendor ships with this site, so the page runs on the package's in-memory adapter with eight tags around it. An app passes its vendor's adapter (@its/rfid-honeywell for the IH40) to DeviceAdaptersProvider."
              : "A real reader, through the app's adapter."
          }
        />
      }
    >
      <ReaderSection />
      <InventorySection simulated={simulated} onLocate={setTarget} />
      <SingleReadSection onLocate={setTarget} />
      <LocateSection epc={target} />

      <Section
        title="Wire it up"
        description="The vendor package is an Android Expo module: it needs a development build, and its config plugin takes the app's own copy of the vendor's SDK. One build per vendor."
      >
        <CodeBlock code={INSTALL} language="bash" title="Terminal" />
        <CodeBlock code={PLUGIN} title="app.config.ts → plugins" />
        <CodeBlock code={PROVIDER} title="App.tsx" />
        <CodeBlock code={USAGE} title="StockTakeScreen.tsx" />
      </Section>
    </Page>
  );
}

const ReaderSection = () => {
  const permission = useRfidPermission();
  const reader = useRfidReader();
  const discovery = useRfidReaderDiscovery();
  const { error, busy, run } = useAction();
  const [details, setDetails] = useState<{
    battery: number | null;
    info: RfidReaderInfo | null;
  } | null>(null);
  const badge = STATE_BADGE[reader.state];
  const connected = reader.state === "connected";

  const connect = (id: string) =>
    run(async () => {
      setDetails(null);
      await reader.connect(id);
      setDetails({
        battery: await reader.getBatteryLevel(),
        info: await reader.getReaderInfo(),
      });
    });

  return (
    <Section
      title="Reader"
      description="Android 12 and later ask for nearby devices, earlier versions for the location a Bluetooth search needs. The search lists the readers that advertise; connect() resolves once the reader is ready, and the connection outlives the page until disconnect()."
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
          <StatusBadge label={badge.label} type={badge.type} />
          {discovery.isDiscovering ? (
            <Button
              iconName="stop"
              mode="outlined"
              onPress={() => run(discovery.stop)}
            >
              Stop searching
            </Button>
          ) : (
            <Button
              iconName="magnify"
              mode="outlined"
              onPress={() => run(() => discovery.start())}
            >
              Search readers
            </Button>
          )}
          {connected ? (
            <Button
              iconName="link-off"
              mode="outlined"
              loading={busy}
              onPress={() =>
                run(async () => {
                  await reader.disconnect();
                  setDetails(null);
                })
              }
            >
              Disconnect
            </Button>
          ) : null}
        </HStack>
        {discovery.readers.length > 0 ? (
          <ListSection>
            {discovery.readers.map((found) => (
              <ListItem
                key={found.id}
                onPress={() => connect(found.id)}
                secondary={`${found.id} · ${found.rssi} dBm`}
                trailing={
                  found.id === reader.readerId ? (
                    <StatusBadge label="This one" type={badge.type} />
                  ) : undefined
                }
              >
                {found.name ?? "Unnamed reader"}
              </ListItem>
            ))}
          </ListSection>
        ) : (
          <Muted>
            {discovery.isDiscovering
              ? "Listening…"
              : "No reader yet: search, then pick one to connect."}
          </Muted>
        )}
        {connected && details ? (
          <Typography variant="bodyMedium">
            {[
              details.info?.name,
              details.info?.model,
              details.info?.firmwareVersion &&
                `firmware ${details.info.firmwareVersion}`,
              details.battery !== null && `battery ${details.battery}%`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Typography>
        ) : null}
        <Errors errors={[reader.error, discovery.error, error]} />
      </VStack>
    </Section>
  );
};

const TagRow = ({
  tag,
  onLocate,
}: {
  tag: RfidTag;
  onLocate: (epc: string) => void;
}) => (
  <ListItem
    onPress={() => onLocate(tag.epc)}
    secondary={[
      `${Math.round(tag.averageRssi)} dBm`,
      `${tag.readCount} reads`,
      tag.tid && `TID ${tag.tid}`,
    ]
      .filter(Boolean)
      .join(" · ")}
    trailing={
      <View style={{ width: 96 }}>
        <LinearProgress progress={tag.proximity} />
      </View>
    }
  >
    {tag.epc}
  </ListItem>
);

const InventorySection = ({
  simulated,
  onLocate,
}: {
  simulated: boolean;
  onLocate: (epc: string) => void;
}) => {
  const reader = useRfidReader();
  const inventory = useRfidInventory();
  const [tid, setTid] = useState(false);
  const { error, run } = useAction();
  const start = () => run(() => inventory.start({ tid }));
  const trigger = useRfidTrigger({
    onPress: () => void start(),
    onRelease: () => void run(inventory.stop),
  });

  return (
    <Section
      title="Multiple scan"
      description="useRfidInventory() lists every tag in range once, nearest first: the RSSI is smoothed, and the proximity (0 to 1) runs between the adapter's near and far bounds. Hold the reader's trigger to scan, or use the buttons. Pick a tag to search for it."
    >
      <HStack spacing="m" align="center" wrap>
        {inventory.isRunning ? (
          <Button
            iconName="stop"
            mode="outlined"
            onPress={() => run(inventory.stop)}
          >
            Stop
          </Button>
        ) : (
          <Button iconName="contactless-payment" onPress={start}>
            Scan
          </Button>
        )}
        <Button
          iconName="broom"
          mode="outlined"
          disabled={inventory.tags.length === 0}
          onPress={inventory.clear}
        >
          Clear
        </Button>
        {simulated && trigger.isSupported ? (
          <Button
            iconName="gesture-tap-hold"
            mode="outlined"
            disabled={reader.state !== "connected"}
            onPress={() => pullDemoTrigger(getDemo())}
          >
            Pull the trigger (2 s)
          </Button>
        ) : null}
        <HStack spacing="s" align="center">
          <Toggle
            value={tid}
            onValueChange={setTid}
            disabled={inventory.isRunning || !reader.capabilities.tid}
          />
          <Typography variant="bodyMedium">Read TIDs</Typography>
        </HStack>
        {trigger.isPressed ? (
          <StatusBadge label="Trigger held" type="success" />
        ) : null}
      </HStack>
      <Errors errors={[inventory.error, error]} />
      {inventory.tags.length === 0 ? (
        <Muted>
          {inventory.isRunning ? "Listening…" : "No tag yet: start a scan."}
        </Muted>
      ) : (
        <>
          <Muted>{`${inventory.tags.length} tags`}</Muted>
          <ListSection>
            {inventory.tags.map((tag) => (
              <TagRow key={tag.epc} tag={tag} onLocate={onLocate} />
            ))}
          </ListSection>
        </>
      )}
    </Section>
  );
};

const SingleReadSection = ({
  onLocate,
}: {
  onLocate: (epc: string) => void;
}) => {
  const reader = useRfidReader();
  const single = useRfidSingleRead();
  const [tid, setTid] = useState(true);
  const { error, run } = useAction();

  return (
    <Section
      title="Single read"
      description="useRfidSingleRead() listens for a short window (500 ms by default) and answers the strongest tag, or null: the tag held against the reader, for its id. The reader's own single read where it has one, an inventory window otherwise."
    >
      <HStack spacing="m" align="center" wrap>
        <Button
          iconName="tag-outline"
          loading={single.isReading}
          onPress={() => run(() => single.read({ tid }))}
        >
          Read
        </Button>
        <HStack spacing="s" align="center">
          <Toggle
            value={tid}
            onValueChange={setTid}
            disabled={!reader.capabilities.tid}
          />
          <Typography variant="bodyMedium">With the TID</Typography>
        </HStack>
      </HStack>
      <Errors errors={[single.error, error]} />
      {single.tag ? (
        <ListSection>
          <TagRow tag={single.tag} onLocate={onLocate} />
        </ListSection>
      ) : (
        <Muted>{single.isReading ? "Listening…" : "No tag read yet."}</Muted>
      )}
    </Section>
  );
};

const LocateSection = ({ epc }: { epc: string | null }) => {
  const locate = useRfidLocate();
  const { error, run } = useAction();
  const searching = locate.isLocating ? locate.epc : epc;

  return (
    <Section
      title="Search"
      description="useRfidLocate() follows one tag: its proximity rises as the reader nears it, and it reads out of range after two seconds of silence. On a Honeywell reader the reader beeps faster too."
    >
      {searching ? (
        <VStack spacing="m">
          <Typography variant="bodyMedium">{`Tag ${searching}`}</Typography>
          <HStack spacing="m" align="center" wrap>
            {locate.isLocating ? (
              <Button
                iconName="stop"
                mode="outlined"
                onPress={() => run(locate.stop)}
              >
                Stop
              </Button>
            ) : (
              <Button
                iconName="crosshairs-gps"
                onPress={() => run(() => locate.start(searching))}
              >
                Start the search
              </Button>
            )}
            {locate.isLocating ? (
              <StatusBadge
                label={locate.isInRange ? "In range" : "Out of range"}
                type={locate.isInRange ? "success" : "warning"}
              />
            ) : null}
          </HStack>
          {locate.isLocating ? (
            <VStack spacing="s">
              <LinearProgress progress={locate.proximity} height={12} />
              <Typography variant="titleMedium">
                {locate.rssi === null
                  ? "Listening…"
                  : `${Math.round(locate.proximity * 100)}% · ${Math.round(locate.rssi)} dBm`}
              </Typography>
            </VStack>
          ) : null}
        </VStack>
      ) : (
        <Muted>
          Pick a tag in the scan or the single read to search for it.
        </Muted>
      )}
      <Errors errors={[locate.error, error]} />
    </Section>
  );
};

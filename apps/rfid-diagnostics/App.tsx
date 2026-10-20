import { DeviceAdaptersProvider } from "@its/glowup-device";
import {
  useRfidInventory,
  useRfidLocate,
  useRfidPermission,
  useRfidReader,
  useRfidReaderDiscovery,
  useRfidSingleRead,
  useRfidTrigger,
  type RfidSettings,
  type RfidTag,
} from "@its/glowup-device/rfid";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  batchRate,
  emptyMeasurements,
  record,
  toReport,
  type Measurements,
} from "./measurements";
import {
  linkedVendor,
  type DiagnosticsAdapter,
  type DiagnosticsVendor,
} from "./vendors";

const defaultVendor = linkedVendor();

/**
 * The spike's diagnostics: every mode of `@its/glowup-device/rfid` on the
 * vendor this build links (`RFID_VENDOR`: Honeywell or Zebra), plus what the
 * SDK does underneath (raw values, threads, batches, readers), to share as
 * one report.
 */
export default function App({
  vendor = defaultVendor,
}: {
  vendor?: DiagnosticsVendor;
}) {
  return (
    <DeviceAdaptersProvider adapters={{ rfid: vendor.adapter }}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.title}>RFID diagnostics</Text>
        <Diagnostics vendor={vendor} />
      </ScrollView>
    </DeviceAdaptersProvider>
  );
}

function errorText(error: unknown): string {
  if (!error) return "";
  const { code, message } = error as { code?: string; message?: string };
  return code ? `${code}: ${message ?? ""}` : String(message ?? error);
}

function useAction() {
  const [error, setError] = useState("");
  const run = (action: () => Promise<unknown> | unknown) => {
    setError("");
    Promise.resolve()
      .then(action)
      .catch((failure: unknown) => setError(errorText(failure)));
  };
  return { error, run };
}

function useMeasurements(target: DiagnosticsAdapter, enabled: boolean) {
  const [measurements, setMeasurements] = useState(() => emptyMeasurements());
  const latest = useRef(measurements);
  useEffect(() => {
    target.setDiagnostics(enabled);
    if (!enabled) return;
    const stop = target.subscribeDiagnostics((event) => {
      latest.current = record(latest.current, event);
    });
    // Rendered twice a second: diagnostics arrive with every batch of reads.
    const timer = setInterval(() => setMeasurements(latest.current), 500);
    return () => {
      stop();
      clearInterval(timer);
    };
  }, [target, enabled]);
  const reset = () => {
    latest.current = emptyMeasurements();
    setMeasurements(latest.current);
  };
  return { measurements, reset };
}

function Diagnostics({ vendor }: { vendor: DiagnosticsVendor }) {
  const target = vendor.adapter;
  const [diagnostics, setDiagnostics] = useState(true);
  const { measurements, reset } = useMeasurements(target, diagnostics);
  const [locateEpc, setLocateEpc] = useState("");
  const constants = Platform.constants as Record<string, unknown>;
  const host = {
    manufacturer: constants.Manufacturer ?? null,
    model: constants.Model ?? null,
    androidVersion: Platform.Version,
    vendor: vendor.name,
    supported: target.isSupported(),
    nativeRevision: target.nativeRevision(),
    expectedNativeRevision: vendor.expectedRevision,
  };
  const staleNative =
    host.nativeRevision !== null &&
    host.nativeRevision < vendor.expectedRevision;

  return (
    <>
      <Section title="Host">
        <Line label="Device">{`${String(host.manufacturer)} ${String(host.model)}, API ${String(host.androidVersion)}`}</Line>
        <Line label="Vendor">{vendor.name}</Line>
        <Line label="Adapter">
          {host.supported ? "supported" : vendor.unsupportedReason()}
        </Line>
        <Line label="Native module">
          {host.nativeRevision === null
            ? "—"
            : `revision ${host.nativeRevision} (this JavaScript expects ${vendor.expectedRevision})`}
        </Line>
        {staleNative ? (
          <Text style={styles.error}>
            The app was built before the latest native change: rebuild it (npm
            run android -w @its/rfid-diagnostics, with the same RFID_VENDOR).
            Reloading Metro does not update the module.
          </Text>
        ) : null}
        <Toggle
          label="Diagnostics (raw SDK events)"
          value={diagnostics}
          onChange={setDiagnostics}
        />
      </Section>
      <PermissionSection />
      <ReaderSection vendor={vendor} />
      <InventorySection onPick={setLocateEpc} />
      <SingleReadSection onPick={setLocateEpc} />
      <LocateSection
        epc={locateEpc}
        onEpcChange={setLocateEpc}
        setNativeLocate={vendor.setNativeLocate}
      />
      <MeasurementsSection
        measurements={measurements}
        host={host}
        onReset={reset}
      />
    </>
  );
}

function PermissionSection() {
  const permission = useRfidPermission();
  return (
    <Section title="Permission">
      <Line label="Status">
        {permission.isLoading
          ? "…"
          : `${permission.status}${permission.canAskAgain ? "" : " (cannot ask again)"}`}
      </Line>
      <Row>
        <Button label="Request" onPress={() => permission.request()} />
        <Button label="Settings" onPress={() => permission.openSettings()} />
      </Row>
    </Section>
  );
}

function ReaderSection({ vendor }: { vendor: DiagnosticsVendor }) {
  const target = vendor.adapter;
  const reader = useRfidReader();
  const discovery = useRfidReaderDiscovery();
  const { error, run } = useAction();
  const [address, setAddress] = useState("");
  const [filter, setFilter] = useState(true);
  const [battery, setBattery] = useState<string>("");
  const [info, setInfo] = useState<string>("");
  const [settings, setSettings] = useState<RfidSettings | null>(null);

  const connect = (id: string) =>
    run(async () => {
      await discovery.stop();
      await reader.connect(id.trim());
    });
  const change = (patch: Parameters<typeof reader.setSettings>[0]) =>
    run(async () => setSettings(await reader.setSettings(patch)));

  return (
    <Section title="Reader">
      <Line label="State">{`${reader.state}${reader.readerId ? ` · ${reader.readerId}` : ""}`}</Line>
      {reader.error ? (
        <Text style={styles.error}>{errorText(reader.error)}</Text>
      ) : null}
      <Toggle
        label={vendor.filterLabel}
        value={filter}
        onChange={(value) => {
          setFilter(value);
          target.setDiscoveryFilter(value);
        }}
      />
      <Row>
        <Button
          label={discovery.isDiscovering ? "Searching…" : "Search"}
          onPress={() => run(() => discovery.start())}
        />
        <Button label="Stop" onPress={() => run(() => discovery.stop())} />
      </Row>
      {discovery.error ? (
        <Text style={styles.error}>{errorText(discovery.error)}</Text>
      ) : null}
      {discovery.readers.map((found) => (
        <Pressable
          key={found.id}
          onPress={() => connect(found.id)}
          style={styles.item}
        >
          <Text
            style={styles.mono}
          >{`${found.id}  ${found.name ?? "(no name)"}${found.rssi === null ? "" : `  ${found.rssi} dBm`}`}</Text>
        </Pressable>
      ))}
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder={vendor.idPlaceholder}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <Row>
        <Button
          label="Connect"
          // An empty field connects to the reader the search found, when it
          // found exactly one.
          onPress={() =>
            connect(
              address.trim() ||
                (discovery.readers.length === 1 ? discovery.readers[0].id : ""),
            )
          }
        />
        <Button
          label="Disconnect"
          onPress={() => run(() => reader.disconnect())}
        />
      </Row>
      <Row>
        <Button
          label="Battery"
          onPress={() =>
            run(async () => setBattery(String(await reader.getBatteryLevel())))
          }
        />
        <Button
          label="Info"
          onPress={() =>
            run(async () =>
              setInfo(JSON.stringify(await reader.getReaderInfo())),
            )
          }
        />
        <Button
          label="Settings"
          onPress={() =>
            run(async () => setSettings(await reader.getSettings()))
          }
        />
      </Row>
      {battery ? <Line label="Battery">{`${battery} %`}</Line> : null}
      {info ? <Text style={styles.mono}>{info}</Text> : null}
      {settings ? (
        <>
          <Line label="Settings">
            {`${settings.power} dBm · S${settings.session} · beeper ${settings.beeperVolume ?? "n/a"} · ${settings.region ?? "?"}`}
          </Line>
          <Row>
            <Button
              label="−1 dBm"
              onPress={() =>
                change({
                  power: Math.max(reader.powerRange.min, settings.power - 1),
                })
              }
            />
            <Button
              label="+1 dBm"
              onPress={() =>
                change({
                  power: Math.min(reader.powerRange.max, settings.power + 1),
                })
              }
            />
            <Button
              label="Session"
              onPress={() =>
                change({
                  session: ((settings.session + 1) %
                    4) as RfidSettings["session"],
                })
              }
            />
          </Row>
        </>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Section>
  );
}

function TagLine({ tag, onPress }: { tag: RfidTag; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Text style={styles.mono}>{tag.epc}</Text>
      <Text style={styles.small}>
        {`${tag.rssi} dBm (avg ${tag.averageRssi.toFixed(1)}) · ${tag.readCount} reads · ant ${tag.antenna ?? "?"}${tag.tid ? ` · TID ${tag.tid}` : ""}`}
      </Text>
      <Bar value={tag.proximity} />
    </Pressable>
  );
}

function InventorySection({ onPick }: { onPick: (epc: string) => void }) {
  const inventory = useRfidInventory();
  const { error, run } = useAction();
  const [trigger, setTrigger] = useState(false);
  const [tid, setTid] = useState(false);
  return (
    <Section title="Multiple scan">
      <Toggle
        label="Trigger drives the scan"
        value={trigger}
        onChange={setTrigger}
      />
      {trigger ? (
        <TriggerDriver
          onPress={() => run(() => inventory.start({ tid }))}
          onRelease={() => run(() => inventory.stop())}
        />
      ) : null}
      <Toggle label="Read TIDs" value={tid} onChange={setTid} />
      <Row>
        <Button
          label="Start"
          onPress={() => run(() => inventory.start({ tid }))}
        />
        <Button label="Stop" onPress={() => run(() => inventory.stop())} />
        <Button label="Clear" onPress={() => inventory.clear()} />
      </Row>
      <Line label="Tags">{`${inventory.tags.length}${inventory.isRunning ? " · reading" : ""}`}</Line>
      {inventory.error ? (
        <Text style={styles.error}>{errorText(inventory.error)}</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {inventory.tags.slice(0, 30).map((tag) => (
        <TagLine key={tag.epc} tag={tag} onPress={() => onPick(tag.epc)} />
      ))}
    </Section>
  );
}

/** Mounted only while the trigger drives the scan: the reader hands it over then. */
function TriggerDriver({
  onPress,
  onRelease,
}: {
  onPress: () => void;
  onRelease: () => void;
}) {
  const trigger = useRfidTrigger({ onPress, onRelease });
  return (
    <Text style={styles.small}>
      {trigger.isSupported
        ? `Trigger ${trigger.isPressed ? "pressed" : "released"}`
        : "The adapter keeps the trigger."}
    </Text>
  );
}

function SingleReadSection({ onPick }: { onPick: (epc: string) => void }) {
  const single = useRfidSingleRead();
  const { error, run } = useAction();
  const [done, setDone] = useState(false);
  const [tid, setTid] = useState(false);
  return (
    <Section title="Single read">
      <Toggle label="Read the TID" value={tid} onChange={setTid} />
      <Row>
        <Button
          label={
            single.isReading ? "Reading…" : `Read (500 ms${tid ? ", TID" : ""})`
          }
          onPress={() =>
            run(async () => {
              await single.read({ tid });
              setDone(true);
            })
          }
        />
        <Button
          label={`Read (2 s${tid ? ", TID" : ""})`}
          onPress={() =>
            run(async () => {
              await single.read({ window: 2000, tid });
              setDone(true);
            })
          }
        />
      </Row>
      {single.tag ? (
        <TagLine tag={single.tag} onPress={() => onPick(single.tag!.epc)} />
      ) : done ? (
        <Text style={styles.small}>No tag answered.</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Section>
  );
}

function LocateSection({
  epc,
  onEpcChange,
  setNativeLocate,
}: {
  epc: string;
  onEpcChange: (epc: string) => void;
  setNativeLocate?: (enabled: boolean) => void;
}) {
  const locate = useRfidLocate();
  const { error, run } = useAction();
  const [native, setNative] = useState(true);
  return (
    <Section title="Single search">
      {setNativeLocate ? (
        <Toggle
          label="The reader's own search (off: the engine's)"
          value={native}
          onChange={(value) =>
            run(async () => {
              // Switched between searches only: the next start uses it.
              await locate.stop();
              setNativeLocate(value);
              setNative(value);
            })
          }
        />
      ) : null}
      <TextInput
        style={styles.input}
        value={epc}
        onChangeText={onEpcChange}
        placeholder="EPC (tap a tag above)"
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <Row>
        <Button label="Start" onPress={() => run(() => locate.start(epc))} />
        <Button label="Stop" onPress={() => run(() => locate.stop())} />
      </Row>
      <Line label="Signal">
        {locate.isLocating
          ? locate.isInRange
            ? `${locate.rssi?.toFixed(1)} dBm`
            : "out of range"
          : "stopped"}
      </Line>
      <Bar value={locate.proximity} large />
      {locate.error ? (
        <Text style={styles.error}>{errorText(locate.error)}</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Section>
  );
}

function MeasurementsSection({
  measurements,
  host,
  onReset,
}: {
  measurements: Measurements;
  host: Record<string, unknown>;
  onReset: () => void;
}) {
  const { reads, findingTag, locate } = measurements;
  const rate = batchRate(measurements);
  const share = () =>
    Share.share({
      message: JSON.stringify(toReport(measurements, { host }), null, 2),
    });
  return (
    <Section title="Measurements">
      <Line label="Events">{String(measurements.events)}</Line>
      <Line label="Batches">
        {`${reads.batches} (${reads.reads} reads, largest ${reads.largestBatch}${rate === null ? "" : `, ${rate.toFixed(1)}/s`})`}
      </Line>
      <Line label="Raw RSSI">{`${reads.rssiMin ?? "?"} … ${reads.rssiMax ?? "?"}`}</Line>
      <Line label="Read count max">{String(reads.readCountMax)}</Line>
      <Line label="Threads">{reads.threads.join(", ") || "—"}</Line>
      <Line label="EPC case">
        {reads.batches === 0
          ? "—"
          : reads.lowercaseEpc
            ? "lowercase seen"
            : "uppercase"}
      </Line>
      <Line label="Tag time 0">
        {reads.batches === 0 ? "—" : reads.zeroTime ? "yes" : "no"}
      </Line>
      <Line label="SDK locate value">
        {findingTag.count === 0
          ? "—"
          : `${findingTag.min} … ${findingTag.max} (${findingTag.count})`}
      </Line>
      <Line label="Native locate reads">
        {locate.count === 0
          ? "—"
          : `${locate.count}: RSSI ${locate.rssiMin} … ${locate.rssiMax}, relative distance ${locate.distanceMin ?? "?"} … ${locate.distanceMax ?? "?"}, ${locate.withoutLocation} without location`}
      </Line>
      <Line label="Single reads">
        {measurements.syncReads
          .slice(-4)
          .map(
            (read) =>
              `${read.windowMs} ms, ${read.path === null ? "module before revision 2" : read.path === "read" ? "TID asked" : "TID not asked"}: ${read.size} reads, ${read.tids} with a TID`,
          )
          .join("\n") || "—"}
      </Line>
      <Line label="Battery raw">
        {measurements.battery.map((b) => JSON.stringify(b)).join(", ") || "—"}
      </Line>
      <Line label="Adverts">
        {String(Object.keys(measurements.adverts).length)}
      </Line>
      {Object.entries(measurements.adverts)
        .filter(([, advert]) => advert.likelyReader || advert.name)
        .slice(0, 15)
        .map(([id, advert]) => (
          <Text key={id} style={styles.mono}>
            {`${advert.likelyReader ? "★ " : ""}${id} ${advert.name ?? ""} ${advert.serviceUuids.join(" ")} [${advert.manufacturerIds.join(",")}]`}
          </Text>
        ))}
      {measurements.timeline.slice(-12).map((entry, index) => (
        <Text key={`${entry.at}-${index}`} style={styles.small}>
          {`${new Date(entry.at).toISOString().slice(11, 23)} ${entry.type} ${entry.detail}`}
        </Text>
      ))}
      <Row>
        <Button label="Share report" onPress={share} />
        <Button label="Reset" onPress={onReset} />
      </Row>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Text style={styles.line}>
      <Text style={styles.label}>{`${label}: `}</Text>
      {children}
    </Text>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggle}>
      <Text style={styles.line}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function Bar({ value, large = false }: { value: number; large?: boolean }) {
  return (
    <View style={[styles.track, large && styles.trackLarge]}>
      <View style={[styles.fill, { width: `${Math.round(value * 100)}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingTop: 48, gap: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "600" },
  section: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 12,
  },
  heading: { fontSize: 17, fontWeight: "600" },
  line: { fontSize: 14 },
  label: { fontWeight: "600" },
  small: { fontSize: 12, color: "#555" },
  mono: { fontFamily: "monospace", fontSize: 12 },
  error: { color: "#b3261e", fontSize: 13 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#1f5fbf",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
  },
  pressed: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 6,
    padding: 8,
    fontFamily: "monospace",
  },
  item: { paddingVertical: 6, gap: 2 },
  track: {
    height: 6,
    backgroundColor: "#e5e5e5",
    borderRadius: 3,
    overflow: "hidden",
  },
  trackLarge: { height: 24, borderRadius: 6 },
  fill: { height: "100%", backgroundColor: "#2e7d32" },
});

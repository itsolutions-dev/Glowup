import {
  useBarcodeScanner,
  type BarcodeScannerScan,
  type BarcodeType,
} from "@its/glowup-device/scanner";
import type {
  HoneywellScannerInfo,
  HoneywellScannerProperty,
  HoneywellTriggerControl,
} from "@its/scanner-honeywell";
import { useEffect, useRef, useState } from "react";
import { Platform, Share, Text, TextInput } from "react-native";

import {
  emptyScannerMeasurements,
  recordScanner,
  toScannerReport,
  type ScannerMeasurements,
} from "./scannerMeasurements";
import {
  Button,
  errorText,
  Line,
  Row,
  Section,
  styles,
  Toggle,
  useAction,
} from "./ui";
import type { ScannerVendor } from "./vendors";

/** The first scope's symbologies (plan C7); the others off. */
export const FIRST_SCOPE: readonly BarcodeType[] = [
  "qr",
  "code128",
  "ean13",
  "datamatrix",
];

// What a slow confirmation takes: reads meanwhile are dropped (busy).
const SLOW_CONFIRMATION_MS = 1500;

interface ScanEntry extends BarcodeScannerScan {
  /** When onScan ran. */
  receivedAt: number;
}

function useScannerMeasurements(scanner: ScannerVendor, enabled: boolean) {
  const target = scanner.adapter;
  const [measurements, setMeasurements] = useState(() =>
    emptyScannerMeasurements(),
  );
  const latest = useRef(measurements);
  useEffect(() => {
    target.setDiagnostics(enabled);
    if (!enabled) return;
    const stop = target.subscribeDiagnostics((event) => {
      latest.current = recordScanner(latest.current, event);
    });
    const timer = setInterval(() => setMeasurements(latest.current), 500);
    return () => {
      stop();
      clearInterval(timer);
    };
  }, [target, enabled]);
  const reset = () => {
    latest.current = emptyScannerMeasurements();
    setMeasurements(latest.current);
  };
  return { measurements, reset };
}

/**
 * `@its/glowup-device/scanner` on the host's imager: what reaches `onScan`,
 * and what the SDK did underneath (code ids, AIM ids, charsets, the trigger,
 * the claim), against the plan's "To confirm on the CT40".
 */
export function ScannerScreen({ scanner }: { scanner: ScannerVendor }) {
  const target = scanner.adapter;
  const [diagnostics, setDiagnostics] = useState(true);
  const { measurements, reset } = useScannerMeasurements(scanner, diagnostics);
  const [control, setControl] = useState<HoneywellTriggerControl>("auto");
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const constants = Platform.constants as Record<string, unknown>;
  const host = {
    manufacturer: constants.Manufacturer ?? null,
    model: constants.Model ?? null,
    androidVersion: Platform.Version,
    vendor: scanner.name,
    supported: target.isSupported(),
    nativeRevision: target.nativeRevision(),
    expectedNativeRevision: scanner.expectedRevision,
  };
  const staleNative =
    host.nativeRevision !== null &&
    host.nativeRevision < scanner.expectedRevision;

  return (
    <>
      <Section title="Host">
        <Line label="Device">{`${String(host.manufacturer)} ${String(host.model)}, API ${String(host.androidVersion)}`}</Line>
        <Line label="Scanner adapter">
          {host.supported ? "supported" : scanner.unsupportedReason()}
        </Line>
        <Line label="Native module">
          {host.nativeRevision === null
            ? "—"
            : `revision ${host.nativeRevision} (this JavaScript expects ${scanner.expectedRevision})`}
        </Line>
        {staleNative ? (
          <Text style={styles.error}>
            The app was built before the latest native change: rebuild it (npm
            run android -w @its/rfid-diagnostics). Reloading Metro does not
            update the module.
          </Text>
        ) : null}
        <Toggle
          label="Diagnostics (raw SDK events)"
          value={diagnostics}
          onChange={setDiagnostics}
        />
        <Toggle
          label="The app drives the trigger (client control; off: the service's auto control)"
          value={control === "client"}
          onChange={(client) => {
            const next = client ? "client" : "auto";
            target.setTriggerControl(next);
            setControl(next);
          }}
        />
      </Section>
      {/* Remounted on a trigger control change: the scanner is released and
          claimed again, which applies it. */}
      <ScannerSession
        key={control}
        scanner={scanner}
        onScan={(scan) =>
          setScans((list) =>
            [{ ...scan, receivedAt: Date.now() }, ...list].slice(0, 50),
          )
        }
      />
      <ReadsSection scans={scans} onClear={() => setScans([])} />
      <WedgeSection />
      <ScannerMeasurementsSection
        measurements={measurements}
        scans={scans}
        host={{ ...host, triggerControl: control }}
        onReset={reset}
      />
    </>
  );
}

function ScannerSession({
  scanner,
  onScan,
}: {
  scanner: ScannerVendor;
  onScan: (scan: BarcodeScannerScan) => void;
}) {
  const target = scanner.adapter;
  const [enabled, setEnabled] = useState(true);
  const [firstScope, setFirstScope] = useState(true);
  const [slow, setSlow] = useState(false);
  const [repeat, setRepeat] = useState(true);
  const { error, run } = useAction();
  const [info, setInfo] = useState<HoneywellScannerInfo | null>(null);
  const [devices, setDevices] = useState<HoneywellScannerInfo[] | null>(null);
  const [properties, setProperties] = useState<Record<
    string,
    HoneywellScannerProperty | null
  > | null>(null);

  const state = useBarcodeScanner({
    enabled,
    symbologies: firstScope ? FIRST_SCOPE : null,
    repeatInterval: repeat ? undefined : 0,
    onScan: (scan) => {
      onScan(scan);
      // A confirmation that takes a while: what the busy guard is for.
      if (slow) {
        return new Promise<void>((resolve) =>
          setTimeout(resolve, SLOW_CONFIRMATION_MS),
        );
      }
    },
  });

  // Only the keys this package sets, to see what the service kept.
  const shown = properties
    ? Object.entries(properties).filter(([key]) =>
        /^(DEC_(QR|CODE128|GS1_128|EAN13|EAN8|DATAMATRIX|UPCA|UPCE|PDF417|MSI|POSTAL)|DPR_|TRIG_|NTF_)/.test(
          key,
        ),
      )
    : [];

  return (
    <Section title="Scanner">
      <Line label="State">
        {`${state.state}${state.isActive ? " · held by this screen" : ""}${state.isBusy ? " · busy" : ""}`}
      </Line>
      <Line label="Trigger">
        {state.isTriggerPressed ? "pressed" : "released"}
      </Line>
      {state.error ? (
        <Text style={styles.error}>{errorText(state.error)}</Text>
      ) : null}
      <Toggle
        label="Hold the scanner (off: the device's keyboard wedge gets it back)"
        value={enabled}
        onChange={setEnabled}
      />
      <Toggle
        label="Only QR, Code 128, EAN-13, Data Matrix (off: the device's settings)"
        value={firstScope}
        onChange={setFirstScope}
      />
      <Toggle
        label={`Slow confirmation (${SLOW_CONFIRMATION_MS / 1000} s: reads meanwhile are dropped)`}
        value={slow}
        onChange={setSlow}
      />
      <Toggle
        label="Drop the same code within 1 s"
        value={repeat}
        onChange={setRepeat}
      />
      <Row>
        <Button
          label="Hold to scan"
          onPressIn={() => run(() => state.softwareTrigger(true))}
          onPressOut={() => run(() => state.softwareTrigger(false))}
        />
        <Button label="Retry" onPress={() => state.retry()} />
      </Row>
      <Row>
        <Button
          label="Info"
          onPress={() =>
            run(async () => setInfo(await target.getRawScannerInfo()))
          }
        />
        <Button
          label="Devices"
          onPress={() =>
            run(async () => setDevices(await target.listDevices()))
          }
        />
        <Button
          label="Properties"
          onPress={() =>
            run(async () => setProperties(await target.getAllProperties()))
          }
        />
      </Row>
      {info ? <Text style={styles.mono}>{JSON.stringify(info)}</Text> : null}
      {devices ? (
        <Text style={styles.mono}>{JSON.stringify(devices)}</Text>
      ) : null}
      {properties ? (
        <Text style={styles.mono}>
          {`${Object.keys(properties).length} properties; ${shown
            .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
            .join(" ")}`}
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Section>
  );
}

function ReadsSection({
  scans,
  onClear,
}: {
  scans: ScanEntry[];
  onClear: () => void;
}) {
  return (
    <Section title="Reads (onScan)">
      <Line label="Count">{String(scans.length)}</Line>
      <Button label="Clear" onPress={onClear} />
      {scans.slice(0, 20).map((scan, index) => (
        <Text key={`${scan.receivedAt}-${index}`} style={styles.item}>
          <Text style={styles.mono}>{JSON.stringify(scan.data)}</Text>
          <Text style={styles.small}>
            {`\n${scan.type} · AIM ${scan.aimId ?? "—"} · code id ${scan.rawType} · ${new Date(scan.timestamp).toISOString().slice(11, 23)} (onScan +${scan.receivedAt - scan.timestamp} ms)`}
          </Text>
        </Text>
      ))}
    </Section>
  );
}

/** Whether the claim stops the keyboard wedge: anything typed here came from it. */
function WedgeSection() {
  const [text, setText] = useState("");
  return (
    <Section title="Keyboard wedge">
      <Text style={styles.small}>
        {
          "Measured on the CT40: the wedge types nothing into this app, held or released (other apps get it back). Tap the field and scan: text that appears here came from the wedge, not from onScan, and means that changed."
        }
      </Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Wedge output"
        autoCorrect={false}
        multiline
      />
      <Line label="Typed">{JSON.stringify(text)}</Line>
      <Button label="Clear" onPress={() => setText("")} />
    </Section>
  );
}

function ScannerMeasurementsSection({
  measurements,
  scans,
  host,
  onReset,
}: {
  measurements: ScannerMeasurements;
  scans: ScanEntry[];
  host: Record<string, unknown>;
  onReset: () => void;
}) {
  const { triggers } = measurements;
  const share = () =>
    Share.share({
      message: JSON.stringify(
        toScannerReport(measurements, { host, scans }),
        null,
        2,
      ),
    });
  return (
    <Section title="Measurements">
      <Line label="Events">{String(measurements.events)}</Line>
      <Line label="SDK reads">
        {`${measurements.reads} (onScan: ${scans.length}), no read ${measurements.noReads}`}
      </Line>
      <Line label="Trigger">
        {`${triggers.pressed} pressed, ${triggers.released} released, ${triggers.whileReleased} while not claimed`}
      </Line>
      <Line label="Threads">{measurements.threads.join(", ") || "—"}</Line>
      {Object.entries(measurements.symbologies).map(([key, seen]) => (
        <Text key={key} style={styles.mono}>
          {`code id ${seen.codeId ?? "?"} · AIM ${seen.aimId ?? "?"} · ${seen.charsets.join("/") || "no charset"} · ×${seen.count} · ts ${JSON.stringify(seen.timestamp)} · ${seen.sample}`}
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

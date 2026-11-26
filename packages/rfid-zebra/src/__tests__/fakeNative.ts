import {
  ZEBRA_NATIVE_REVISION,
  type NativeConnection,
  type NativeEvents,
  type NativeTagRead,
  type ZebraRfidNativeModule,
} from "../native";

/** A rejection as the Expo module sends it: an Error with the module's code. */
export function nativeError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

type Listeners = { [K in keyof NativeEvents]: Set<NativeEvents[K]> };

/** An RFD40-like table: 0 to 30 dBm in tenths, by 1 dBm. */
export const POWER_LEVELS = Array.from({ length: 31 }, (_, i) => i * 10);

export interface FakeZebraModule extends ZebraRfidNativeModule {
  /** The reader reports reads (the SDK's units: RSSI dBm, power by index). */
  emitReads(reads: Partial<NativeTagRead>[]): void;
  /** The searched tag's RSSI, as the module sends it while locating. */
  emitLocate(rssi: number): void;
  /** The link drops; the module reconnects by itself. */
  dropConnection(): void;
  pressTrigger(pressed: boolean): void;
  emitReaderFound(
    id: string,
    name: string | null,
    likelyReader?: boolean,
  ): void;
  readonly mode: "idle" | "inventory" | "locate";
  readonly readingTids: boolean;
  readonly triggerHandover: boolean;
  readonly diagnostics: boolean;
  readonly settings: { powerIndex: number; session: number; volume: string };
  readonly listenerCount: number;
  failNext(method: string, code: string, message?: string): void;
  /** The paired readers `connect()` finds, by address or name. */
  paired: { address: string; name: string }[];
  battery: number;
  powerLevels: number[];
}

/**
 * The Kotlin module's behaviour in JavaScript: what the adapter's tests and
 * the conformance kit run against, as no reader answers in a test.
 */
export function createFakeZebraModule(): FakeZebraModule {
  const listeners = {
    onConnection: new Set(),
    onTags: new Set(),
    onLocate: new Set(),
    onModeStop: new Set(),
    onTrigger: new Set(),
    onReaderFound: new Set(),
    onDiscoveryStop: new Set(),
    onDiagnostic: new Set(),
  } as Listeners;
  let connection: NativeConnection = { state: "disconnected", readerId: null };
  let mode: "idle" | "inventory" | "locate" = "idle";
  let readingTids = false;
  let locateEpc = "";
  let triggerHandover = false;
  let diagnostics = false;
  let discovering = false;
  const settings = { powerIndex: 30, session: 0, volume: "HIGH" };
  const failures = new Map<string, Error>();

  function emit<K extends keyof NativeEvents>(
    event: K,
    payload: Parameters<NativeEvents[K]>[0],
  ) {
    [...listeners[event]].forEach((listener) =>
      (listener as (value: typeof payload) => void)(payload),
    );
  }

  function setConnection(next: NativeConnection) {
    connection = next;
    emit("onConnection", { ...next });
  }

  function takeFailure(method: string) {
    const failure = failures.get(method);
    if (failure) {
      failures.delete(method);
      throw failure;
    }
  }

  function requireConnected() {
    if (connection.state !== "connected") {
      throw nativeError("ERR_NOT_CONNECTED", "No RFID reader is connected.");
    }
  }

  const toRead = (read: Partial<NativeTagRead>): NativeTagRead => ({
    epc: "E2801170000002120FD4A0F1",
    rssi: -55,
    antenna: 1,
    seenCount: 1,
    timestamp: Date.now(),
    tid: null,
    ...read,
  });

  const fake: FakeZebraModule = {
    getRevision: () => ZEBRA_NATIVE_REVISION,
    getConnection: () => ({ ...connection }),
    setDiagnostics(enabled) {
      diagnostics = enabled;
    },
    async connect(id) {
      takeFailure("connect");
      // As the Kotlin: a Bluetooth address in uppercase, a name as given.
      const wanted = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(id)
        ? id.toUpperCase()
        : id;
      if (connection.state === "connected" && connection.readerId === wanted) {
        return;
      }
      setConnection({ state: "connecting", readerId: wanted });
      const found = fake.paired.some(
        (reader) =>
          reader.address.toUpperCase() === wanted.toUpperCase() ||
          reader.name === wanted,
      );
      if (!found) {
        setConnection({ state: "disconnected", readerId: null });
        throw nativeError(
          "ERR_NOT_PAIRED",
          `${wanted} is not a reader paired with this device.`,
        );
      }
      setConnection({ state: "connected", readerId: wanted });
    },
    async disconnect() {
      mode = "idle";
      if (connection.state !== "disconnected") {
        setConnection({ state: "disconnected", readerId: null });
      }
    },
    async startInventory(tid) {
      requireConnected();
      takeFailure("startInventory");
      if (mode !== "idle") throw nativeError("ERR_BUSY", "Busy.");
      mode = "inventory";
      readingTids = tid;
    },
    async stopInventory() {
      if (mode === "inventory") mode = "idle";
    },
    async startLocate(epc) {
      requireConnected();
      takeFailure("startLocate");
      if (mode !== "idle") throw nativeError("ERR_BUSY", "Busy.");
      mode = "locate";
      locateEpc = epc.toUpperCase();
    },
    async stopLocate() {
      if (mode === "locate") mode = "idle";
      locateEpc = "";
    },
    async setTriggerHandover(enabled) {
      triggerHandover = enabled;
    },
    async startDiscovery() {
      takeFailure("startDiscovery");
      discovering = true;
    },
    async stopDiscovery() {
      discovering = false;
    },
    async getSettings() {
      requireConnected();
      return {
        powerIndex: settings.powerIndex,
        powerLevels: [...fake.powerLevels],
        session: settings.session,
        volume: settings.volume,
        region: "ETSI",
      };
    },
    async setSettings(powerIndex, session, volume) {
      requireConnected();
      if (powerIndex !== null) settings.powerIndex = powerIndex;
      if (session !== null) settings.session = session;
      if (volume !== null) settings.volume = volume;
    },
    async getBatteryLevel() {
      requireConnected();
      return fake.battery;
    },
    async getReaderInfo() {
      requireConnected();
      return {
        id: connection.readerId,
        name: "RFD40+_211545201D0011",
        model: "RFD4031-G10B700-WR",
        serialNumber: "211545201D0011",
        firmware: "PAAFLS00-005-R01",
        versions: { NGE: "PAAFLS00-005-R01", Bluetooth: "1.2.3" },
      };
    },
    addListener(event, listener) {
      (listeners[event] as Set<typeof listener>).add(listener);
      return {
        remove: () => {
          (listeners[event] as Set<typeof listener>).delete(listener);
        },
      };
    },

    emitReads(reads) {
      const full = reads.map(toRead);
      if (mode === "inventory") {
        // The TID comes only from an inventory that read the TID bank.
        emit("onTags", {
          reads: full.map((read) =>
            readingTids ? read : { ...read, tid: null },
          ),
        });
      } else if (mode === "locate") {
        // The SDK's locationing reports the searched tag; the module sends its RSSI.
        const match = full.filter(
          (read) => read.epc.toUpperCase() === locateEpc,
        );
        if (match.length > 0) {
          emit("onLocate", { rssi: Math.max(...match.map((r) => r.rssi)) });
        }
      }
    },
    emitLocate(rssi) {
      if (mode === "locate") emit("onLocate", { rssi });
    },
    dropConnection() {
      const running = mode;
      mode = "idle";
      if (running !== "idle") {
        emit("onModeStop", {
          mode: running,
          code: "ERR_DISCONNECTED",
          message: "The RFID reader disconnected.",
        });
      }
      setConnection({ state: "reconnecting", readerId: connection.readerId });
    },
    pressTrigger(pressed) {
      if (triggerHandover) emit("onTrigger", { pressed });
    },
    emitReaderFound(id, name, likelyReader = true) {
      if (discovering) emit("onReaderFound", { id, name, likelyReader });
    },
    get mode() {
      return mode;
    },
    get readingTids() {
      return readingTids;
    },
    get triggerHandover() {
      return triggerHandover;
    },
    get diagnostics() {
      return diagnostics;
    },
    get settings() {
      return { ...settings };
    },
    get listenerCount() {
      return Object.values(listeners).reduce((n, set) => n + set.size, 0);
    },
    failNext(method, code, message = "The reader refused.") {
      failures.set(method, nativeError(code, message));
    },
    paired: [{ address: "84:C6:92:12:34:56", name: "RFD40+_211545201D0011" }],
    battery: 87,
    powerLevels: POWER_LEVELS,
  };
  return fake;
}

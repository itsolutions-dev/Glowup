import {
  HONEYWELL_NATIVE_REVISION,
  type HoneywellRfidNativeModule,
  type NativeConnection,
  type NativeEvents,
  type NativeTagRead,
} from "../native";

/** A rejection as the Expo module sends it: an Error with the module's code. */
export function nativeError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

type Listeners = { [K in keyof NativeEvents]: Set<NativeEvents[K]> };

export interface FakeHoneywellModule extends HoneywellRfidNativeModule {
  /** The reader reports reads (the SDK's units: RSSI dBm, power centi-dBm). */
  emitReads(reads: Partial<NativeTagRead>[]): void;
  emitLocate(rssi: number): void;
  /** The link drops; the module reconnects by itself. */
  dropConnection(): void;
  pressTrigger(pressed: boolean): void;
  emitReaderFound(id: string, name: string | null, rssi?: number): void;
  readonly mode: "idle" | "inventory" | "locate";
  readonly triggerHandover: boolean;
  readonly diagnostics: boolean;
  readonly settings: { power: number; session: number; volume: string };
  readonly listenerCount: number;
  failNext(method: string, code: string, message?: string): void;
  battery: string;
  serialNumber: string;
}

/**
 * The Kotlin module's behaviour in JavaScript: what the adapter's tests and
 * the conformance kit run against, since the SDK has no x86 build for an
 * emulator.
 */
export function createFakeHoneywellModule(): FakeHoneywellModule {
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
  let locateEpc = "";
  let triggerHandover = false;
  let diagnostics = false;
  let discovering = false;
  let queued: NativeTagRead[] = [];
  const settings = { power: 3000, session: 1, volume: "MEDIUM" };
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
    readCount: 1,
    frequency: 865700,
    timestamp: Date.now(),
    tid: null,
    ...read,
  });

  const fake: FakeHoneywellModule = {
    getRevision: () => HONEYWELL_NATIVE_REVISION,
    getConnection: () => ({ ...connection }),
    setDiagnostics(enabled) {
      diagnostics = enabled;
    },
    async connect(mac) {
      takeFailure("connect");
      const id = mac.toUpperCase();
      if (connection.state === "connected" && connection.readerId === id) {
        return;
      }
      setConnection({ state: "connecting", readerId: id });
      setConnection({ state: "connected", readerId: id });
    },
    async disconnect() {
      mode = "idle";
      if (connection.state !== "disconnected") {
        setConnection({ state: "disconnected", readerId: null });
      }
    },
    async startInventory() {
      requireConnected();
      takeFailure("startInventory");
      if (mode !== "idle") throw nativeError("ERR_BUSY", "Busy.");
      mode = "inventory";
    },
    async stopInventory() {
      if (mode === "inventory") mode = "idle";
    },
    async startLocate(epc) {
      requireConnected();
      takeFailure("startLocate");
      if (mode !== "idle") throw nativeError("ERR_BUSY", "Busy.");
      mode = "locate";
      locateEpc = epc;
    },
    async stopLocate() {
      if (mode === "locate") mode = "idle";
      locateEpc = "";
    },
    async readOnce(windowMs) {
      requireConnected();
      takeFailure("readOnce");
      await new Promise((resolve) => setTimeout(resolve, windowMs));
      const reads = queued;
      queued = [];
      return reads;
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
      return { ...settings, antennas: 1, region: "Europe" };
    },
    async setSettings(power, session, volume) {
      requireConnected();
      if (power !== null) settings.power = power;
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
        serialNumber: fake.serialNumber,
        rfidSoftware: "2.1.0",
        rfidHardware: "A",
        bluetoothSoftware: "1.0",
        bluetoothHardware: "B",
        sdkVersion: "1.1.0",
        region: "Europe",
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
      if (mode === "inventory") emit("onTags", { reads: full });
      else if (mode === "locate") {
        // The SDK passes the searched tag alone; the module sends its RSSI.
        const match = full.filter((read) => read.epc === locateEpc);
        if (match.length > 0) {
          emit("onLocate", { rssi: Math.max(...match.map((r) => r.rssi)) });
        }
      } else queued.push(...full);
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
    emitReaderFound(id, name, rssi = -60) {
      if (discovering) {
        emit("onReaderFound", { id, name, rssi, likelyReader: true });
      }
    },
    get mode() {
      return mode;
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
    battery: "87",
    serialNumber: "19AA12",
  };
  return fake;
}

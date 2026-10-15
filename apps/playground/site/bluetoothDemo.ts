import {
  BLUETOOTH_CHARACTERISTICS,
  BLUETOOTH_SERVICES,
  decodeUtf8,
  encodeUtf8,
  toBluetoothUuid,
  type BluetoothAdapter,
} from "@its/glowup-device/bluetooth";
import {
  createMockBluetoothAdapter,
  type MockService,
} from "@its/glowup-device/testing";

/**
 * Simulated devices for the Bluetooth page where there is no Bluetooth
 * module (the web, Expo Go): the package's in-memory adapter, driven by a
 * timer so a scan finds three devices with a moving signal, the heart rate
 * monitor notifies every second, and the time clock answers what it is sent
 * over the Nordic UART service.
 */

export const DEMO_HRM = "D0:6F:00:00:00:01";
export const DEMO_CLOCK = "D0:6F:00:00:00:02";
export const DEMO_SCALE = "D0:6F:00:00:00:03";

const HEART_RATE = toBluetoothUuid("180D");
const HEART_RATE_MEASUREMENT = toBluetoothUuid("2A37");
const { deviceInformation, battery, nordicUart } = BLUETOOTH_SERVICES;
const { nordicUartRx, nordicUartTx } = BLUETOOTH_CHARACTERISTICS;

const info = (manufacturer: string, model: string): MockService => ({
  uuid: deviceInformation,
  characteristics: [
    { uuid: "2A29", value: encodeUtf8(manufacturer) },
    { uuid: "2A24", value: encodeUtf8(model) },
    { uuid: "2A26", value: encodeUtf8("1.4.2") },
  ],
});

const batteryService = (level: number): MockService => ({
  uuid: battery,
  characteristics: [
    { uuid: "2A19", properties: { notify: true }, value: [level] },
  ],
});

const GATT: Record<string, MockService[]> = {
  [DEMO_HRM]: [
    {
      uuid: HEART_RATE,
      characteristics: [
        {
          uuid: HEART_RATE_MEASUREMENT,
          properties: { read: false, notify: true },
        },
      ],
    },
    batteryService(92),
    info("Glowup Labs", "HRM-1"),
  ],
  [DEMO_CLOCK]: [
    {
      uuid: nordicUart,
      characteristics: [
        {
          uuid: nordicUartRx,
          properties: { read: false, writeWithoutResponse: true },
        },
        { uuid: nordicUartTx, properties: { read: false, notify: true } },
      ],
    },
    info("Acme Time", "TC-200"),
  ],
  [DEMO_SCALE]: [batteryService(41)],
};

const ADVERTISED = [
  { id: DEMO_HRM, name: "Glowup HRM", rssi: -52, services: [HEART_RATE] },
  {
    id: DEMO_CLOCK,
    name: "Time clock TC-200",
    rssi: -67,
    services: [nordicUart],
  },
  { id: DEMO_SCALE, name: "Scale", rssi: -81, services: [battery] },
];

const TICK = 500;

export function createBluetoothDemo(): BluetoothAdapter {
  const mock = createMockBluetoothAdapter({
    permission: "undetermined",
    gatt: GATT,
    maxMtu: 185,
  });
  let timer: ReturnType<typeof setInterval> | null = null;
  let beats = 0;

  const notifyingHeartRate = () =>
    mock.notifying.has(`${DEMO_HRM}/${HEART_RATE}/${HEART_RATE_MEASUREMENT}`);

  function tick() {
    if (mock.scanning) {
      for (const device of ADVERTISED) {
        mock.discover({
          id: device.id,
          name: device.name,
          rssi: device.rssi + Math.round(Math.random() * 8 - 4),
          advertisement: { serviceUuids: device.services },
        });
      }
    }
    if (notifyingHeartRate()) {
      beats++;
      // Flags 0 (8-bit value), then beats per minute.
      mock.notify(DEMO_HRM, HEART_RATE, HEART_RATE_MEASUREMENT, [
        0,
        68 + Math.round(6 * Math.sin(beats / 3)),
      ]);
    }
    if (!mock.scanning && mock.notifying.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function run() {
    timer ??= setInterval(tick, TICK);
    tick();
  }

  return {
    ...mock,
    async startScan(request, handlers) {
      await mock.startScan(request, handlers);
      run();
    },
    async startNotifications(deviceId, service, characteristic) {
      await mock.startNotifications(deviceId, service, characteristic);
      run();
    },
    async write(deviceId, service, characteristic, value, request) {
      await mock.write(deviceId, service, characteristic, value, request);
      if (deviceId === DEMO_CLOCK && characteristic === nordicUartRx) {
        // The clock answers each line it receives.
        const line = decodeUtf8(value).trim();
        setTimeout(
          () =>
            mock.notify(
              DEMO_CLOCK,
              nordicUart,
              nordicUartTx,
              encodeUtf8(`OK ${line}\n`),
            ),
          TICK,
        );
      }
    },
  };
}

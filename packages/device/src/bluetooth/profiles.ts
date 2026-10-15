import { BluetoothError } from "./errors";
import type { BluetoothService } from "./types";
import { toBluetoothUuid } from "./uuid";

/** SIG-assigned services the package reads, and the serial-over-BLE one. */
export const BLUETOOTH_SERVICES = {
  deviceInformation: toBluetoothUuid("180A"),
  battery: toBluetoothUuid("180F"),
  /**
   * Nordic UART Service: the de facto serial port over BLE (no SIG
   * standard exists). Write to `nordicUartRx`, listen on `nordicUartTx`.
   */
  nordicUart: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
} as const;

export const BLUETOOTH_CHARACTERISTICS = {
  manufacturerName: toBluetoothUuid("2A29"),
  modelNumber: toBluetoothUuid("2A24"),
  serialNumber: toBluetoothUuid("2A25"),
  hardwareRevision: toBluetoothUuid("2A27"),
  firmwareRevision: toBluetoothUuid("2A26"),
  softwareRevision: toBluetoothUuid("2A28"),
  batteryLevel: toBluetoothUuid("2A19"),
  /** The phone writes here (the device's receive line). */
  nordicUartRx: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
  /** The device notifies here (its transmit line). */
  nordicUartTx: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
} as const;

/** UTF-8 bytes as text, as GATT strings travel; trailing NULs dropped. */
export function decodeUtf8(bytes: Uint8Array): string {
  let text = "";
  let i = 0;
  while (i < bytes.length) {
    const first = bytes[i];
    const size =
      first < 0x80
        ? 1
        : first >= 0xf0
          ? 4
          : first >= 0xe0
            ? 3
            : first >= 0xc0
              ? 2
              : 0;
    let code = size === 1 ? first : first & (0xff >> (size + 1));
    let valid = size > 0 && i + size <= bytes.length;
    for (let k = 1; valid && k < size; k++) {
      const next = bytes[i + k];
      if ((next & 0xc0) !== 0x80) valid = false;
      else code = (code << 6) | (next & 0x3f);
    }
    if (valid && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)) {
      text += String.fromCodePoint(code);
      i += size;
    } else {
      text += "�";
      i += 1;
    }
  }
  return text.replace(/\0+$/, "");
}

/** Text as UTF-8 bytes, to write a string to a characteristic. */
export function encodeUtf8(text: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0x10000) {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return Uint8Array.from(bytes);
}

/** The Battery Level characteristic (0x2A19): a percentage in one byte. */
export function parseBatteryLevel(value: Uint8Array): number {
  if (value.length < 1 || value[0] > 100) {
    throw new BluetoothError(
      "failed",
      `Not a battery level: ${value.length === 0 ? "no bytes" : `${value[0]}%`}.`,
    );
  }
  return value[0];
}

/** What the Device Information service (0x180A) tells; `null` for what it lacks. */
export interface DeviceInformation {
  manufacturerName: string | null;
  modelNumber: string | null;
  serialNumber: string | null;
  hardwareRevision: string | null;
  firmwareRevision: string | null;
  softwareRevision: string | null;
}

const DEVICE_INFORMATION_FIELDS = [
  "manufacturerName",
  "modelNumber",
  "serialNumber",
  "hardwareRevision",
  "firmwareRevision",
  "softwareRevision",
] as const;

/** What a connected `useBluetoothDevice()` gives these helpers. */
export interface GattReader {
  services: BluetoothService[] | null;
  read(service: string, characteristic: string): Promise<Uint8Array>;
}

function findService(device: GattReader, uuid: string, name: string) {
  if (!device.services) throw new BluetoothError("not-connected");
  const service = device.services.find((found) => found.uuid === uuid);
  if (!service) {
    throw new BluetoothError("failed", `The device has no ${name} service.`);
  }
  return service;
}

/**
 * Reads the Device Information service: the readable strings it has, one
 * after the other. Rejects when the device has no such service.
 */
export async function readDeviceInformation(
  device: GattReader,
): Promise<DeviceInformation> {
  const service = findService(
    device,
    BLUETOOTH_SERVICES.deviceInformation,
    "Device Information",
  );
  const info: DeviceInformation = {
    manufacturerName: null,
    modelNumber: null,
    serialNumber: null,
    hardwareRevision: null,
    firmwareRevision: null,
    softwareRevision: null,
  };
  for (const field of DEVICE_INFORMATION_FIELDS) {
    const uuid = BLUETOOTH_CHARACTERISTICS[field];
    const found = service.characteristics.find((c) => c.uuid === uuid);
    if (!found?.properties.read) continue;
    // GATT runs one operation at a time anyway.
    info[field] = decodeUtf8(await device.read(service.uuid, uuid)) || null;
  }
  return info;
}

/** Reads the Battery service's level, 0–100. */
export async function readBatteryLevel(device: GattReader): Promise<number> {
  const service = findService(device, BLUETOOTH_SERVICES.battery, "Battery");
  return parseBatteryLevel(
    await device.read(service.uuid, BLUETOOTH_CHARACTERISTICS.batteryLevel),
  );
}

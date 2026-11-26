// The Bluetooth Base UUID: a 16- or 32-bit SIG number fills its first 8 digits.
const BASE_SUFFIX = "-0000-1000-8000-00805f9b34fb";

const SHORT = /^(?:0x)?([0-9a-f]{4}|[0-9a-f]{8})$/i;
const FULL =
  /^([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})$/i;

/**
 * A UUID in the one form the package hands out: lowercase, 128-bit, with
 * dashes. Takes a SIG-assigned short form (`"180D"`, `"0x180d"`, 32-bit
 * `"0000180d"`) or a full 128-bit UUID with or without dashes, in any case:
 * iOS reports SIG UUIDs short and Android long, so comparing raw strings
 * between the two never matches. Throws a `TypeError` for anything else.
 */
export function toBluetoothUuid(uuid: string): string {
  if (typeof uuid !== "string") {
    throw new TypeError(
      `toBluetoothUuid(): expected a string, got ${typeof uuid}.`,
    );
  }
  const short = SHORT.exec(uuid.trim());
  if (short) {
    return `${short[1].toLowerCase().padStart(8, "0")}${BASE_SUFFIX}`;
  }
  const full = FULL.exec(uuid.trim());
  if (full) return full.slice(1).join("-").toLowerCase();
  throw new TypeError(
    `toBluetoothUuid(): "${uuid}" is not a Bluetooth UUID. Use a 16-bit SIG number ("180D") or a 128-bit UUID.`,
  );
}

/**
 * The short SIG form (`"180d"`) of a UUID built on the Bluetooth Base UUID,
 * else the full one: for display and logs.
 */
export function shortBluetoothUuid(uuid: string): string {
  const full = toBluetoothUuid(uuid);
  if (!full.endsWith(BASE_SUFFIX)) return full;
  const prefix = full.slice(0, 8);
  return prefix.startsWith("0000") ? prefix.slice(4) : prefix;
}

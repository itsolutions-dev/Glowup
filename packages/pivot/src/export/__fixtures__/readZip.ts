// A small zip reader for the tests only: it walks the local headers of a stored (method 0) zip and
// checks the end of the central directory, so a test reads back what `zipStored` wrote.
export interface ZipEntry {
  name: string;
  method: number;
  crc: number;
  data: Uint8Array;
  utf8Flag: boolean;
}

export const readZip = (bytes: Uint8Array): ZipEntry[] => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const entries: ZipEntry[] = [];
  let at = 0;
  while (view.getUint32(at, true) === 0x04034b50) {
    const flags = view.getUint16(at + 6, true);
    const method = view.getUint16(at + 8, true);
    const crc = view.getUint32(at + 14, true);
    const compressed = view.getUint32(at + 18, true);
    const size = view.getUint32(at + 22, true);
    const nameLength = view.getUint16(at + 26, true);
    const extraLength = view.getUint16(at + 28, true);
    if (compressed !== size) throw new Error("not stored");
    const start = at + 30 + nameLength + extraLength;
    entries.push({
      name: decoder.decode(bytes.subarray(at + 30, at + 30 + nameLength)),
      method,
      crc,
      data: bytes.slice(start, start + size),
      utf8Flag: (flags & 0x0800) !== 0,
    });
    at = start + size;
  }
  const end = bytes.length - 22;
  if (view.getUint32(end, true) !== 0x06054b50) {
    throw new Error("no end of central directory");
  }
  if (view.getUint16(end + 10, true) !== entries.length) {
    throw new Error("central directory count differs");
  }
  const directory = view.getUint32(end + 16, true);
  if (
    directory !== at ||
    view.getUint32(end + 12, true) !== end - directory ||
    view.getUint32(directory, true) !== 0x02014b50
  ) {
    throw new Error("central directory not where the end says");
  }
  return entries;
};

/** The text of one file in the zip. */
export const zipText = (bytes: Uint8Array, name: string) => {
  const entry = readZip(bytes).find((e) => e.name === name);
  if (!entry) throw new Error(`${name} not in the zip`);
  return new TextDecoder().decode(entry.data);
};

// A zip without compression (method 0): an .xlsx is a zip of a few small XML files, and a pivot's
// sheet stays small, so there is no deflate to write. Pure TypeScript: the same bytes on web and phone.
// The DOS date is fixed (1980-01-01), so the same files always give the same bytes.

const TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export const crc32 = (data: Uint8Array): number => {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

export const utf8 = (text: string): Uint8Array =>
  new TextEncoder().encode(text);

const DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1980-01-01
const UTF8_NAMES = 0x0800;

export const zipStored = (
  files: { name: string; data: Uint8Array }[],
): Uint8Array => {
  const parts = files.map((file) => ({
    ...file,
    nameBytes: utf8(file.name),
    crc: crc32(file.data),
  }));
  const localSize = parts.reduce(
    (sum, p) => sum + 30 + p.nameBytes.length + p.data.length,
    0,
  );
  const centralSize = parts.reduce(
    (sum, p) => sum + 46 + p.nameBytes.length,
    0,
  );
  const out = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(out.buffer);
  let at = 0;
  const u16 = (v: number) => {
    view.setUint16(at, v, true);
    at += 2;
  };
  const u32 = (v: number) => {
    view.setUint32(at, v, true);
    at += 4;
  };
  const bytes = (b: Uint8Array) => {
    out.set(b, at);
    at += b.length;
  };

  const offsets: number[] = [];
  parts.forEach((p) => {
    offsets.push(at);
    u32(0x04034b50);
    u16(20); // version needed: 2.0
    u16(UTF8_NAMES);
    u16(0); // stored
    u16(0); // time
    u16(DOS_DATE);
    u32(p.crc);
    u32(p.data.length);
    u32(p.data.length);
    u16(p.nameBytes.length);
    u16(0); // extra
    bytes(p.nameBytes);
    bytes(p.data);
  });

  const directory = at;
  parts.forEach((p, i) => {
    u32(0x02014b50);
    u16(20); // made by
    u16(20); // needed
    u16(UTF8_NAMES);
    u16(0);
    u16(0);
    u16(DOS_DATE);
    u32(p.crc);
    u32(p.data.length);
    u32(p.data.length);
    u16(p.nameBytes.length);
    u16(0); // extra
    u16(0); // comment
    u16(0); // disk
    u16(0); // internal attributes
    u32(0); // external attributes
    u32(offsets[i]);
    bytes(p.nameBytes);
  });

  u32(0x06054b50);
  u16(0);
  u16(0);
  u16(parts.length);
  u16(parts.length);
  u32(centralSize);
  u32(directory);
  u16(0); // comment
  return out;
};

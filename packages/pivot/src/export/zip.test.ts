import { readZip } from "./__fixtures__/readZip";
import { crc32, utf8, zipStored } from "./zip";

describe("crc32", () => {
  test("matches the check value of CRC-32", () => {
    expect(crc32(utf8("123456789"))).toBe(0xcbf43926);
  });

  test("is 0 for no bytes", () => {
    expect(crc32(new Uint8Array())).toBe(0);
  });
});

describe("zipStored", () => {
  test("a zip reader finds every file, stored, with its CRC and bytes", () => {
    const files = [
      { name: "a.txt", data: utf8("ciao") },
      { name: "dir/b.xml", data: utf8("<x/>") },
    ];
    const entries = readZip(zipStored(files));
    expect(entries.map((e) => e.name)).toEqual(["a.txt", "dir/b.xml"]);
    entries.forEach((entry, i) => {
      expect(entry.method).toBe(0);
      expect(entry.utf8Flag).toBe(true);
      expect(entry.crc).toBe(crc32(files[i].data));
      expect(Array.from(entry.data)).toEqual(Array.from(files[i].data));
    });
  });

  test("the same files give the same bytes", () => {
    const files = [{ name: "à.txt", data: utf8("è") }];
    expect(Array.from(zipStored(files))).toEqual(Array.from(zipStored(files)));
    expect(readZip(zipStored(files))[0].name).toBe("à.txt");
  });
});

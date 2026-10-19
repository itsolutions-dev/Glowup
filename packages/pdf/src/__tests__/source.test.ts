import { createPdfError } from "../errors";
import { decodeBase64, resolveSource, sourceKey } from "../source";
import { createMemoryPdf } from "../testing";

describe("decodeBase64", () => {
  it("decodes padded, unpadded, url-safe and data-URL text", () => {
    const hello = [104, 101, 108, 108, 111]; // "hello"
    expect([...decodeBase64("aGVsbG8=")]).toEqual(hello);
    expect([...decodeBase64("aGVsbG8")]).toEqual(hello);
    expect([...decodeBase64("data:application/pdf;base64,aGVs\nbG8=")]).toEqual(
      hello,
    );
    expect([...decodeBase64("-_8")]).toEqual([251, 255]); // "+/8=" in the url-safe alphabet
  });

  it("rejects text that is not base64", () => {
    expect(() => decodeBase64("not base64!")).toThrow(
      expect.objectContaining({ code: "format" }),
    );
    expect(() => decodeBase64("")).toThrow(
      expect.objectContaining({ code: "format" }),
    );
    expect(() => decodeBase64("a")).toThrow(
      expect.objectContaining({ code: "format" }),
    );
  });
});

describe("sourceKey", () => {
  it("is the same for the same content in a new object, and differs when it changes", () => {
    const a = sourceKey({
      uri: "https://x/a.pdf",
      headers: { A: "1", B: "2" },
    });
    expect(
      sourceKey({ uri: "https://x/a.pdf", headers: { B: "2", A: "1" } }),
    ).toBe(a);
    expect(sourceKey({ uri: "https://x/a.pdf" })).not.toBe(a);
    expect(
      sourceKey({ uri: "https://x/b.pdf", headers: { A: "1", B: "2" } }),
    ).not.toBe(a);
    expect(sourceKey({ base64: "aGVsbG8=" })).toBe(
      sourceKey({ base64: "aGVsbG8=" }),
    );
    expect(sourceKey({ bytes: new Uint8Array([1, 2, 3]) })).toBe(
      sourceKey({ bytes: new Uint8Array([1, 2, 3]) }),
    );
    expect(sourceKey({ bytes: new Uint8Array([1, 2, 3]) })).not.toBe(
      sourceKey({ bytes: new Uint8Array([1, 2, 4]) }),
    );
  });
});

describe("resolveSource", () => {
  it("downloads a remote uri with its headers and marks the file temporary", async () => {
    const { adapters, calls } = createMemoryPdf();
    const file = await resolveSource(
      { uri: "https://x/a.pdf", headers: { Authorization: "Bearer t" } },
      adapters.files,
    );
    expect(file.temporary).toBe(true);
    expect(calls.downloaded).toEqual([
      { uri: "https://x/a.pdf", headers: { Authorization: "Bearer t" } },
    ]);
  });

  it("uses a local file as it is and never marks it temporary", async () => {
    const { adapters, calls } = createMemoryPdf();
    expect(
      await resolveSource({ uri: "file:///docs/a.pdf" }, adapters.files),
    ).toEqual({ uri: "file:///docs/a.pdf", temporary: false });
    expect(calls.downloaded).toEqual([]);
  });

  it("writes base64 and bytes to a temporary file", async () => {
    const { adapters, calls } = createMemoryPdf();
    const fromText = await resolveSource(
      { base64: "aGVsbG8=" },
      adapters.files,
    );
    const fromBytes = await resolveSource(
      { bytes: new Uint8Array([1, 2]) },
      adapters.files,
    );
    expect(fromText.temporary && fromBytes.temporary).toBe(true);
    expect([...calls.written[0]]).toEqual([104, 101, 108, 108, 111]);
    expect([...calls.written[1]]).toEqual([1, 2]);
  });

  it("turns a failed download into a network error", async () => {
    const { adapters } = createMemoryPdf({ downloadError: new Error("401") });
    await expect(
      resolveSource({ uri: "https://x/a.pdf" }, adapters.files),
    ).rejects.toMatchObject({ code: "network", message: "401" });
  });

  it("keeps the format error of a bad base64 text", async () => {
    const { adapters } = createMemoryPdf();
    await expect(
      resolveSource({ base64: "***" }, adapters.files),
    ).rejects.toEqual(
      createPdfError("format", "The base64 text is not valid."),
    );
  });
});

import { createExpoFiles, expoNative } from "../adapters";

// Under jest there is no GlowupPdf module, which is what an app without the
// package in its dependencies looks like.
describe("the Expo adapters without the native module", () => {
  it("answers that it cannot search, and fails to open with a readable error", async () => {
    await expect(expoNative.capabilities()).resolves.toEqual({ search: false });
    await expect(expoNative.open("file:///a.pdf")).rejects.toMatchObject({
      name: "PdfError",
      code: "native-missing",
    });
    await expect(
      expoNative.renderPage("file:///a.pdf", 0, 100),
    ).rejects.toMatchObject({ code: "native-missing" });
  });
});

// A mockDisk in memory behind expo-file-system: what the download writes, reads back and renames.
const mockDisk = new Map<string, Uint8Array>();
let mockServed = new TextEncoder().encode("%PDF-1.7\nbody");
let mockFails: Error | null = null;
const mockProgress: { bytesWritten: number; totalBytes: number }[] = [];

class FakeFile {
  uri: string;
  constructor(dir: string, name: string) {
    this.uri = `${dir}/${name}`;
  }
  static async downloadFileAsync(
    _url: string,
    to: FakeFile,
    options?: { onProgress?: (p: unknown) => void },
  ) {
    mockProgress.forEach((p) => options?.onProgress?.(p));
    if (mockFails) throw mockFails;
    mockDisk.set(to.uri, mockServed);
    return to;
  }
  get exists() {
    return mockDisk.has(this.uri);
  }
  get size() {
    return mockDisk.get(this.uri)?.length ?? 0;
  }
  open() {
    const bytes = mockDisk.get(this.uri)!;
    return { readBytes: (n: number) => bytes.slice(0, n), close() {} };
  }
  async move(target: FakeFile) {
    mockDisk.set(target.uri, mockDisk.get(this.uri)!);
    mockDisk.delete(this.uri);
  }
  delete() {
    mockDisk.delete(this.uri);
  }
}

const expoFiles = createExpoFiles(
  async () => ({ File: FakeFile, Paths: { cache: "file:///cache" } }) as never,
);

describe("expoFiles.download", () => {
  beforeEach(() => {
    mockDisk.clear();
    mockServed = new TextEncoder().encode("%PDF-1.7\nbody");
    mockFails = null;
    mockProgress.length = 0;
  });

  it("hands back a .pdf only once it is whole, leaving no .part behind", async () => {
    const uri = await expoFiles.download("https://x/a.pdf");
    expect(uri).toMatch(/^file:\/\/\/cache\/glowup-pdf-.*\.pdf$/);
    expect([...mockDisk.keys()]).toEqual([uri]);
  });

  it("refuses what is not a PDF (a sign-in page with a 200) and removes it", async () => {
    mockServed = new TextEncoder().encode("<html>Please sign in</html>");
    await expect(expoFiles.download("https://x/a.pdf")).rejects.toMatchObject({
      name: "PdfError",
      code: "format",
    });
    expect(mockDisk.size).toBe(0);
  });

  it("leaves nothing behind when the transfer fails, and reports the share received", async () => {
    mockFails = new Error("aborted");
    mockProgress.push(
      { bytesWritten: 50, totalBytes: 100 },
      { bytesWritten: 70, totalBytes: -1 },
    );
    const seen: (number | null)[] = [];
    await expect(
      expoFiles.download("https://x/a.pdf", undefined, {
        onProgress: (f) => seen.push(f),
      }),
    ).rejects.toThrow("aborted");
    expect(seen).toEqual([0.5, null]);
    expect(mockDisk.size).toBe(0);
  });
});

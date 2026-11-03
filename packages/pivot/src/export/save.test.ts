import { saveXlsx, type SaveModules } from "./save";
import { saveXlsx as saveXlsxWeb } from "./save.web";
import { XLSX_MIME, xlsxName } from "./xlsx";

describe("xlsxName", () => {
  test("pivot.xlsx when empty, safe characters, .xlsx at the end", () => {
    expect(xlsxName()).toBe("pivot.xlsx");
    expect(xlsxName("  ")).toBe("pivot.xlsx");
    expect(xlsxName("Report 10/27")).toBe("Report 10_27.xlsx");
    expect(xlsxName('a\\b:c*d?e"f<g>h|i')).toBe("a_b_c_d_e_f_g_h_i.xlsx");
    expect(xlsxName("a.XLSX")).toBe("a.XLSX");
  });

  test("no control characters, no dot or space at the end, no name Windows keeps for itself", () => {
    expect(xlsxName("Re\u0000po\u001Frt\u007F")).toBe("Report.xlsx");
    expect(xlsxName("Report. . ")).toBe("Report.xlsx");
    expect(xlsxName("Report..xlsx")).toBe("Report.xlsx");
    expect(xlsxName("...")).toBe("pivot.xlsx");
    expect(xlsxName("con")).toBe("con_.xlsx");
    expect(xlsxName("LPT1.xlsx")).toBe("LPT1_.xlsx");
    expect(xlsxName("nul.report")).toBe("nul_.report.xlsx");
    expect(xlsxName("console")).toBe("console.xlsx");
  });
});

describe("saveXlsx on iOS and Android", () => {
  const bytes = new Uint8Array([80, 75, 3, 4, 1, 2]);

  const fakes = ({
    available = true,
    sharingMissing = false,
  }: { available?: boolean; sharingMissing?: boolean } = {}) => {
    const disk: Record<string, Uint8Array> = {};
    const shareAsync = jest.fn(async () => {});
    class File {
      uri: string;
      constructor(dir: { uri: string }, name: string) {
        this.uri = `${dir.uri}/${name}`;
      }
      create(options: { overwrite?: boolean }) {
        if (!options?.overwrite && this.uri in disk) throw new Error("exists");
        disk[this.uri] = new Uint8Array();
      }
      write(data: Uint8Array) {
        disk[this.uri] = data;
      }
    }
    const modules: SaveModules = {
      files: async () =>
        ({ File, Paths: { cache: { uri: "file:///cache" } } }) as never,
      sharing: async () => {
        if (sharingMissing)
          throw new Error("Cannot find module 'expo-sharing'");
        return {
          isAvailableAsync: async () => available,
          shareAsync,
        } as never;
      },
    };
    return { disk, shareAsync, modules };
  };

  test("writes the file in the cache and opens the share sheet", async () => {
    const { disk, shareAsync, modules } = fakes();
    await expect(saveXlsx(bytes, "Report.xlsx", modules)).resolves.toBe(
      "shared",
    );
    expect(Array.from(disk["file:///cache/Report.xlsx"])).toEqual(
      Array.from(bytes),
    );
    expect(shareAsync).toHaveBeenCalledWith(
      "file:///cache/Report.xlsx",
      expect.objectContaining({ mimeType: XLSX_MIME }),
    );
  });

  test("no share sheet: unsupported", async () => {
    const { modules } = fakes({ available: false });
    await expect(saveXlsx(bytes, "Report.xlsx", modules)).rejects.toMatchObject(
      {
        name: "PivotExportError",
        code: "unsupported",
      },
    );
  });

  test("expo-sharing missing: native-missing with a readable message", async () => {
    const { modules } = fakes({ sharingMissing: true });
    await expect(saveXlsx(bytes, "Report.xlsx", modules)).rejects.toMatchObject(
      {
        code: "native-missing",
        message: expect.stringContaining("expo-sharing is not installed"),
      },
    );
  });
});

describe("saveXlsx on the web", () => {
  const original = {
    document: (globalThis as { document?: unknown }).document,
    create: URL.createObjectURL,
    revoke: URL.revokeObjectURL,
  };
  afterEach(() => {
    (globalThis as { document?: unknown }).document = original.document;
    URL.createObjectURL = original.create;
    URL.revokeObjectURL = original.revoke;
  });

  test("downloads a Blob of the bytes under the file name", async () => {
    jest.useFakeTimers();
    try {
      const link = {
        href: "",
        download: "",
        style: {} as Record<string, string>,
        click: jest.fn(),
        remove: jest.fn(),
      };
      (globalThis as { document?: unknown }).document = {
        createElement: jest.fn(() => link),
        body: { appendChild: jest.fn() },
      };
      let blob: Blob | undefined;
      URL.createObjectURL = jest.fn((b: Blob) => {
        blob = b;
        return "blob:pivot";
      });
      URL.revokeObjectURL = jest.fn();

      const bytes = new Uint8Array([80, 75, 3, 4]);
      await expect(saveXlsxWeb(bytes, "Report.xlsx")).resolves.toBe(
        "downloaded",
      );
      expect(link.download).toBe("Report.xlsx");
      expect(link.href).toBe("blob:pivot");
      expect(link.click).toHaveBeenCalledTimes(1);
      expect(blob!.type).toBe(XLSX_MIME);
      expect(blob!.size).toBe(bytes.length);
      // Kept for a while: some Firefox and Safari versions read the file after the click has returned.
      jest.advanceTimersByTime(30_000);
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
      jest.runAllTimers();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:pivot");
    } finally {
      jest.useRealTimers();
    }
  });
});

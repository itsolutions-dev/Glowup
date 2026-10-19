/** @jest-environment node */
import { loadPdfBlob } from "../webSource";

const pdf = (before = "") =>
  new TextEncoder().encode(`${before}%PDF-1.4\n1 0 obj`);
const asFetch = (impl: () => Promise<Response>) =>
  jest.fn(impl) as unknown as typeof fetch & jest.Mock;

describe("loadPdfBlob", () => {
  it("fetches with the headers and hands back a blob typed as a PDF", async () => {
    const fetchMock = asFetch(async () => new Response(pdf(), { status: 200 }));
    const blob = await loadPdfBlob(
      { uri: "https://x/a.pdf", headers: { Authorization: "Bearer t" } },
      fetchMock,
    );
    expect(fetchMock).toHaveBeenCalledWith("https://x/a.pdf", {
      headers: { Authorization: "Bearer t" },
    });
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(0);
  });

  it("reports an HTTP error with its status", async () => {
    const fetchMock = asFetch(
      async () =>
        new Response("no", { status: 401, statusText: "Unauthorized" }),
    );
    await expect(
      loadPdfBlob({ uri: "https://x/a.pdf" }, fetchMock),
    ).rejects.toMatchObject({ code: "network", message: "401 Unauthorized" });
  });

  it("reports a request that fails", async () => {
    const fetchMock = asFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(
      loadPdfBlob({ uri: "https://x/a.pdf" }, fetchMock),
    ).rejects.toMatchObject({ code: "network", message: "Failed to fetch" });
  });

  it("refuses a 200 that is not a PDF, such as a login page", async () => {
    const fetchMock = asFetch(
      async () => new Response("<html>Sign in</html>", { status: 200 }),
    );
    await expect(
      loadPdfBlob({ uri: "https://x/a.pdf" }, fetchMock),
    ).rejects.toMatchObject({ code: "format" });
  });

  it("accepts junk before the header, as the specification allows", async () => {
    const fetchMock = asFetch(
      async () => new Response(pdf("junk\n".repeat(20)), { status: 200 }),
    );
    await expect(
      loadPdfBlob({ uri: "https://x/a.pdf" }, fetchMock),
    ).resolves.toBeInstanceOf(Blob);
  });

  it("builds a blob from bytes and from base64, and checks them too", async () => {
    const fromBytes = await loadPdfBlob({ bytes: pdf() });
    expect(fromBytes.type).toBe("application/pdf");
    const base64 = Buffer.from(pdf()).toString("base64");
    expect((await loadPdfBlob({ base64 })).size).toBe(pdf().length);
    await expect(
      loadPdfBlob({ bytes: new TextEncoder().encode("hello") }),
    ).rejects.toMatchObject({ code: "format" });
  });
});

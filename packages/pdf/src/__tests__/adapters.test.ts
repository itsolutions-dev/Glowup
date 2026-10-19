import { expoNative } from "../adapters";

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

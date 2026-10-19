import { SAMPLE_PDF_PAGES, samplePdf } from "../site/samplePdf";

const text = (bytes: Uint8Array) => String.fromCharCode(...bytes);

describe("the sample PDF", () => {
  it("is a well-formed PDF: every cross-reference offset points at its object", () => {
    const pdf = text(samplePdf());
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);

    const xrefAt = Number(/startxref\n(\d+)\n/.exec(pdf)?.[1]);
    expect(pdf.slice(xrefAt, xrefAt + 4)).toBe("xref");
    const entries = pdf
      .slice(xrefAt)
      .split("\n")
      .filter((line) => / 00000 n $/.test(line));
    expect(entries.length).toBeGreaterThan(SAMPLE_PDF_PAGES * 2);
    entries.forEach((line, i) => {
      const offset = Number(line.slice(0, 10));
      expect(pdf.slice(offset, offset + `${i + 1} 0 obj`.length)).toBe(
        `${i + 1} 0 obj`,
      );
    });
  });

  it("has three pages and the words the checks look for", () => {
    const pdf = text(samplePdf());
    expect(SAMPLE_PDF_PAGES).toBe(3);
    expect(pdf).toContain("/Count 3");
    expect(pdf.match(/hello/gi)).toHaveLength(2);
    expect(pdf).toContain("1,250.00");
  });
});

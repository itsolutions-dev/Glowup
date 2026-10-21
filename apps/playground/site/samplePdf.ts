// A three-page PDF built in code, so the demo and the checks need no file to ship and the
// words on its pages are known: "hello" is on pages 1 and 2, "1,250.00" on page 2.
const PAGES: [title: string, line: string][] = [
  ["Glowup PDF sample", "Page one. This sentence has the word hello in it."],
  ["Second page", "Page two. The total is 1,250.00 euro. Hello again."],
  ["Third page", "Page three. The end."],
];

// Small print on every page, black and red: what a JPEG blurs first (the red is the worst case).
// None of it contains "hello" or a figure, so the checks that search the sample are unchanged.
const SMALL_PRINT = [
  "Small print at 8 points: the quick brown fox jumps over the lazy dog.",
  "Fine print at 6 points: terms and conditions apply to every order.",
];
const RED_PRINT = "Red print at 8 points: payment is due within thirty days.";

const escapeText = (text: string) => text.replace(/[\\()]/g, "\\$&");

export const SAMPLE_PDF_PAGES = PAGES.length;

export const samplePdf = (): Uint8Array => {
  // 1 catalog, 2 page tree, 3 font, then for each page its object and its content stream.
  const kids = PAGES.map((_, i) => `${4 + i * 2} 0 R`).join(" ");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${kids}] /Count ${PAGES.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  PAGES.forEach(([title, line], i) => {
    const content = [
      `BT /F1 28 Tf 72 760 Td (${escapeText(title)}) Tj ET`,
      `BT /F1 14 Tf 72 720 Td (${escapeText(line)}) Tj ET`,
      `BT /F1 8 Tf 72 690 Td (${escapeText(SMALL_PRINT[0])}) Tj ET`,
      `BT /F1 6 Tf 72 676 Td (${escapeText(SMALL_PRINT[1])}) Tj ET`,
      `1 0 0 rg BT /F1 8 Tf 72 660 Td (${escapeText(RED_PRINT)}) Tj ET 0 g`,
    ].join("\n");
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`,
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    );
  });

  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  // Plain ASCII, so a character is a byte.
  return Uint8Array.from(out, (char) => char.charCodeAt(0));
};

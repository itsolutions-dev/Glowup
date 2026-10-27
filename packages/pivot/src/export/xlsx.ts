// The grid as an .xlsx file: what the grid shows (the rows a person left open, the texts and numbers
// of its cells), with the look of AuraPivot's export (a blue header, bold totals on grey, the labels
// indented). The colours are fixed, not the theme's: it is the file the CRM produces.
// Texts are inline strings (no shared strings), numbers are numbers, never a formula.
import type { GridCell, GridModel } from "../grid/model";
import { utf8, zipStored } from "./zip";

export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** A file name for the export: `pivot.xlsx` when empty, no character a file system refuses, `.xlsx` at the end. */
export const xlsxName = (name?: string): string => {
  const clean = (name ?? "").trim().replace(/[\\/:*?"<>|]/g, "_");
  if (!clean) return "pivot.xlsx";
  return /\.xlsx$/i.test(clean) ? clean : `${clean}.xlsx`;
};

// XML 1.0 refuses the control characters other than tab, line feed and carriage return.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;
const strip = (text: string) => text.replace(CONTROL, "");
const escape = (text: string) =>
  strip(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const sheetNameOf = (name?: string) =>
  strip(name ?? "")
    .replace(/[[\]:*?/\\]/g, "")
    .slice(0, 31) || "Pivot";

const columnLetter = (index: number) => {
  let letters = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  }
  return letters;
};

const NORMAL = 0;
const HEADER = 1;
const TOTAL = 2;
// The same two with Excel's built-in 0.00% format: the grid shows 0.45 as 45%.
const PERCENT = { [NORMAL]: 3, [TOTAL]: 4 } as Record<number, number>;

const textCell = (ref: string, style: number, text: string) =>
  text === ""
    ? `<c r="${ref}" s="${style}"/>`
    : `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escape(text)}</t></is></c>`;

// A number only where the grid shows one: an error, or a cell the grid leaves empty, stays text.
const valueCell = (ref: string, style: number, cell: GridCell) =>
  !cell.error && cell.text !== "" && Number.isFinite(cell.value)
    ? `<c r="${ref}" s="${cell.percent ? PERCENT[style] : style}"><v>${cell.value}</v></c>`
    : textCell(ref, style, cell.text);

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const REL =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships";
const OFFICE = "application/vnd.openxmlformats-officedocument.spreadsheetml";

const CONTENT_TYPES = `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="${OFFICE}.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="${OFFICE}.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="${OFFICE}.styles+xml"/></Types>`;

const ROOT_RELS = `${XML}<Relationships xmlns="${PKG_REL}"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

const WORKBOOK_RELS = `${XML}<Relationships xmlns="${PKG_REL}"><Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${REL}/styles" Target="styles.xml"/></Relationships>`;

// Fonts: normal, white bold (header), bold (totals). Fills 0 and 1 are the two Excel requires.
const STYLES = `${XML}<styleSheet xmlns="${MAIN}"><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1D5B9D"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE3E8F1"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="10" fontId="2" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

export const gridToXlsx = (
  model: GridModel,
  options?: { sheetName?: string },
): Uint8Array => {
  const header = ["", ...model.columns.map((c) => c.label)];
  const body = model.rows.map((row) => ({
    style: row.isTotal ? TOTAL : NORMAL,
    label: "  ".repeat(Math.max(0, row.depth)) + row.label,
    cells: row.cells,
  }));

  const longest = header.map((text) => strip(text).length);
  body.forEach(({ label, cells }) => {
    longest[0] = Math.max(longest[0], strip(label).length);
    cells.forEach((c, i) => {
      longest[i + 1] = Math.max(longest[i + 1] ?? 0, strip(c.text).length);
    });
  });
  const cols = longest
    .map(
      (length, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${Math.min(40, Math.max(10, length + 2))}" customWidth="1"/>`,
    )
    .join("");

  const rows = [
    `<row r="1">${header.map((text, i) => textCell(`${columnLetter(i)}1`, HEADER, text)).join("")}</row>`,
    ...body.map(({ style, label, cells }, index) => {
      const r = index + 2;
      return `<row r="${r}">${textCell(`A${r}`, style, label)}${cells
        .map((c, i) => valueCell(`${columnLetter(i + 1)}${r}`, style, c))
        .join("")}</row>`;
    }),
  ].join("");

  const sheet = `${XML}<worksheet xmlns="${MAIN}"><cols>${cols}</cols><sheetData>${rows}</sheetData></worksheet>`;
  const workbook = `${XML}<workbook xmlns="${MAIN}" xmlns:r="${REL}"><sheets><sheet name="${escape(sheetNameOf(options?.sheetName))}" sheetId="1" r:id="rId1"/></sheets></workbook>`;

  return zipStored([
    { name: "[Content_Types].xml", data: utf8(CONTENT_TYPES) },
    { name: "_rels/.rels", data: utf8(ROOT_RELS) },
    { name: "xl/workbook.xml", data: utf8(workbook) },
    { name: "xl/_rels/workbook.xml.rels", data: utf8(WORKBOOK_RELS) },
    { name: "xl/styles.xml", data: utf8(STYLES) },
    { name: "xl/worksheets/sheet1.xml", data: utf8(sheet) },
  ]);
};

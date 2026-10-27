import { PivotEngine } from "../core";
import {
  buildGridModel,
  type GridCell,
  type GridModel,
  type GridRow,
} from "../grid/model";
import { readZip, zipText } from "./__fixtures__/readZip";
import { gridToXlsx } from "./xlsx";

const cell = (
  text: string,
  value: number | null,
  error: string | null = null,
) => ({
  key: text,
  text,
  value,
  error,
});

const row = (
  label: string,
  depth: number,
  isTotal: boolean,
  cells: GridCell[],
): GridRow => ({
  key: label,
  nodeKey: label,
  label,
  depth,
  indent: 0,
  isTotal,
  isGrandTotal: isTotal,
  isSubtotal: false,
  canToggle: false,
  isExpanded: true,
  cells,
});

const column = (label: string) => ({
  key: label,
  nodeKey: label,
  label,
  isTotal: false,
  canToggle: false,
  isExpanded: true,
});

const MODEL: GridModel = {
  columns: [
    column("Count"),
    column("A very long column caption that goes past forty"),
  ],
  rows: [
    row('A & <B> "c"\u0001', 0, false, [cell("5", 5), cell("", null, "boom")]),
    row("x", 1, false, [cell("2", 2), cell("#ERR", null, "boom")]),
    row("Total", -1, true, [cell("7", 7), cell("1.5", 1.5)]),
  ],
  empty: false,
};

const sheet = (model: GridModel = MODEL) =>
  zipText(gridToXlsx(model), "xl/worksheets/sheet1.xml");

describe("gridToXlsx", () => {
  test("the zip holds the six parts of a workbook", () => {
    expect(
      readZip(gridToXlsx(MODEL))
        .map((e) => e.name)
        .sort(),
    ).toEqual(
      [
        "[Content_Types].xml",
        "_rels/.rels",
        "xl/workbook.xml",
        "xl/_rels/workbook.xml.rels",
        "xl/styles.xml",
        "xl/worksheets/sheet1.xml",
      ].sort(),
    );
  });

  test("a number is a number, an error or an empty cell is never one", () => {
    const xml = sheet();
    expect(xml).toContain('<c r="B2" s="0"><v>5</v></c>');
    expect(xml).toMatch(
      /<c r="C3" s="0" t="inlineStr"><is><t[^>]*>#ERR<\/t><\/is><\/c>/,
    );
    expect(xml).toContain('<c r="C2" s="0"/>');
    expect(xml).not.toMatch(/<c r="C[23]"[^>]*><v>/);
  });

  test("a percentage keeps its number and gets a percent format", () => {
    const model: GridModel = {
      ...MODEL,
      rows: [
        row("a", 0, false, [
          { ...cell("45.00%", 0.45), percent: true },
          cell("2", 2),
        ]),
        row("Total", -1, true, [
          { ...cell("100.00%", 1), percent: true },
          cell("2", 2),
        ]),
      ],
    };
    const xml = sheet(model);
    expect(xml).toContain('<c r="B2" s="3"><v>0.45</v></c>');
    expect(xml).toContain('<c r="C2" s="0"><v>2</v></c>');
    expect(xml).toContain('<c r="B3" s="4"><v>1</v></c>');
    const styles = zipText(gridToXlsx(model), "xl/styles.xml");
    expect(styles).toContain('<cellXfs count="5">');
    expect(styles.match(/numFmtId="10"/g)).toHaveLength(2);
  });

  test("special characters keep the XML valid", () => {
    const xml = sheet();
    expect(xml).toContain("A &amp; &lt;B&gt; &quot;c&quot;");
    expect(xml).not.toContain("\u0001");
  });

  test("the header row is blue, the totals bold, the labels indented", () => {
    const xml = sheet();
    const first = xml.match(/<row r="1"[^>]*>(.*?)<\/row>/)![1];
    expect(first.match(/<c /g)!.length).toBe(3);
    expect(first.match(/s="1"/g)!.length).toBe(3);
    expect(first).toContain(">Count<");
    const total = xml.match(/<row r="4"[^>]*>(.*?)<\/row>/)![1];
    expect(total.match(/<c /g)!.length).toBe(3);
    expect(total.match(/s="2"/g)!.length).toBe(3);
    expect(xml).toContain(">  x<");
    const styles = zipText(gridToXlsx(MODEL), "xl/styles.xml");
    expect(styles).toContain('rgb="FF1D5B9D"');
    expect(styles).toContain('rgb="FFE3E8F1"');
    expect(styles).toContain('rgb="FFFFFFFF"');
  });

  test("the columns are as wide as their longest text, from 10 to 40", () => {
    const widths = [
      ...sheet().matchAll(/<col min="(\d+)" max="\d+" width="([\d.]+)"/g),
    ].map((m) => [Number(m[1]), Number(m[2])]);
    expect(widths).toEqual([
      [1, 'A & <B> "c"'.length + 2],
      [2, 10],
      [3, 40],
    ]);
  });

  test("the sheet name is cleaned and short", () => {
    const name = (sheetName?: string) =>
      zipText(gridToXlsx(MODEL, { sheetName }), "xl/workbook.xml").match(
        /<sheet name="([^"]*)"/,
      )![1];
    expect(name()).toBe("Pivot");
    expect(name("[]")).toBe("Pivot");
    const cleaned = name("a/b:c*d?e[f]g" + "x".repeat(40));
    expect(cleaned).toHaveLength(31);
    expect(cleaned).toMatch(/^abcdefgx+$/);
  });

  test("a closed group's rows are not in the file", () => {
    const engine = new PivotEngine();
    engine.setLocale("en-US");
    engine.setData([
      {
        site: { type: "string", caption: "Site" },
        cat: { type: "string", caption: "Category" },
        n: { type: "number", caption: "Count" },
      },
      { site: "A", cat: "x", n: 5 },
      { site: "A", cat: "y", n: 7 },
      { site: "B", cat: "x", n: 11 },
    ]);
    engine.setSlice({
      rows: [{ uniqueName: "site" }, { uniqueName: "cat" }],
      measures: [{ uniqueName: "n", aggregation: "sum" }],
      expands: { expandAll: true },
    } as never);
    const model = () =>
      buildGridModel({
        matrix: engine.processMatrix(),
        slice: engine.getSlice(),
        format: engine.getFormat(),
        metadata: engine.getMetadata(),
        locale: engine.getLocale(),
      });
    expect(sheet(model())).toContain(">  y<");
    expect(sheet(model()).match(/>  x</g)).toHaveLength(2);
    engine.toggleExpanded("__root__|site:A");
    expect(sheet(model())).not.toContain(">  y<");
    expect(sheet(model()).match(/>  x</g)).toHaveLength(1);
  });
});

// The export must compile (spec §5): every palette type, empty containers
// included, exported and type-checked against the app's own tsconfig, in
// memory (the file never touches the disk).
import { dirname, join } from "path";
import ts from "typescript";

import { exportCode } from "../editor/codegen";
import { emptyDocument, type LayoutDocument } from "../editor/document";
import { MANIFEST } from "../editor/manifest";
import { insertNode } from "../editor/operations";
import { STARTERS } from "../editor/starters";

const errorsOf = (code: string): string[] => {
  const configPath = join(__dirname, "../tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    dirname(configPath),
  );
  const file = join(__dirname, "../templates/ExportCheck.tsx").replace(
    /\\/g,
    "/",
  );
  const same = (name: string) => name.replace(/\\/g, "/") === file;
  const host = ts.createCompilerHost(parsed.options);
  const { getSourceFile, fileExists, readFile } = host;
  host.getSourceFile = (name, language, ...rest) =>
    same(name)
      ? ts.createSourceFile(name, code, language)
      : getSourceFile(name, language, ...rest);
  host.fileExists = (name) => same(name) || fileExists(name);
  host.readFile = (name) => (same(name) ? code : readFile(name));
  const program = ts.createProgram(
    [file],
    { ...parsed.options, noEmit: true },
    host,
  );
  return ts
    .getPreEmitDiagnostics(program, program.getSourceFile(file))
    .map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
};

/** Every palette type on the page (containers empty), and a Form holding every field type. */
const everything = (): LayoutDocument => {
  let doc = emptyDocument("Everything");
  const page = { slot: { kind: "page" as const }, index: 0 };
  for (const type of Object.keys(MANIFEST)) {
    doc = insertNode(doc, type, page).doc;
  }
  const form = insertNode(doc, "Form", page);
  doc = form.doc;
  for (const [type, entry] of Object.entries(MANIFEST)) {
    if (entry.field) {
      doc = insertNode(doc, type, {
        slot: { kind: "children", parent: form.id },
        index: 0,
      }).doc;
    }
  }
  return doc;
};

describe("the exported file type-checks", () => {
  it("for every palette type, empty containers and bound fields", () => {
    expect(errorsOf(exportCode(everything()))).toEqual([]);
  }, 180_000);

  it("for every starter", () => {
    for (const { doc } of STARTERS) {
      expect(errorsOf(exportCode(doc))).toEqual([]);
    }
  }, 180_000);
});

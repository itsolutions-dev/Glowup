import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

// The generated galleries are rewritten from previews written for a browser, and
// they run on iOS and Android too. A browser-only global used there passes the
// type checker (the DOM types are loaded) and jest (the code paths that reach it
// need a DOM-like ref or a timer that never fires in a test), then fails on a
// phone: on 6/11 the Editable page closed the app (`document`, in a timer) and the
// Portal page logged `Property 'PointerEvent' doesn't exist`, on a real Android.
const GENERATED = join(__dirname, "../catalogue/variants/generated");
const BROWSER_ONLY = new Set([
  "document",
  "window",
  "navigator",
  "localStorage",
  "getComputedStyle",
  "PointerEvent",
  "MouseEvent",
  "KeyboardEvent",
  "FocusEvent",
]);

/** The browser-only globals a file uses as values (not in a string, comment or type). */
const usedGlobals = (file: string) => {
  const source = ts.createSourceFile(
    file,
    readFileSync(join(GENERATED, file), "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const used = new Set<string>();
  const checked = new Set<string>();
  const visit = (node: ts.Node) => {
    if (ts.isIdentifier(node) && BROWSER_ONLY.has(node.text)) {
      const parent = node.parent;
      const isMemberName =
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isPropertyAssignment(parent) && parent.name === node) ||
        ts.isJsxAttribute(parent);
      if (ts.isTypeOfExpression(parent)) checked.add(node.text);
      else if (!isMemberName) used.add(node.text);
    }
    if (!ts.isTypeNode(node)) ts.forEachChild(node, visit);
  };
  visit(source);
  return [...used].filter((name) => !checked.has(name));
};

describe("the generated variant galleries on iOS and Android", () => {
  const files = readdirSync(GENERATED).filter((file) => file.endsWith(".tsx"));

  it("finds the galleries", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it.each(files)(
    "%s uses a browser-only global only after checking it exists",
    (file) => {
      expect(usedGlobals(file)).toEqual([]);
    },
  );
});

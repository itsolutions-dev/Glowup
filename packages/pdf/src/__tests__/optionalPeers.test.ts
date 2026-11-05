// An app without expo-file-system, expo-print or expo-sharing must still bundle, and get the readable
// `native-missing` error when the viewer first needs the module. Metro (with Expo's
// `allowOptionalDependencies`) lets a missing module through only when its `import()` is optional in
// Metro's own terms: inside a `try` block or with a `.catch` on it. Ask Metro itself (as the pivot does).
import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";

/* eslint-disable @typescript-eslint/no-require-imports */
const collectDependencies =
  require("metro/private/ModuleGraph/worker/collectDependencies").default as (
    ast: unknown,
    options: Record<string, unknown>,
  ) => { dependencies: { name: string; data: { isOptional?: boolean } }[] };
/* eslint-enable @typescript-eslint/no-require-imports */

const dependencies = () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../adapters.ts"),
    "utf8",
  );
  const ast = parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });
  return collectDependencies(ast, {
    asyncRequireModulePath: "expo/async-require",
    dependencyMapName: null,
    dynamicRequires: "reject",
    inlineableCalls: [],
    keepRequireNames: true,
    allowOptionalDependencies: true,
    unstable_allowRequireContext: false,
  }).dependencies;
};

test.each(["expo-file-system", "expo-print", "expo-sharing"])(
  "adapters.ts loads %s as an optional dependency",
  (name) => {
    const dependency = dependencies().find((d) => d.name === name);
    expect(dependency).toBeDefined();
    expect(dependency!.data.isOptional).toBe(true);
  },
);

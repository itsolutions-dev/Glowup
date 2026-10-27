// An app without expo-sharing or expo-file-system must still bundle, and get the readable error at the tap.
// Metro (with Expo's `allowOptionalDependencies`) lets a missing module through only when its `import()`
// is optional in Metro's own terms: inside a `try` block or with a `.catch` on it. Ask Metro itself.
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

const dependenciesOf = (file: string) => {
  const source = fs.readFileSync(path.join(__dirname, file), "utf8");
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

test.each(["expo-sharing", "expo-file-system"])(
  "save.ts loads %s as an optional dependency",
  (name) => {
    const dependency = dependenciesOf("save.ts").find((d) => d.name === name);
    expect(dependency).toBeDefined();
    expect(dependency!.data.isOptional).toBe(true);
  },
);

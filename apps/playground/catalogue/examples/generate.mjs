// Embeds each example's own source file as a string, and imports its component,
// so the page can put the code in an editor beside the component it renders.
//
// There is one example per catalogue page and its file is named after the
// component: `Button.tsx` is the example of /components/Button.
//
// The same idea as templates/generate.mjs: an example is a real file, type
// checked and linted like the rest of the app, and what the reader edits is
// exactly what renders until they change it. A hand-copied string would drift
// from the component the first time someone edited one and not the other.
//
// Run with `npm run examples -w @its/glowup-playground`; CI regenerates and
// fails on a diff (the examples' test).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "examples.generated.ts");

const files = readdirSync(HERE)
  .filter((file) => file.endsWith(".tsx"))
  .sort();

const imports = files.map(
  (file) =>
    `import ${file.replace(/\.tsx$/, "")} from "./${file.replace(/\.tsx$/, "")}";`,
);

const entries = files.map((file) => {
  const id = file.replace(/\.tsx$/, "");
  const source = readFileSync(join(HERE, file), "utf8").replace(/\r\n/g, "\n");
  return `  ${id}: {
    id: ${JSON.stringify(id)},
    Component: ${id},
    file: ${JSON.stringify(file)},
    source: ${JSON.stringify(source)},
  },`;
});

writeFileSync(
  OUT,
  `// GENERATED — do not edit.
// Source: apps/playground/catalogue/examples/*.tsx
// Regenerate with \`npm run examples -w @its/glowup-playground\`.
import type { ComponentType } from "react";

${imports.join("\n")}

export const EXAMPLES: Record<
  string,
  { id: string; Component: ComponentType; file: string; source: string }
> = {
${entries.join("\n")}
};
`,
  "utf8",
);

// Same reason as the other generators: npx is a .cmd shim on Windows.
execFileSync(
  process.execPath,
  [
    createRequire(import.meta.url).resolve("prettier/bin/prettier.cjs"),
    "--write",
    OUT,
  ],
  { stdio: "inherit" },
);

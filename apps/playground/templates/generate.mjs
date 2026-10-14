// Embeds each template's own source file as a string, so the page can show
// the JSX beside the screen it renders.
//
// Metro has no raw-text import, and a hand-copied snippet would drift from the
// screen above it the first time someone edited one and not the other. Here
// the file IS the snippet: what the reader copies is exactly what renders.
// The Glowup components each template imports are read off its import list,
// for the page's "built with" links.
//
// Run with `npm run templates -w @its/glowup-playground`; CI regenerates and
// fails on a diff.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "sources.generated.ts");

/** Value imports from the library whose name is a component (PascalCase). */
const componentsOf = (source) => {
  const match = source.match(/import\s*{([^}]*)}\s*from\s*"@its\/glowup-ui"/);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((name) => name.trim())
    .filter((name) => /^[A-Z]/.test(name))
    .sort();
};

const entries = readdirSync(HERE)
  .filter((file) => file.endsWith(".tsx"))
  .sort()
  .map((file) => {
    const source = readFileSync(join(HERE, file), "utf8").replace(
      /\r\n/g,
      "\n",
    );
    return `  ${file.replace(/\.tsx$/, "")}: {
    file: ${JSON.stringify(file)},
    components: ${JSON.stringify(componentsOf(source))},
    source: ${JSON.stringify(source)},
  },`;
  });

writeFileSync(
  OUT,
  `// GENERATED — do not edit.
// Source: apps/playground/templates/*.tsx
// Regenerate with \`npm run templates -w @its/glowup-playground\`.

export const TEMPLATE_SOURCES = {
${entries.join("\n")}
};
`,
  "utf8",
);

// Same reason as the variants generator: npx is a .cmd shim on Windows.
execFileSync(
  process.execPath,
  [
    createRequire(import.meta.url).resolve("prettier/bin/prettier.cjs"),
    "--write",
    OUT,
  ],
  { stdio: "inherit" },
);

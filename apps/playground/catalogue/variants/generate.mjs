// Generates the site's variant galleries from the authored previews in
// .design-sync/previews.
//
// Those files are the curated demos of every component — several named states
// each — and they are the right source for the documentation site too. They are
// written for a browser, though: `<div>` and `React.CSSProperties`, because the
// design-sync converter bundles them with an esbuild that has no react-native
// resolution. Rewriting them in place would break that pipeline, and writing a
// second set of demos by hand would mean two galleries drifting apart.
//
// So they stay authored once, in the browser dialect, and this generator
// rewrites their layout primitives into React Native ones — `<div>` → `<View>`,
// `CSSProperties` → `ViewStyle`, minus the `display` declarations React Native
// has no equivalent for. Everything else, including the component usage that is
// the actual content, passes through untouched.
//
// The safety net is the type checker: a converted file that uses a CSS property
// React Native's ViewStyle does not have fails `npm run type-check` rather than
// rendering wrongly. Anything the rewrite cannot handle is excluded here by name
// and belongs in ./manual instead.
//
// Run with `npm run variants -w @its/glowup-playground`.
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../../..");
const PREVIEWS = resolve(REPO_ROOT, ".design-sync/previews");
const OUT_DIR = resolve(HERE, "generated");

/**
 * Previews the rewrite deliberately does not attempt, each for a reason the
 * comment beside it gives. A mechanical rewrite of any of these would produce
 * something that type-checks but lays out differently from the demo the author
 * wrote, which is worse than having no gallery for that component. Hand-written
 * replacements belong in ./manual.
 */
const EXCLUDED = new Set([
  // Draws JSX SVG inside a custom `source` render prop. react-native-svg's
  // elements are components, not intrinsics, so there is nothing to rewrite to.
  // (Card and Image also contain `<svg`, but inside data-URI strings, which
  // pass through untouched.)
  "Icon",
  // A scrollable list built as a div with onScroll — that is a ScrollView in
  // React Native, not a View with a handler.
  "AnimatedFAB",
  // Measures its anchor with querySelector.
  "Autocomplete",
  // Lays its examples out with CSS grid.
  "Tooltip",
]);

/**
 * Modules in the previews directory that document a provider or a singleton
 * rather than a catalogued component. They have no page to appear on.
 */
const NOT_CATALOGUED = new Set([
  "AlertProvider",
  "AlertProviderWrapper",
  "ThemeProvider",
  "ToastProvider",
  "SafeAreaProvider",
  "AppBar",
  "StatusBar",
  "HStack",
  "VStack",
]);

/** `WithIcons` → `With icons`, `FullWidth` → `Full width`. */
const titleOf = (exportName) => {
  const spaced = exportName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  return (
    spaced.charAt(0).toUpperCase() +
    spaced
      .slice(1)
      .toLowerCase()
      // Keep acronyms and component names the author capitalised.
      .replace(/\b(fab|md3|ios|api|ui)\b/g, (m) => m.toUpperCase())
  );
};

/**
 * `padding: "12px 20px"` → the longhand React Native understands. Returns
 * undefined for anything that is not a plain list of pixel values, so a
 * shorthand this does not understand is left alone and fails the type check
 * rather than being silently mangled.
 */
const expandBoxShorthand = (property, value) => {
  const parts = value.trim().split(/\s+/);
  if (parts.length < 2 || parts.length > 4) return undefined;
  const numbers = parts.map((part) => {
    const match = /^(-?\d+(?:\.\d+)?)px$/.exec(part);
    return match ? Number(match[1]) : undefined;
  });
  if (numbers.some((n) => n === undefined)) return undefined;

  const [top, right, bottom = top, left = right] = numbers;
  const side = (suffix, amount) => `${property}${suffix}: ${amount}`;
  if (parts.length === 2) {
    return [side("Vertical", top), side("Horizontal", right)].join(", ");
  }
  return [
    side("Top", top),
    side("Right", right),
    side("Bottom", bottom),
    side("Left", left),
  ].join(", ");
};

/**
 * The object literal a declaration sits in, found by balancing braces outwards
 * from it. Good enough for a style object: the values in one are strings and
 * numbers, so there is no brace inside a literal that this could trip over.
 */
const enclosingObjectLiteral = (source, index) => {
  let depth = 0;
  let start = -1;
  for (let i = index; i >= 0; i -= 1) {
    if (source[i] === "}") depth += 1;
    else if (source[i] === "{") {
      if (depth === 0) {
        start = i;
        break;
      }
      depth -= 1;
    }
  }
  if (start === -1) return undefined;

  depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return undefined;
};

/** Whether the style object around `index` already picks a main axis. */
const declaresFlexDirection = (source, index) =>
  /\bflexDirection\s*:/.test(enclosingObjectLiteral(source, index) ?? "");

const convert = (source) => {
  let out = source;

  out = out.replace(/React\.CSSProperties/g, "ViewStyle");

  // The two dialects disagree on what a flex container defaults to: CSS lays
  // one out in a row, React Native in a column. So dropping `display: "flex"`
  // outright silently turned every unqualified row in a preview into a stack —
  // captions under icons became a vertical list, a `space-between` row put its
  // two halves on separate lines, and the Divider gallery squeezed three stats
  // into a 56px column until their text overlapped. A flex container that
  // never said which way it runs meant `row`, so say it.
  out = out.replace(/\bdisplay:\s*"([^"]*)"/g, (whole, value, index) =>
    /flex$/.test(value) && !declaresFlexDirection(out, index)
      ? 'flexDirection: "row"'
      : whole,
  );

  // `display` has no React Native counterpart worth keeping: flex is the only
  // layout there is, and `inline-flex` does not exist at all. Whatever the
  // rewrite above left — `block`, `none`, a container that set its own
  // direction — is dropped wherever it appears: on its own line in a style
  // constant, or inline in a literal.
  out = out.replace(/^[ \t]*display:\s*"[^"]*",?[ \t]*\r?\n/gm, "");
  out = out.replace(/\bdisplay:\s*"[^"]*",\s*/g, "");
  out = out.replace(/,\s*display:\s*"[^"]*"/g, "");
  // Whatever is left is a lone declaration: `style={{ display: "inline-flex" }}`.
  out = out.replace(/\bdisplay:\s*"[^"]*"\s*/g, "");

  // CSS shorthands the browser expands and React Native does not.
  out = out.replace(
    /\b(padding|margin):\s*"([^"]+)"/g,
    (whole, property, value) => expandBoxShorthand(property, value) ?? whole,
  );
  out = out.replace(/\boverflowY:\s*"auto"/g, 'overflow: "scroll"');
  out = out.replace(/\boverflowX:\s*"auto"/g, 'overflow: "scroll"');

  // `textAlign` on a layout wrapper is a browser-only inheritance trick: React
  // Native never inherits text styles, so the property does nothing on a View
  // and the previews that use it already repeat it on the Typography inside.
  out = out.replace(/^[ \t]*textAlign:\s*"[^"]*",?[ \t]*\r?\n/gm, "");

  // A ref on a layout wrapper points at the View the wrapper became.
  out = out.replace(/HTMLDivElement/g, "View");

  // JSX host elements.
  out = out.replace(/<div(\s|>)/g, "<View$1");
  out = out.replace(/<\/div>/g, "</View>");

  // Import only what the converted file actually uses: an unused import is a
  // lint error, and not every preview has a layout wrapper or a style object.
  const needed = [
    out.includes("<View") ? "View" : null,
    out.includes("ViewStyle") ? "type ViewStyle" : null,
  ].filter(Boolean);

  // The React Native import goes after the React one, which every preview
  // opens with, alongside the Variant type the generated footer needs.
  out = out.replace(
    /^import React from "react";$/m,
    [
      'import React from "react";',
      needed.length
        ? `import { ${needed.join(", ")} } from "react-native";`
        : null,
      'import type { Variant } from "../types";',
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return out;
};

/** Exported preview functions, in the order the author wrote them. */
const exportedVariants = (source) => {
  const found = [];
  const pattern =
    /(\/\*\*([\s\S]*?)\*\/\s*)?export const ([A-Z][A-Za-z0-9]*)\s*=/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const description = (match[2] ?? "")
      .split("\n")
      .map((line) => line.replace(/^\s*\*?\s?/, "").trim())
      .join(" ")
      .trim();
    found.push({ name: match[3], description: description || undefined });
  }
  return found;
};

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const modules = [];
const skipped = [];

for (const file of readdirSync(PREVIEWS).sort()) {
  if (!file.endsWith(".tsx")) continue;
  const component = file.replace(/\.tsx$/, "");

  if (NOT_CATALOGUED.has(component)) {
    skipped.push({ component, reason: "not a catalogued component" });
    continue;
  }
  if (EXCLUDED.has(component)) {
    skipped.push({ component, reason: "hand-written in ./manual" });
    continue;
  }

  const source = readFileSync(join(PREVIEWS, file), "utf8");
  const variants = exportedVariants(source);
  if (variants.length === 0) {
    skipped.push({ component, reason: "no exported previews" });
    continue;
  }

  const header = `// GENERATED — do not edit.
// Source: .design-sync/previews/${file}
// Regenerate with \`npm run variants -w @its/glowup-playground\`.
`;

  const footer = `
export const variants: Variant[] = [
${variants
  .map(
    (variant) =>
      `  {\n    name: ${JSON.stringify(variant.name)},\n    title: ${JSON.stringify(
        titleOf(variant.name),
      )},\n${
        variant.description
          ? `    description: ${JSON.stringify(variant.description)},\n`
          : ""
      }    render: ${variant.name},\n  },`,
  )
  .join("\n")}
];
`;

  const body = convert(source);

  writeFileSync(join(OUT_DIR, file), header + body + footer, "utf8");
  modules.push({ component, file, count: variants.length });
}

const barrel = `// GENERATED — do not edit.
// Built from .design-sync/previews by \`npm run variants -w @its/glowup-playground\`.
import type { Variant } from "../types";
${modules
  .map((m) => `import { variants as ${m.component} } from "./${m.component}";`)
  .join("\n")}

export const GENERATED_VARIANTS: Record<string, Variant[]> = {
${modules.map((m) => `  ${m.component},`).join("\n")}
};
`;

writeFileSync(join(OUT_DIR, "index.ts"), barrel, "utf8");

// Removing a `display` declaration leaves the surrounding literal formatted for
// a line it no longer has. Generated code still has to pass `npm run lint`, so
// the output is handed to the repo's own formatter rather than to a reviewer.
execFileSync("npx", ["prettier", "--write", "--log-level", "warn", OUT_DIR], {
  stdio: "inherit",
});

const total = modules.reduce((sum, m) => sum + m.count, 0);
console.log(
  `variants: ${modules.length} components, ${total} demos → catalogue/variants/generated`,
);
for (const { component, reason } of skipped) {
  console.log(`  - skipped ${component}: ${reason}`);
}

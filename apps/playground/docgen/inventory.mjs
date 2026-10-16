// Writes docs/component-inventory.md: every component of @its/glowup-ui with all
// its props, sorted into added / updated / kept against the commit the Solaris
// work started from. The props come from docgen/props.generated.json (run
// `npm run docgen` first), the baseline from the same file at BASELINE.
//
//   npm run inventory -w @its/glowup-playground
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The commit before the first library change of this work (hooks, 2026-10-15).
const BASELINE = "14a148f";
const PROPS = "apps/playground/docgen/props.generated.json";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const current = JSON.parse(readFileSync(resolve(root, PROPS), "utf8"));
const base = JSON.parse(
  execFileSync("git", ["show", `${BASELINE}:${PROPS}`], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  }),
);

// Not components, so docgen does not list them: kept by hand, one line each.
const OTHER = [
  [
    "Hook",
    "`useDebouncedValue(value, delayMs)`, `useDebouncedCallback(fn, delayMs)` (with `cancel`, `flush`)",
    "Fase 2, lotto 2A",
  ],
  [
    "Hook",
    "`useBreakpoint(overrides?)`, `sizeClassFor(width)`, `SIZE_CLASSES` (window size classes M3)",
    "Fase 2, lotto 2A",
  ],
  [
    "Hook",
    "`useReduceMotion()` (già interno, ora esportato)",
    "Fase 2, lotto 2A",
  ],
  [
    "Hook",
    '`useDensity(prop?)` e tipo `Density` (`"normal" \\| "dense"`)',
    "Fase 3, lotto 3A",
  ],
  [
    "Utility",
    "`toneFromColor(hex, mode)`, `toneFromString(text, mode)`, `toneFrom(source, mode)`, tipo `ToneColors`",
    "Fase 2, lotto 2B",
  ],
  [
    "Token del tema",
    "`success`, `warning`, `info`, `neutral`, ciascuno con `on…`, `…Container`, `on…Container` (16 token, chiaro e scuro), tipo `ThemeStatusTokens`",
    "Fase 2, lotto 2B",
  ],
  [
    "Provider",
    "`ThemeProvider density` (default di `Input`, `Select`, `Button`, `DataGrid`)",
    "Fase 3, lotto 3A",
  ],
  [
    "Tipo",
    "`TableAlign` (`left`, `center`, `right`), `TabItem` (`label`, `icon?`, `key?`, `disabled?`), `SnackbarType` (aggiunti `warning`, `info`)",
    "Fase 3",
  ],
  [
    "Sotto-tipo",
    "`DataGrid` `columns[]` (`ColumnDefinition`): nuove `align`, `renderCell(value, row, index)`",
    "Fase 3, lotto 3A",
  ],
  [
    "Sotto-tipo",
    "`Tabs` `tabs[]`: oggetti con `key` e `disabled` (oltre a `label` e `icon`)",
    "Fase 3, lotto 3B",
  ],
  [
    "Sotto-tipo",
    "`useToast()`: nuovi `warning(message, options?)` e `info(message, options?)`",
    "Fase 3, lotto 3B",
  ],
];

// Components whose props did not change but whose behaviour did: docgen cannot
// see that, so it is listed here and they count as updated.
const BEHAVIOUR = {
  Banner:
    "i tipi `warning` e `info` usano i ruoli di stato del tema (prima il contenitore terziario/secondario: verde nelle palette di marca)",
  Button: '`tone="success"` legge i ruoli `success` del tema',
  ListItem:
    "`children` e `secondary` accettano un nodo; solo il testo viene avvolto in `Text`",
  BottomSheet:
    "il contenuto scorre da solo; l'intestazione ha un ruolo `header`",
  Snackbar: "`success` usa i ruoli del tema; icone per `warning` e `info`",
  DataGrid:
    "segue `ThemeProvider density`; `columns[]` ha `align` e `renderCell`",
  Tabs: "`tabs[]` può essere un oggetto `TabItem` con `key`, `disabled`, `icon` opzionale",
  TableHeaderCell: "il padding a destra c'è solo con le frecce di riordino",
  Autocomplete:
    "`onSearch` toglie il filtro per etichetta; `allowCustomValue={false}` ripristina o svuota all'uscita dal campo",
  Select: "segue `ThemeProvider density`",
  Input:
    "segue `ThemeProvider density`; `decimalSeparator` cambia come si scrive e si vede il numero, non il valore consegnato",
};

const esc = (text = "") =>
  String(text)
    .replace(/\|/g, "\\|")
    .replace(/\s*\n\s*/g, " ")
    .trim();

const same = (a, b) =>
  a.type === b.type &&
  !!a.required === !!b.required &&
  (a.default ?? null) === (b.default ?? null);

/** Compares a component's props with the baseline's. */
const diff = (name) => {
  const now = current.components[name];
  const before = base.components[name];
  if (!before) return { status: "added", fresh: new Set(), changed: new Set() };
  const behaviour = BEHAVIOUR[name];
  const old = new Map(before.props.map((p) => [p.name, p]));
  const fresh = new Set();
  const changed = new Set();
  for (const prop of now.props) {
    const prev = old.get(prop.name);
    if (!prev) fresh.add(prop.name);
    else if (!same(prop, prev)) changed.add(prop.name);
  }
  const removed = [...old.keys()].filter(
    (n) => !now.props.some((p) => p.name === n),
  );
  const updated = fresh.size + changed.size + removed.length > 0 || !!behaviour;
  return {
    status: updated ? "updated" : "kept",
    fresh,
    changed,
    removed,
    behaviour,
  };
};

const names = Object.keys(current.components).sort((a, b) =>
  a.localeCompare(b),
);
const info = Object.fromEntries(names.map((n) => [n, diff(n)]));
const by = (status) => names.filter((n) => info[n].status === status);
const [added, updated, kept] = ["added", "updated", "kept"].map(by);

const table = (name) => {
  const { fresh, changed } = info[name];
  const rows = current.components[name].props.map((p) => {
    const mark = fresh.has(p.name)
      ? "nuova"
      : changed.has(p.name)
        ? "cambiata"
        : "";
    return `| ${p.name}${p.required ? " *" : ""} | \`${esc(p.type)}\` | ${esc(p.default ?? "")} | ${mark} | ${esc(p.description)} |`;
  });
  if (!rows.length) return "_Nessuna prop._\n";
  return [
    "| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |",
    "| ---- | ---- | ------- | ------------------- | ----------- |",
    ...rows,
    "",
  ].join("\n");
};

const section = (name) => {
  const { fresh, changed, removed = [], behaviour } = info[name];
  const c = current.components[name];
  const notes = [];
  if (behaviour) notes.push(`comportamento: ${behaviour}`);
  if (fresh.size)
    notes.push(`prop nuove: ${[...fresh].map((n) => `\`${n}\``).join(", ")}`);
  if (changed.size)
    notes.push(
      `prop cambiate: ${[...changed].map((n) => `\`${n}\``).join(", ")}`,
    );
  if (removed.length)
    notes.push(`prop tolte: ${removed.map((n) => `\`${n}\``).join(", ")}`);
  return [
    `### ${name}`,
    "",
    `\`${c.source}\`${notes.length ? ` — ${notes.join("; ")}` : ""}`,
    "",
    table(name),
  ].join("\n");
};

const total = (list) =>
  list.reduce((n, name) => n + current.components[name].props.length, 0);

const out = [
  "# Inventario dei componenti di `@its/glowup-ui`",
  "",
  "File **generato** da `npm run docgen -w @its/glowup-playground && npm run inventory -w @its/glowup-playground`: non si modifica a mano",
  `(salvo l'elenco \"Altre aggiunte\", che sta nello script \`apps/playground/docgen/inventory.mjs\`). Confronto con il commit \`${BASELINE}\`,`,
  `prima della prima modifica della libreria di questo lavoro (versione ${base.libraryVersion}, ${base.componentCount} componenti).`,
  `Ora: versione ${current.libraryVersion}, ${current.componentCount} componenti.`,
  "",
  "Legenda: `*` accanto al nome = prop obbligatoria. «nuova» = non c'era all'inizio; «cambiata» = tipo, obbligatorietà o default diversi.",
  "",
  "## Riepilogo",
  "",
  "| Stato | Componenti | Prop in totale |",
  "| ----- | ---------- | -------------- |",
  `| Aggiunti | ${added.length} | ${total(added)} |`,
  `| Aggiornati | ${updated.length} | ${total(updated)} |`,
  `| Tenuti (invariati) | ${kept.length} | ${total(kept)} |`,
  "",
  "## Aggiunti",
  "",
  added.length
    ? added.map((n) => `- [${n}](#${n.toLowerCase()})`).join("\n")
    : "_Nessuno._",
  "",
  "## Aggiornati",
  "",
  updated.length
    ? updated
        .map((n) => {
          const { fresh, changed, removed = [], behaviour } = info[n];
          const parts = [
            behaviour && "comportamento",
            fresh.size && `+ ${[...fresh].join(", ")}`,
            changed.size && `~ ${[...changed].join(", ")}`,
            removed.length && `− ${removed.join(", ")}`,
          ].filter(Boolean);
          return `- [${n}](#${n.toLowerCase()}): ${parts.join(" · ")}`;
        })
        .join("\n")
    : "_Nessuno._",
  "",
  "## Tenuti",
  "",
  kept.map((n) => `[${n}](#${n.toLowerCase()})`).join(" · ") || "_Nessuno._",
  "",
  "## Altre aggiunte (non componenti)",
  "",
  "| Genere | Cosa | Quando |",
  "| ------ | ---- | ------ |",
  ...OTHER.map(([kind, what, when]) => `| ${kind} | ${what} | ${when} |`),
  "",
  "---",
  "",
  "# Componenti aggiunti",
  "",
  added.map(section).join("\n") || "_Nessuno._\n",
  "# Componenti aggiornati",
  "",
  updated.map(section).join("\n") || "_Nessuno._\n",
  "# Componenti tenuti",
  "",
  kept.map(section).join("\n") || "_Nessuno._\n",
].join("\n");

writeFileSync(resolve(root, "docs/component-inventory.md"), `${out}\n`);
console.log(
  `inventory: ${added.length} added, ${updated.length} updated, ${kept.length} kept -> docs/component-inventory.md`,
);

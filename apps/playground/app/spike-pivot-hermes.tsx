import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { useTheme } from "@its/glowup-ui";

import PivotEngine from "../spikes/pivot-core/PivotEngine";

/**
 * Spike 0.1 (docs/solaris-native.md, docs/spike-0.1-pivot-core.md): runs the
 * AuraPivot core on whatever engine this app runs on (Hermes on a device) and
 * prints timings and Intl probes, on screen and as `SPIKE01 …` log lines that
 * the native smoke workflow greps. Starts by itself on mount. Throwaway.
 */

const REGIONS = ["Nord", "Centro", "Sud", "Isole"];
const PRODUCTS = Array.from({ length: 40 }, (_, i) => `Prodotto ${i}`);
const AGENTS = Array.from({ length: 60 }, (_, i) => `Agente ${i}`);

const META = {
  region: { type: "string", caption: "Regione" },
  product: { type: "string", caption: "Prodotto" },
  agent: { type: "string", caption: "Agente" },
  callDate: { type: "date", caption: "Data" },
  amount: { type: "number", caption: "Importo" },
  calls: { type: "number", caption: "Chiamate" },
};

const makeRows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    region: REGIONS[i % 4],
    product: PRODUCTS[(i * 7) % 40],
    agent: AGENTS[(i * 13) % 60],
    callDate: new Date(
      Date.UTC(2023 + (i % 3), i % 12, (i % 27) + 1),
    ).toISOString(),
    amount: (i * 137) % 9000,
    calls: (i * 5) % 31,
  }));

const ms = (since: number) => `${(performance.now() - since).toFixed(0)} ms`;

const probe = (label: string, fn: () => unknown): string => {
  try {
    return `${label}: ${String(fn())}`;
  } catch (e) {
    return `${label}: ERRORE ${(e as Error).message}`;
  }
};

const intlProbes = (): string[] => {
  const hermes = (globalThis as any).HermesInternal;
  const d = new Date(Date.UTC(2026, 2, 5, 14, 30));
  return [
    `Hermes: ${hermes ? "si" : "no"}`,
    probe("Hermes props", () =>
      JSON.stringify(hermes?.getRuntimeProperties?.() ?? {}),
    ),
    probe("typeof Intl", () => typeof Intl),
    probe("Number it-IT", () =>
      new Intl.NumberFormat("it-IT").format(1234567.891),
    ),
    probe("Number en-US", () =>
      new Intl.NumberFormat("en-US").format(1234567.891),
    ),
    probe("formatToParts it-IT", () =>
      new Intl.NumberFormat("it-IT")
        .formatToParts(12345.6)
        .map((p) => `${p.type}:${p.value}`)
        .join("|"),
    ),
    probe("EUR it-IT", () =>
      new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
      }).format(1234.5),
    ),
    probe("percent it-IT", () =>
      new Intl.NumberFormat("it-IT", { style: "percent" }).format(0.256),
    ),
    probe("Date it-IT", () => new Intl.DateTimeFormat("it-IT").format(d)),
    probe("mese it-IT", () =>
      new Intl.DateTimeFormat("it-IT", { month: "long" }).format(d),
    ),
    probe("giorno it-IT", () =>
      new Intl.DateTimeFormat("it-IT", { weekday: "long" }).format(d),
    ),
    probe("compare numeric", () =>
      ["P10", "P9", "P1"]
        .sort((a, b) => a.localeCompare(b, "it-IT", { numeric: true }))
        .join(","),
    ),
    probe("compare accenti", () =>
      ["zeta", "àncora", "Ancora", "ape"]
        .sort((a, b) => a.localeCompare(b, "it-IT", { sensitivity: "base" }))
        .join(","),
    ),
    probe("navigator.language", () => (navigator as any).language),
    probe(
      "resolved locale",
      () => new Intl.DateTimeFormat().resolvedOptions().locale,
    ),
    probe(
      "timezone",
      () => new Intl.DateTimeFormat().resolvedOptions().timeZone,
    ),
  ];
};

const bench = (n: number): string[] => {
  const out: string[] = [`== ${n} righe`];
  let s = performance.now();
  const rows = makeRows(n);
  out.push(`genera: ${ms(s)}`);
  const e = new PivotEngine();
  e.setLocale("it-IT");
  s = performance.now();
  e.setData([META, ...rows] as any);
  out.push(`setData: ${ms(s)} (righe ${e.getRows().length})`);
  e.setSlice({
    rows: [{ uniqueName: "region" }, { uniqueName: "product" }],
    columns: [
      { uniqueName: "callDate.Year" },
      { uniqueName: "callDate.Month" },
    ],
    measures: [
      { uniqueName: "amount", aggregation: "sum" },
      { uniqueName: "calls", aggregation: "avg" },
    ],
  } as any);
  for (let i = 1; i <= 3; i++) {
    e.markDirty();
    s = performance.now();
    const m: any = e.processMatrix();
    out.push(
      `matrix #${i}: ${ms(s)} (righe ${m.rowLeaves.length}, col ${m.colLeaves.length}, celle ${m.cells.size})`,
    );
  }
  e.setSlice({
    rows: [{ uniqueName: "agent" }, { uniqueName: "product" }],
    columns: [{ uniqueName: "callDate.Year" }],
    measures: [{ uniqueName: "amount", aggregation: "sum" }],
  } as any);
  s = performance.now();
  const m2: any = e.processMatrix();
  out.push(
    `agenti x prodotti: ${ms(s)} (righe ${m2.rowLeaves.length}, celle ${m2.cells.size})`,
  );
  return out;
};

export default function SpikePivotHermes() {
  const { theme } = useTheme();
  const [lines, setLines] = useState<string[]>(["SPIKE01 in corso..."]);

  useEffect(() => {
    // Let the first frame paint before the synchronous work blocks the thread.
    const t = setTimeout(() => {
      const out: string[] = ["-- Intl / motore --", ...intlProbes()];
      for (const n of [5_000, 50_000]) {
        try {
          out.push(...bench(n));
        } catch (e) {
          out.push(`== ${n} righe: ERRORE ${(e as Error).message}`);
        }
      }
      out.push("DONE");
      out.forEach((l) => console.log(`SPIKE01 ${l}`));
      setLines(out);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 8 }}
    >
      {lines.map((l, i) => (
        <Text
          key={i}
          selectable
          style={{ color: theme.colors.onSurface, fontSize: 9, lineHeight: 12 }}
        >
          {l}
        </Text>
      ))}
    </ScrollView>
  );
}

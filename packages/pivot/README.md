# @its/glowup-pivot

Pivot tables for Expo apps on iOS, Android and the web, built on [`@its/glowup-ui`](https://www.npmjs.com/package/@its/glowup-ui):
rows and column groups that open and close, totals, the header and the label columns kept in view while the numbers scroll, and an
export to Excel. The calculation engine is a copy of AuraPivot's (2.6.0, MIT); the grid and the export are written in this package,
with no third-party dependency.

> Version 0.x: the API may still change between minor versions. Not on npm yet.

## Install

```bash
npx expo install @its/glowup-pivot @its/glowup-ui expo-file-system expo-sharing
```

- `expo-file-system` and `expo-sharing` are **optional**: on iOS and Android the toolbar's "Export to Excel" uses them to write the
  file and hand it to the share sheet. Without them the grid works and the export shows a readable error. The web needs neither.
- Pure JavaScript: it runs in Expo Go, a development build or a release build.
- Requires React Native 0.86 and React 19.

## Use

An engine holds the data and the report; `PivotGrid` shows it.

```tsx
import { useMemo } from "react";
import { PivotEngine, PivotGrid } from "@its/glowup-pivot";

const rows = [
  { site: "Harbour", category: "Premium", active: "Yes", n: 124 },
  { site: "Harbour", category: "Premium", active: "No", n: 204 },
  // …
];

export function Report() {
  const engine = useMemo(() => {
    const engine = new PivotEngine();
    engine.setLocale("it-IT"); // how numbers are written
    // The first item names the fields and their types; the rest is the data.
    engine.setData([
      {
        site: { type: "string", caption: "Site" },
        category: { type: "string", caption: "Category" },
        active: { type: "string", caption: "Active" },
        n: { type: "number", caption: "Count" },
      },
      ...rows,
    ]);
    engine.setSlice({
      rows: [{ uniqueName: "site" }, { uniqueName: "category" }],
      columns: [{ uniqueName: "active" }],
      measures: [{ uniqueName: "n", aggregation: "sum" }],
      expands: { expandAll: true },
      filters: [],
    });
    return engine;
  }, []);

  return <PivotGrid engine={engine} height={528} toolbar fileName="report" />;
}
```

`aggregation` is one of `sum`, `count`, `distinctcount`, `avg`, `min` and `max`. Change the data, the report or the locale later
with the same calls: the grid follows the engine.

| `PivotGrid` prop | Meaning                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `engine`         | The `PivotEngine` to show.                                                                              |
| `height`         | Height of the grid in pixels (with `toolbar`, of the toolbar and the grid together).                    |
| `toolbar`        | A bar above the grid: Export to Excel, Fullscreen and Reset (back to the report as it was first shown). |
| `fileName`       | Name of the exported file; `.xlsx` is added when missing. Defaults to `pivot.xlsx`.                     |
| `localization`   | The grid's texts: English by default, `localizationIt` for Italian.                                     |

The export is an `.xlsx` of what the grid shows (open groups only, the header in colour, totals in bold, labels indented). It is
downloaded on the web and handed to the share sheet on iOS and Android. `gridToXlsx`, `saveXlsx` and `xlsxName` are exported for
an app that wants its own button.

For another renderer, `usePivotGrid(engine)` and `buildGridModel` give the grid's rows, columns and cells without drawing them.

## Where it works

The same grid on the web (phone browsers included) and in the iOS and Android app. Only the area of the numbers scrolls: the header
and the label columns move with it but do not start a drag. Rows are drawn as they come into view.

Measured on invented data with the shape of a real report: 50,000 rows calculate in about 80 ms in Chrome on a laptop; on the
Android emulator (a debug build, slower than a release one) 5,000 rows calculate in about 0.6 s and open or close a group in
about 0.1 s.

Checked in unit tests, in Chrome, and on the iOS simulator and the Android 14 and 15 emulators in CI (the grid's size, a tap on a
group's arrow before and after a scroll, the export reaching Android's share sheet). **Not yet tried on a real phone.**

## Limits, on purpose

- A table to read and export. There is no field panel, no filters in the grid, no calculated fields, conditional formats,
  drill-through or saved configurations yet.
- In full screen on a phone, the grid's height is an estimate: the package does not read the size of the phone's system bars.

## License

MIT. The engine is copied from AuraPivot 2.6.0 (MIT); the changes made to it are listed in the repository.

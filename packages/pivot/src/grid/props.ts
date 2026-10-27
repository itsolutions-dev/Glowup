import type PivotEngine from "../core/PivotEngine";
import type { LocalizationDictionary } from "../localization/types";

export interface PivotGridProps {
  /** The engine to show: set its data and report, and its locale (`setLocale`), before or after. */
  engine: PivotEngine;
  /** Captions of the grid (`grid` section); English when absent. */
  localization?: LocalizationDictionary;
  /** Height of the scrolling area in pixels (with `toolbar`, of the toolbar and the grid together). */
  height?: number;
  /** A toolbar above the grid: Export to Excel (.xlsx on web, iOS and Android), Fullscreen and Reset. */
  toolbar?: boolean;
  /** Name of the exported file; `.xlsx` is added when missing. Defaults to `pivot.xlsx`. */
  fileName?: string;
}

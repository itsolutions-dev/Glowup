import type PivotEngine from "../core/PivotEngine";
import type { LocalizationDictionary } from "../localization/types";

export interface PivotGridProps {
  /** The engine to show: set its data and report, and its locale (`setLocale`), before or after. */
  engine: PivotEngine;
  /** Captions of the grid (`grid` section); English when absent. */
  localization?: LocalizationDictionary;
  /** Height of the scrolling area in pixels. */
  height?: number;
}

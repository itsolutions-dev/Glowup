import type PivotEngine from "../core/PivotEngine";
import type { LocalizationDictionary } from "../localization/types";

export interface PivotGridProps {
  /** The engine to show: set its data and report, and its locale (`setLocale`), before or after. */
  engine: PivotEngine;
  /** Captions of the grid (`grid` section); English when absent. */
  localization?: LocalizationDictionary;
  /** Height of the scrolling area in pixels (with `toolbar`, of the toolbar and the grid together). */
  height?: number;
  /**
   * A toolbar above the grid: Fields (the field panel: move fields between filters, rows, columns and
   * values), Export to Excel (.xlsx on web, iOS and Android), Fullscreen and Reset; and, under it, the
   * report's filters, each one editable.
   */
  toolbar?: boolean;
  /** Name of the exported file; `.xlsx` is added when missing. Defaults to `pivot.xlsx`. */
  fileName?: string;
  /**
   * What Reset does, with `toolbar`. Without it Reset puts back the layout the engine had when the grid
   * first showed rows; an app that applies a saved configuration (`engine.setReport`) resets to that.
   */
  onReset?: () => void;
}

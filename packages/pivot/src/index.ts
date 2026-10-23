export {
  PivotEngine,
  normalizeDataset,
  getFieldCaption,
  expandHierarchies,
  AGGREGATIONS,
  applyAggregation,
  formatMeasureValue,
  buildTree,
  flattenTreeCompact,
  findNodeByKey,
  applyFilters,
  computeMatrix,
  resolveCellStyle,
  formatNumberWithFormat,
} from "./core";
export * from "./core/types";

export { default as usePivotMatrix } from "./hooks/usePivotMatrix";
export { useEngineVersion } from "./hooks/useEngineVersion";
export { PivotProvider, usePivot } from "./context/PivotContext";
export type { PivotContextValue } from "./context/PivotContext";

export { mergeLocalization } from "./localization/merge";
export type { LocalizationDictionary } from "./localization/types";
export { localizationEn, localizationIt } from "./localization/dictionaries";

export { optionsToEngine, engineToOptions } from "./options/optionsAdapter";
export { DEFAULT_OPTIONS } from "./options/optionsSchema";

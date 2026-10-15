// Spike stub (docs/spike-0.1-pivot-core.md, change 1): the real exporter uses the
// DOM and exceljs, which the native bundle must not pull in.
export const exportMatrixToExcel = async (..._args: unknown[]): Promise<void> => {
  throw new Error('Excel export is not available in the native spike');
};

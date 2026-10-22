import type { PdfLabels } from "./types";

/** English, because the library carries no i18n: an app passes its own through `labels`. */
export const defaultPdfLabels: PdfLabels = {
  loading: "Opening the document",
  page: "Page",
  pageOf: "{page} / {pages}",
  goToPage: "Go to page",
  previousPage: "Previous page",
  nextPage: "Next page",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  fitWidth: "Fit to width",
  search: "Search in the document",
  searchPlaceholder: "Search",
  searchResult: "{current} / {total}",
  searching: "Searching… {done} / {pages}",
  noResults: "No results",
  previousResult: "Previous result",
  nextResult: "Next result",
  print: "Print",
  save: "Save",
  openInTab: "Open in a new tab",
  retry: "Try again",
  pageFailed: "This page could not be drawn. Tap to try again.",
  errorTitle: "The document could not be shown",
  actionFailed: "The action could not be completed",
  errors: {
    network: "The file could not be downloaded.",
    format: "This is not a PDF the device can read.",
    password: "This PDF is protected by a password.",
    unsupported: "This device cannot show this PDF.",
    "native-missing":
      "The PDF module is not in this app. Add @its/glowup-pdf to the app's dependencies and make a new development build.",
  },
};

/** The defaults with what an app passes laid over them (the error texts are merged one by one). */
export const withDefaultLabels = (
  overrides?: Partial<PdfLabels>,
): PdfLabels => ({
  ...defaultPdfLabels,
  ...overrides,
  errors: { ...defaultPdfLabels.errors, ...overrides?.errors },
});

export const fillLabel = (
  template: string,
  values: Record<string, string | number>,
) => template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));

// The starters (spec §12): layouts a new one can begin from, each also a test
// case for the export (§15).

import type { LayoutDocument } from "../document";
import dashboard from "./dashboard.json";
import detail from "./detail.json";
import form from "./form.json";

export const STARTERS: {
  id: "detail" | "form" | "dashboard";
  doc: LayoutDocument;
}[] = [
  { id: "detail", doc: detail as LayoutDocument },
  { id: "form", doc: form as LayoutDocument },
  { id: "dashboard", doc: dashboard as LayoutDocument },
];

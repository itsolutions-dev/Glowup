// The catalogue registry, one module per navigator category. Order follows
// CATEGORIES, and every component key lives in exactly one module — the
// playground-catalogue test fails if an entry is added without a demo.
import type { ComponentMetadata } from "../types";
import { foundations } from "./foundations";
import { actions } from "./actions";
import { inputs } from "./inputs";
import { dataDisplay } from "./data-display";
import { feedback } from "./feedback";
import { navigation } from "./navigation";
import { layout } from "./layout";

export const ComponentRegistry: Record<string, ComponentMetadata> = {
  ...foundations,
  ...actions,
  ...inputs,
  ...dataDisplay,
  ...feedback,
  ...navigation,
  ...layout,
};

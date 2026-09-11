import type { Variant } from "./types";
import { GENERATED_VARIANTS } from "./generated";
import { MANUAL_VARIANTS } from "./manual";

export type { Variant } from "./types";

/**
 * The curated gallery of states each component is meant to be used in, keyed by
 * component name.
 *
 * Most entries are generated from `.design-sync/previews/*.tsx` by
 * `npm run variants`: those files are the authored source, and the generator
 * rewrites their DOM primitives to React Native ones so the same demos render
 * on iOS and Android as well as on the web. The handful the generator cannot
 * convert — the ones drawing raw SVG — are written out in `./manual`, which
 * takes precedence for any component it covers.
 */
export const VARIANTS_BY_COMPONENT: Record<string, Variant[]> = {
  ...GENERATED_VARIANTS,
  ...MANUAL_VARIANTS,
};

export const VARIANT_COUNT = Object.values(VARIANTS_BY_COMPONENT).reduce(
  (total, variants) => total + variants.length,
  0,
);

import type { Variant } from "../types";
import { variants as AnimatedFAB } from "./AnimatedFAB";
import { variants as Autocomplete } from "./Autocomplete";
import { variants as Icon } from "./Icon";
import { variants as Toast } from "./Toast";
import { variants as Tooltip } from "./Tooltip";
import {
  cardActionsVariants,
  cardContentVariants,
  cardCoverVariants,
  cardTitleVariants,
} from "./CardParts";

/**
 * Galleries written by hand, for components the preview rewriter cannot reach.
 *
 * Two reasons a component ends up here. Either its authored preview uses a
 * browser API that has no mechanical React Native equivalent — raw SVG in a
 * render prop (Icon), a scrolling div with onScroll (AnimatedFAB), a synthetic
 * pointer event or a querySelector used to force a transient state open for a
 * screenshot (Tooltip, Autocomplete) — or it has no authored preview at all
 * (Toast, which is an imperative API rather than a component, and the four Card
 * parts, which the Card preview only ever shows assembled).
 *
 * An entry here wins over the generated one for the same component, so moving a
 * component from the generator's exclusion list to a real conversion is a
 * matter of deleting its file.
 */
export const MANUAL_VARIANTS: Record<string, Variant[]> = {
  AnimatedFAB,
  Autocomplete,
  Icon,
  Toast,
  Tooltip,
  CardTitle: cardTitleVariants,
  CardContent: cardContentVariants,
  CardCover: cardCoverVariants,
  CardActions: cardActionsVariants,
};

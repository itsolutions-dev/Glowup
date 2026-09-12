import type { Variant } from "../types";
import { variants as AnimatedFAB } from "./AnimatedFAB";
import { variants as Autocomplete } from "./Autocomplete";
import { variants as BottomSheet } from "./BottomSheet";
import { variants as ConfirmDialog } from "./ConfirmDialog";
import { variants as Icon } from "./Icon";
import { variants as Menu } from "./Menu";
import { variants as Modal } from "./Modal";
import { variants as Popover } from "./Popover";
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
 * Three reasons a component ends up here. Either its authored preview uses a
 * browser API that has no mechanical React Native equivalent — raw SVG in a
 * render prop (Icon), a scrolling div with onScroll (AnimatedFAB), a synthetic
 * pointer event or a querySelector used to force a transient state open for a
 * screenshot (Tooltip, Autocomplete) — or it has no authored preview at all
 * (Toast, which is an imperative API rather than a component, and the four Card
 * parts, which the Card preview only ever shows assembled) — or it is an
 * overlay whose preview mounts it already open (Modal, ConfirmDialog,
 * BottomSheet, Popover, Menu). The rewrite handles that last group fine; the
 * result is what a page cannot have, because the overlay portals over the whole
 * document and nothing in a preview closes it. `useOverlayDemo` in ./shared
 * spells the consequence out.
 *
 * An entry here wins over the generated one for the same component, so moving a
 * component from the generator's exclusion list to a real conversion is a
 * matter of deleting its file.
 */
export const MANUAL_VARIANTS: Record<string, Variant[]> = {
  AnimatedFAB,
  Autocomplete,
  BottomSheet,
  ConfirmDialog,
  Icon,
  Menu,
  Modal,
  Popover,
  Toast,
  Tooltip,
  CardTitle: cardTitleVariants,
  CardContent: cardContentVariants,
  CardCover: cardCoverVariants,
  CardActions: cardActionsVariants,
};

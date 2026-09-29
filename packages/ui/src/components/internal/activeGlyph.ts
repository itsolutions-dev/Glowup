import type { MaterialCommunityIconsGlyphs } from "../types";

/** M3 navigation destinations fill their icon when active: "home-outline" → "home". */
export const activeGlyph = (
  icon: MaterialCommunityIconsGlyphs,
  active: boolean,
): MaterialCommunityIconsGlyphs =>
  active && icon.endsWith("-outline")
    ? (icon.replace(/-outline$/, "") as MaterialCommunityIconsGlyphs)
    : icon;

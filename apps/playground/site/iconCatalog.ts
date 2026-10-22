import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

// The glyph map of the icon font: name → code point. It is the whole set a
// component's icon prop can take, so it is read from the font itself rather
// than copied into a list that would go stale with the next font release.
const GLYPHS = MaterialCommunityIcons.glyphMap as Record<string, number>;

/** Every icon name, alphabetically. */
export const ICON_NAMES: readonly string[] = Object.keys(GLYPHS).sort();

export const isIconName = (name: unknown): name is string =>
  typeof name === "string" && Object.hasOwn(GLYPHS, name);

/** The icons that come in pairs: `star` and `star-outline`, named by the filled one. */
export const OUTLINED_PAIRS: readonly string[] = ICON_NAMES.filter(
  (name) => !name.endsWith("-outline") && isIconName(`${name}-outline`),
);

/** The code point as the font documents it: `F02D6`. */
export const codepointOf = (name: string): string | undefined =>
  isIconName(name) ? GLYPHS[name].toString(16).toUpperCase() : undefined;

/**
 * The names that match a search, best first.
 *
 * Words are matched against the name's own words (`account-circle-outline` is
 * `account`, `circle`, `outline`), in the order: the exact name, a name that
 * starts with the text, every word equal to one of the name's words, every word
 * a prefix of one, every word found anywhere in the name. Shorter names come
 * before longer ones within a rank, because "home" is looked for before
 * "home-account". A name that matches no word is left out.
 */
export const searchIcons = (
  query: string,
  names: readonly string[] = ICON_NAMES,
): string[] => {
  const text = query.trim().toLowerCase();
  const words = text.split(/[\s_-]+/).filter(Boolean);
  if (words.length === 0) return [...names];

  const joined = words.join("-");
  const ranked: { name: string; rank: number }[] = [];

  for (const name of names) {
    const parts = name.split("-");
    let rank: number;
    if (name === joined) rank = 0;
    else if (name.startsWith(joined)) rank = 1;
    else if (words.every((word) => parts.includes(word))) rank = 2;
    else if (words.every((word) => parts.some((part) => part.startsWith(word))))
      rank = 3;
    else if (words.every((word) => name.includes(word))) rank = 4;
    else continue;
    ranked.push({ name, rank });
  }

  return ranked
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.name.length - b.name.length ||
        (a.name < b.name ? -1 : 1),
    )
    .map((entry) => entry.name);
};

/**
 * The two looks the font has: a contained (filled) glyph and its `-outline`
 * twin. There is no third in this font: it has no two-tone or rounded cut.
 */
export type IconStyle = "all" | "contained" | "outlined";

export const ICON_STYLES: { value: IconStyle; label: string }[] = [
  { value: "all", label: "All" },
  { value: "contained", label: "Contained" },
  { value: "outlined", label: "Outlined" },
];

/** The look of an icon: outlined if its name says so, contained otherwise. */
export const styleOf = (name: string): Exclude<IconStyle, "all"> =>
  name.endsWith("-outline") ? "outlined" : "contained";

/** The names in one look, or all of them. */
export const filterByStyle = (
  names: readonly string[],
  style: IconStyle,
): readonly string[] =>
  style === "all" ? names : names.filter((name) => styleOf(name) === style);

import type { MaterialCommunityIconsGlyphs } from "@its/glowup-ui";

export interface SiteRoute {
  /** expo-router path; also what `usePathname` is matched against. */
  href: string;
  label: string;
  icon: MaterialCommunityIconsGlyphs;
  /** One line, used on the rail's tooltip and the home page's cards. */
  summary: string;
}

/**
 * The site's top-level sections, in reading order. The navigation rail, the
 * compact drawer and the home page all render from this list, so a new section
 * is one entry rather than three edits that can disagree.
 */
export const SITE_ROUTES: SiteRoute[] = [
  {
    href: "/",
    label: "Overview",
    icon: "home-outline",
    summary: "What Glowup is and what it ships.",
  },
  {
    href: "/getting-started",
    label: "Getting started",
    icon: "rocket-launch-outline",
    summary: "Install the package and mount the providers.",
  },
  {
    href: "/components",
    label: "Components",
    icon: "view-grid-outline",
    summary: "Every component, live, with its generated API reference.",
  },
  {
    href: "/icons",
    label: "Icons",
    icon: "shape-outline",
    summary: "Every icon of the font by name: search, copy, export.",
  },
  {
    href: "/theming",
    label: "Theming",
    icon: "palette-outline",
    summary: "The Material You token set the whole library reads from.",
  },
  {
    href: "/templates",
    label: "Templates",
    icon: "page-layout-body",
    summary: "Whole screens assembled from the kit.",
  },
  {
    href: "/drag-and-drop",
    label: "Drag and drop",
    icon: "drag-variant",
    summary: "Lists, boards and nested zones, by touch and mouse, built in.",
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: "bell-outline",
    summary: "The headless push companion package, running live.",
  },
  {
    href: "/pdf",
    label: "PDF",
    icon: "file-pdf-box",
    summary: "A PDF viewer inside the app, with no third-party library.",
  },
  {
    href: "/charts",
    label: "Charts",
    icon: "chart-bar",
    summary: "Charts drawn with SVG and a copy of d3, with no dependency.",
  },
  {
    href: "/pivot",
    label: "Pivot",
    icon: "table-large",
    summary: "A pivot table with the engine of AuraPivot, read-only for now.",
  },
  {
    href: "/device",
    label: "Device",
    icon: "cellphone-cog",
    summary:
      "Device info, location, camera, network, battery, orientation, haptics, biometrics, secure storage, sensors and the photo library behind swappable adapters.",
  },
];

/** The section a pathname belongs to, for the navigation's selected state. */
export const activeRouteFor = (pathname: string): string => {
  const match = SITE_ROUTES.filter(
    (route) => route.href !== "/" && pathname.startsWith(route.href),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href ?? "/";
};

export const GITHUB_URL = "https://github.com/itsolutions-dev/Glowup";

/**
 * Where the site is served from. Only Open Graph needs it: a share card image
 * has to be an absolute URL, and nothing else on the page does. The deploy
 * workflow sets EXPO_PUBLIC_SITE_URL; the default is the GitHub Pages address.
 */
export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ??
  "https://itsolutions-dev.github.io/Glowup";

export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;
export const NPM_URL = "https://www.npmjs.com/package/@its/glowup-ui";

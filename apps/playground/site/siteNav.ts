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
];

/** The section a pathname belongs to, for the navigation's selected state. */
export const activeRouteFor = (pathname: string): string => {
  const match = SITE_ROUTES.filter(
    (route) => route.href !== "/" && pathname.startsWith(route.href),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href ?? "/";
};

export const GITHUB_URL = "https://github.com/itsolutions-dev/Glowup";
export const NPM_URL = "https://www.npmjs.com/package/@its/glowup-ui";

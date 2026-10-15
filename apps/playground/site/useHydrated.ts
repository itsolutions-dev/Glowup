import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/**
 * False during the prerender and while React hydrates its HTML, true from the
 * render straight after — and from the first render on native, or on a page
 * reached by client navigation, where there is no HTML to agree with.
 *
 * For what the build machine cannot know about the reader: their clock and
 * their locale. Rendering those during hydration bakes in the export's date and
 * Node's locale, React finds different text in the browser and throws #418.
 */
export const useHydrated = () =>
  useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

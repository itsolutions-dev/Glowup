import { Platform } from "react-native";

const STYLE_ID = "glowup-scrollbars";

/**
 * Draws the browser's own scrollbars from the theme: a thin thumb in the
 * `outline` colour on a transparent track (the same thumb `ScrollArea` draws),
 * and `color-scheme` set to the theme's mode so what the browser paints itself
 * (a textarea's scrollbar, a menu's list, native form widgets) is not a light
 * box with arrows inside a dark page.
 *
 * One `<style>` in the document head, rewritten when the theme changes. A
 * `ScrollArea` hides its own native bar with an inline `scrollbar-width: none`,
 * which beats this rule. Web only; anywhere else it does nothing. Returns a
 * cleanup that removes the rule if it is still the one this call wrote.
 */
export const applyWebScrollbars = ({
  thumb,
  dark,
}: {
  thumb: string;
  dark: boolean;
}): (() => void) | undefined => {
  const doc = (globalThis as { document?: any }).document;
  if (Platform.OS !== "web" || !doc?.head) return undefined;

  const bar = "*:not([data-glowup-scroll-area])::-webkit-scrollbar";
  const css =
    `:root{color-scheme:${dark ? "dark" : "light"}}` +
    // Where the WebKit pseudo-elements do not exist (Firefox) the standard
    // properties draw the thin bar. Chromium ignores the pseudo-elements on an
    // element that sets them, so they are kept away from it.
    `@supports not selector(::-webkit-scrollbar){*{scrollbar-width:thin;scrollbar-color:${thumb} transparent}}` +
    // Chromium and Safari: the WebKit pseudo-elements style the bar and take the
    // arrow buttons away. A ScrollArea's own scroller hides its bar with an inline
    // `scrollbar-width: none`, so it is left out of them.
    `${bar}{width:10px;height:10px;background:transparent}` +
    `${bar}-track{background:transparent}` +
    `${bar}-corner{background:transparent}` +
    `${bar}-button{display:none;width:0;height:0}` +
    `${bar}-thumb{background-color:${thumb};border-radius:5px;border:2px solid transparent;background-clip:content-box}`;
  let tag = doc.getElementById(STYLE_ID);
  if (!tag) {
    tag = doc.createElement("style");
    tag.id = STYLE_ID;
    doc.head.appendChild(tag);
  }
  tag.textContent = css;

  return () => {
    const current = doc.getElementById(STYLE_ID);
    if (current && current.textContent === css) current.remove();
  };
};

/**
 * A warning for the app's author, in development only and once per message:
 * a control the library cannot name, a prop that is going away. Production
 * builds (`__DEV__` false) say nothing.
 */
const said = new Set<string>();

export const warnOnce = (message: string) => {
  if (typeof __DEV__ !== "undefined" && !__DEV__) return;
  if (said.has(message)) return;
  said.add(message);
  console.warn(`[@its/glowup-ui] ${message}`);
};

/** For tests: forget what was said. */
export const resetDevWarnings = () => said.clear();

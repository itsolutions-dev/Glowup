// Wraps design-sync lib/dts.mjs — allowlists the all-caps component name FAB,
// which the ALL-CAPS-means-a-constant rule in isComponentName would drop.
// Everything else is the upstream module unchanged.
import { isComponentName as upstreamIsComponentName } from "../../.ds-sync/lib/dts.mjs";

export * from "../../.ds-sync/lib/dts.mjs";

export const isComponentName = (n) => n === "FAB" || upstreamIsComponentName(n);

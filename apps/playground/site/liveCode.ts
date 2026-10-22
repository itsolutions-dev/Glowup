import type { ComponentType } from "react";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as ReactNative from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as GlowupUI from "@its/glowup-ui";
import { transform } from "sucrase";

import { withoutProps } from "./exampleProps";

export type Compiled =
  { ok: true; Component: ComponentType } | { ok: false; error: string };

/**
 * What an example may import. The same three packages every template uses, plus
 * the icon font: an example is meant to be pasted into an app, so its imports
 * are the real ones, resolved here against what the site already bundles.
 */
const MODULES: Record<string, unknown> = {
  react: React,
  "react/jsx-runtime": jsxRuntime,
  "react-native": ReactNative,
  "@its/glowup-ui": GlowupUI,
  "@expo/vector-icons/MaterialCommunityIcons": {
    __esModule: true,
    default: MaterialCommunityIcons,
  },
};

const requireModule = (name: string) => {
  if (!Object.hasOwn(MODULES, name)) {
    throw new Error(
      `Cannot import "${name}" here: an example may import ${Object.keys(
        MODULES,
      )
        .filter((key) => key !== "react/jsx-runtime")
        .map((key) => `"${key}"`)
        .join(", ")}.`,
    );
  }
  return MODULES[name];
};

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/**
 * Turns the text of an example (TSX with imports and a default export) into a
 * component.
 *
 * `sucrase` strips the types and the JSX and rewrites the imports to `require`,
 * and the result is evaluated against the modules above. Nothing here is a
 * sandbox: the code is typed by the reader into their own browser, the same
 * trust as their devtools console. A failure of any step — a syntax error, an
 * import outside the list, no default export — comes back as `{ ok: false }`
 * with the message, so the editor can show it and keep the last good render.
 *
 * `props` is the object the example's `props` literal stands for. It is read on
 * every render, so the caller may change its contents between renders.
 *
 * Runtime errors thrown while the component renders are not caught here: that
 * is what an error boundary around the result is for.
 */
export const compileExample = (
  source: string,
  props: Record<string, unknown> = {},
): Compiled => {
  let code: string;
  try {
    // The `props` literal is not compiled in: the component reads it from
    // `props`, an object held outside that the caller keeps current, so a
    // change of a control redraws the component without compiling it again (and
    // without losing what it has in state).
    code = transform(withoutProps(source), {
      transforms: ["typescript", "jsx", "imports"],
      jsxRuntime: "automatic",
      production: true,
    }).code;
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }

  try {
    const module = { exports: {} as { default?: unknown } };
    new Function("require", "module", "exports", "__props", code)(
      requireModule,
      module,
      module.exports,
      props,
    );
    const Component = module.exports.default;
    if (typeof Component !== "function") {
      return {
        ok: false,
        error: "The example must `export default` a component.",
      };
    }
    return { ok: true, Component: Component as ComponentType };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
};

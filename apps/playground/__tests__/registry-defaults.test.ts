import { ComponentRegistry } from "../catalogue/registry";
import { sameValue } from "../site/exampleProps";
import { COMPONENT_DOCS } from "../site/propsData";

// The Properties panel and the example's `props` literal are one thing, and a
// key left out of the literal means "the component's own default". So a control
// has to be a real prop of the component, and its default the one the component
// has: the docs generator reads both from the source, which is what this checks
// against. (A component the generator cannot document is skipped: Toast.)

const evaluate = (source: string): { value: unknown } | undefined => {
  try {
    return { value: new Function(`return (${source});`)() };
  } catch {
    return undefined;
  }
};

const names = Object.keys(ComponentRegistry).filter(
  (name) => COMPONENT_DOCS[name],
);

describe("the controls of a catalogue entry", () => {
  it.each(names)(
    "%s: are real props, with the component's defaults",
    (name) => {
      const docs = COMPONENT_DOCS[name].props;
      const wrong: string[] = [];

      for (const [key, control] of Object.entries(
        ComponentRegistry[name].props,
      )) {
        const prop = docs.find((candidate) => candidate.name === key);
        if (!prop) {
          wrong.push(`${key}: not a prop of ${name}`);
          continue;
        }
        if (control.type === "node") {
          wrong.push(`${key}: a node control (the example supplies nodes)`);
          continue;
        }

        const own =
          prop.default === undefined ? undefined : evaluate(prop.default);
        if (own) {
          if (!sameValue(own.value, control.default)) {
            wrong.push(
              `${key}: default ${JSON.stringify(control.default)}, the component's is ${prop.default}`,
            );
          }
        } else if (prop.default === undefined) {
          // The component has none: nothing, empty or off.
          const unset =
            control.default === undefined ||
            (["text", "icon"].includes(control.type) &&
              control.default === "") ||
            (control.type === "boolean" && control.default === false) ||
            control.type === "select";
          if (!unset) {
            wrong.push(
              `${key}: default ${JSON.stringify(control.default)}, but the component has none (use ${control.type === "boolean" ? "false" : '""'})`,
            );
          }
        }
      }

      expect(wrong).toEqual([]);
    },
  );
});

import fixture from "./__fixtures__/editor-document.json";
import { checkDocument } from "../editor/check";
import {
  findNode,
  walk,
  type LayoutDocument,
  type NodeId,
} from "../editor/document";
import {
  camelName,
  fieldNameProblem,
  formOf,
  normalizeFields,
  setFieldName,
  setFieldRules,
} from "../editor/forms";

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

// The fixture plus a Form holding two Inputs labelled "Email" and a Checkbox
// with no label, and an Input on the page, outside the Form.
const withForm: LayoutDocument = (() => {
  const doc = structuredClone(fixture) as LayoutDocument;
  doc.items.push(
    {
      id: "n7",
      type: "Form",
      props: {},
      layout: { x: 0, y: 8, w: 6, h: 4 },
      columns: 6,
      children: [
        {
          id: "n8",
          type: "Input",
          props: { label: "Email" },
          layout: { x: 0, y: 0, w: 3, h: 2 },
        },
        {
          id: "n9",
          type: "Input",
          props: { label: "Email" },
          layout: { x: 3, y: 0, w: 3, h: 2 },
        },
        {
          id: "n10",
          type: "Checkbox",
          props: {},
          layout: { x: 0, y: 2, w: 3, h: 1 },
        },
      ],
    },
    {
      id: "n11",
      type: "Input",
      props: {},
      layout: { x: 6, y: 8, w: 4, h: 2 },
    },
  );
  return deepFreeze(doc);
})();

const fieldNames = (doc: LayoutDocument, form: NodeId) =>
  walk(doc)
    .filter((node) => node.field && formOf(doc, node.id) === form)
    .map((node) => node.field?.name);

describe("form bindings", () => {
  it("makes names from labels", () => {
    expect(camelName("Email address")).toBe("emailAddress");
    expect(camelName("Città di residenza")).toBe("cittaDiResidenza");
    expect(camelName("2nd phone")).toBe("field2ndPhone");
    expect(camelName("!!")).toBe("");
  });

  it("finds the Form a node sits in", () => {
    expect(formOf(withForm, "n8")).toBe("n7");
    expect(formOf(withForm, "n11")).toBeNull();
  });

  it("names the second field with the same label email2", () => {
    const out = normalizeFields(withForm);
    expect(fieldNames(out, "n7")).toEqual(["email", "email2", "checkbox1"]);
    expect(findNode(out, "n11")?.field).toBeUndefined();
    expect(findNode(out, "n4")?.field).toBeUndefined(); // in a tab, not a Form
    expect(checkDocument(out)).toEqual([]);
  });

  it("keeps a free name and the same document when nothing changes", () => {
    const once = normalizeFields(withForm);
    expect(normalizeFields(once)).toBe(once);
  });

  it("validates a new name", () => {
    const doc = normalizeFields(withForm);
    expect(fieldNameProblem(doc, "n8", "email2")).toBe(
      "Already used in this form",
    );
    expect(fieldNameProblem(doc, "n8", "my email")).toBe("Not a valid name");
    expect(fieldNameProblem(doc, "n11", "x")).toBe("Not a field in a form");
    expect(fieldNameProblem(doc, "n8", "work")).toBeNull();
    expect(setFieldName(doc, "n8", "email2")).toBe(doc);
    expect(findNode(setFieldName(doc, "n8", "work"), "n8")?.field?.name).toBe(
      "work",
    );
  });

  it("sets rules on a bound field only", () => {
    const doc = normalizeFields(withForm);
    const rules = [{ required: true }, { type: "email" as const }];
    expect(
      findNode(setFieldRules(doc, "n8", rules), "n8")?.field?.rules,
    ).toEqual(rules);
    expect(setFieldRules(doc, "n11", rules)).toBe(doc);
  });
});

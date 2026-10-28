import { CATEGORY_OF, FLAT_ORDER } from "../catalogue/categories";
import { COMPONENT_DOCS } from "../site/propsData";
import {
  LEFT_OUT,
  MANIFEST,
  acceptsChild,
  isContainer,
} from "../editor/manifest";

// Palette types that are not catalogue pages of their own: the editor's
// composite, and the two Stack variants the Stack page documents.
const NOT_CATALOGUED = ["TabbedPanel", "VStack", "HStack"];

const propsOf = (type: string) =>
  COMPONENT_DOCS[type === "TabbedPanel" ? "Tabs" : type].props.map(
    (prop) => prop.name,
  );

describe("the component manifest", () => {
  it("covers every catalogued component, once", () => {
    for (const name of FLAT_ORDER) {
      expect([name in MANIFEST, name in LEFT_OUT]).toContain(true);
      expect(name in MANIFEST && name in LEFT_OUT).toBe(false);
    }
    for (const type of Object.keys(MANIFEST)) {
      if (!NOT_CATALOGUED.includes(type)) expect(FLAT_ORDER).toContain(type);
    }
  });

  it("names only real props", () => {
    for (const entry of Object.values(MANIFEST)) {
      const props = propsOf(entry.type);
      for (const key of Object.keys(entry.defaultProps)) {
        expect([entry.type, props.includes(key) && key]).toEqual([
          entry.type,
          key,
        ]);
      }
      if (entry.field) {
        expect(props).toContain(entry.field.valueProp);
        expect(props).toContain(entry.field.trigger);
      }
      if (entry.controlled) {
        expect(props).toContain(entry.controlled.value);
        expect(props).toContain(entry.controlled.onChange);
      }
    }
  });

  it("binds the spec's field components", () => {
    for (const type of [
      "Input",
      "InputArea",
      "PasswordField",
      "NumberField",
      "Select",
      "Autocomplete",
      "Checkbox",
      "CheckboxGroup",
      "RadioGroup",
      "Switch",
      "Slider",
      "Rating",
      "PinInput",
      "DatePicker",
      "TimePicker",
      "DateTimePicker",
    ]) {
      expect([type, MANIFEST[type]?.field !== undefined]).toEqual([type, true]);
    }
  });

  it("keeps containers, sizes and forms consistent", () => {
    for (const entry of Object.values(MANIFEST)) {
      expect(entry.defaultSize.w).toBeLessThanOrEqual(12);
      expect(entry.defaultSize.w).toBeGreaterThanOrEqual(entry.minSize.w);
      expect(entry.defaultSize.h).toBeGreaterThanOrEqual(entry.minSize.h);
      if (!isContainer(entry.type)) expect(entry.accepts).toBeUndefined();
      for (const child of entry.accepts ?? []) {
        expect(MANIFEST[child]).toBeDefined();
      }
    }
    expect(MANIFEST.Form).toMatchObject({ kind: "grid", form: true });
    expect(acceptsChild("Form", "Form")).toBe(false);
    expect(acceptsChild("ListSection", "ListItem")).toBe(true);
    expect(acceptsChild("ListSection", "Button")).toBe(false);
    expect(acceptsChild("Input", "Button")).toBe(false);
    expect(acceptsChild("Paper", "Input")).toBe(true);
  });

  it("groups the palette like the catalogue", () => {
    for (const entry of Object.values(MANIFEST)) {
      if (NOT_CATALOGUED.includes(entry.type) || entry.type === "Form") {
        continue;
      }
      expect([entry.type, entry.palette.group]).toEqual([
        entry.type,
        CATEGORY_OF[entry.type],
      ]);
    }
  });
});

import fixture from "./__fixtures__/editor-document.json";
import { componentName, exportCode } from "../editor/codegen";
import type { LayoutDocument, LayoutNode } from "../editor/document";

const page = (name: string, items: LayoutNode[]): LayoutDocument => ({
  format: "glowup-layout",
  version: 1,
  name,
  grid: { columns: 12, rowHeight: 48, gap: 16 },
  items,
});

const contactCard = page("Contact card", [
  {
    id: "n1",
    type: "Paper",
    props: {},
    layout: { x: 0, y: 0, w: 6, h: 3 },
    columns: 6,
    children: [
      {
        id: "n2",
        type: "Typography",
        props: { variant: "titleMedium" },
        text: "Contact",
        layout: { x: 0, y: 0, w: 6, h: 1 },
      },
      {
        id: "n3",
        type: "Input",
        props: { label: "Email" },
        layout: { x: 0, y: 1, w: 4, h: 2 },
      },
    ],
  },
  {
    id: "n4",
    type: "VStack",
    props: {},
    layout: { x: 6, y: 0, w: 3, h: 2 },
    children: [
      { id: "n5", type: "Button", props: { variant: "filled" }, text: "Save" },
    ],
  },
]);

const GOLDEN = `// Contact card: exported from the Glowup layout editor.
// Left to wire:
// - Button "Save": onClick
import React, { useState } from "react";
import {
  Button,
  GridLayout,
  Input,
  Paper,
  Typography,
  VStack,
} from "@its/glowup-ui";

const LAYOUT = [
  { id: "n1", x: 0, y: 0, w: 6, h: 3 },
  { id: "n4", x: 6, y: 0, w: 3, h: 2 },
];

const N1_LAYOUT = [
  { id: "n2", x: 0, y: 0, w: 6, h: 1 },
  { id: "n3", x: 0, y: 1, w: 4, h: 2 },
];

export default function ContactCard() {
  const [email, setEmail] = useState("");
  return (
    <GridLayout layout={LAYOUT}>
      <Paper key="n1" style={{ flexGrow: 1 }}>
        <GridLayout layout={N1_LAYOUT} columns={6}>
          <Typography key="n2" variant="titleMedium">Contact</Typography>
          <Input key="n3" label="Email" value={email} onChange={setEmail} />
        </GridLayout>
      </Paper>
      <VStack key="n4" style={{ flexGrow: 1 }}>
        <Button key="n5">Save</Button>
      </VStack>
    </GridLayout>
  );
}
`;

/** Four Inputs whose labels clash, are reserved, or are missing. */
const clashingLabels = page(
  "Clashes",
  ["Email", "Email", "class", undefined].map((label, i) => ({
    id: `n${i + 1}`,
    type: "Input",
    props: label === undefined ? {} : { label },
    layout: { x: 0, y: i * 2, w: 4, h: 2 },
  })),
);

describe("exportCode", () => {
  it("exports a layout as a component file", () => {
    expect(exportCode(contactCard)).toBe(GOLDEN);
  });

  it("names the component after the layout", () => {
    expect(componentName("Pagina di dettaglio")).toBe("PaginaDiDettaglio");
    expect(componentName("2024 report")).toBe("Field2024Report");
    expect(componentName("")).toBe("Layout");
    expect(componentName("für Kunden")).toBe("FurKunden");
  });

  it("gives every controlled component its own state", () => {
    const code = exportCode(clashingLabels);
    for (const pair of [
      "const [email, setEmail]",
      "const [email2, setEmail2]",
      "const [class2, setClass2]",
      "const [input, setInput]",
    ]) {
      expect(code).toContain(pair);
    }
  });

  it("binds a Form's fields instead", () => {
    const code = exportCode(
      page("Signup", [
        {
          id: "f1",
          type: "Form",
          props: {},
          layout: { x: 0, y: 0, w: 6, h: 4 },
          columns: 6,
          children: [
            {
              id: "n2",
              type: "Input",
              props: { label: "Email" },
              layout: { x: 0, y: 0, w: 4, h: 2 },
              field: {
                name: "email",
                rules: [{ required: true }, { type: "email" }],
                auto: true,
              },
            },
            {
              id: "n3",
              type: "Checkbox",
              props: { label: "I agree" },
              layout: { x: 0, y: 2, w: 3, h: 1 },
              field: { name: "iAgree", rules: [], auto: true },
            },
          ],
        },
      ]),
    );
    expect(code).toContain('initialValues={{ email: "", iAgree: false }}');
    // Past 80 columns, the tag puts one attribute per line.
    expect(code).toContain('\n            name="email"\n');
    expect(code).toContain(
      '\n            rules={[{ required: true }, { type: "email" }]}\n',
    );
    expect(code).toContain('{(field) => <Input {...field} label="Email" />}');
    expect(code).toContain('valuePropName="checked"');
    expect(code).toContain('trigger="onValueChange"');
    expect(code).toContain("// - Form f1: onSubmit");
    expect(code).not.toContain("useState");
  });

  it("turns a TabbedPanel into Tabs and TabContent", () => {
    const code = exportCode(fixture as LayoutDocument);
    expect(code).toContain("const [tab, setTab] = useState(0);");
    expect(code).toContain('import { View } from "react-native";');
    expect(code).toContain(
      '<Tabs tabs={["A", "B"]} activeTab={tab} onChange={setTab} />',
    );
    expect(code).toContain("<TabContent activeTab={tab}>");
    expect(code).toContain("const N3_TAB1_LAYOUT = [");
    expect(code).toContain("<View />");
  });
});

describe("exportCode, after the review", () => {
  it("keeps the layout name on its comment line", () => {
    const code = exportCode(
      page("Report\n(globalThis as any).PWNED = 1;//\u2028x", []),
    );
    const [first, second] = code.split("\n");
    expect(first).toMatch(/^\/\/ Report .*: exported from/);
    expect(second).toBe('import React from "react";');
  });

  it("never names state after a strict-mode reserved word", () => {
    const code = exportCode(
      page(
        "Reserved",
        ["Public", "Eval", "Arguments", "Package"].map((label, i) => ({
          id: `n${i + 1}`,
          type: "Switch",
          props: { label },
          layout: { x: 0, y: i, w: 3, h: 1 },
        })),
      ),
    );
    for (const name of ["public2", "eval2", "arguments2", "package2"]) {
      expect(code).toContain(`const [${name}, `);
    }
  });

  it("does not name the component after something it imports", () => {
    const form: LayoutNode = {
      id: "n1",
      type: "Form",
      props: {},
      layout: { x: 0, y: 0, w: 6, h: 4 },
      columns: 6,
      children: [],
    };
    expect(exportCode(page("Form", [form]))).toContain(
      "export default function FormLayout()",
    );
    expect(exportCode(page("Grid layout", []))).toContain(
      "export default function GridLayoutLayout()",
    );
  });
});

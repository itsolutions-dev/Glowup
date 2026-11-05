import React, { useEffect } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";

import fixture from "./__fixtures__/editor-document.json";
import { checkDocument } from "../editor/check";
import {
  findNode,
  type LayoutDocument,
  type LayoutNode,
} from "../editor/document";
import { PropertiesPanel } from "../editor/canvas/PropertiesPanel";
import { useEditor, type Editor } from "../editor/canvas/useEditor";

let editor: Editor;
const Harness = ({ initial }: { initial: LayoutDocument }) => {
  const current = useEditor(initial);
  useEffect(() => {
    editor = current;
  });
  return <PropertiesPanel editor={current} />;
};

const draw = (initial: LayoutDocument = fixture as LayoutDocument) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1280, height: 900 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <Harness initial={initial} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );

const select = (id: string) => act(async () => editor.select(id));
const type = (label: string, text: string) =>
  fireEvent.changeText(screen.getByLabelText(label), text);
const node = (id: string) => findNode(editor.doc, id) as LayoutNode;

/** The switch in the row whose text is `label`. */
type Host = ReturnType<typeof screen.getByText>;
const switchFor = (label: string) => {
  let row: Host | null = screen.getByText(label).parent;
  while (row && within(row).queryAllByRole("switch").length === 0) {
    row = row.parent;
  }
  return within(row as Host).getByRole("switch");
};

const withItems = (...items: LayoutNode[]) => {
  const doc = structuredClone(fixture) as LayoutDocument;
  doc.items.push(...items);
  return doc;
};

describe("the Properties panel", () => {
  it("asks for a selection", async () => {
    await draw();
    expect(screen.getByText("Select a component to edit it.")).toBeTruthy();
  });

  it("edits a text, one undo step per field", async () => {
    await draw();
    await select("n2");
    await type("Text", "H");
    await type("Text", "Ho");
    expect(node("n2").text).toBe("Ho");
    await act(async () => editor.undo());
    expect(node("n2").text).toBe("Hi");
  });

  it("edits a prop with the component page's controls, and stores no default", async () => {
    await draw();
    await select("n6");
    expect(screen.getByText("Button · n6")).toBeTruthy();
    await fireEvent.press(switchFor("Disabled"));
    expect(node("n6").props.disabled).toBe(true);
    await fireEvent.press(switchFor("Disabled"));
    expect(node("n6").props).not.toHaveProperty("disabled");
    expect(screen.queryByText("Label")).toBeNull();
  });

  it("moves and resizes by numbers, as dragging would", async () => {
    await draw();
    await select("n1");
    await type("w", "8");
    expect(node("n1").layout?.w).toBe(8);
    await type("w", "abc");
    expect(node("n1").layout?.w).toBe(8);
    await type("x", "-3");
    expect(node("n1").layout?.x).toBe(0);
    await type("w", "99");
    expect(node("n1").layout?.w).toBe(12);
    await type("h", "1.5");
    expect(Number.isInteger(node("n1").layout?.h)).toBe(true);
    expect(checkDocument(editor.doc)).toEqual([]);
  });

  it("edits data as JSON, refusing what is not", async () => {
    const options = [{ label: "One", value: "1" }];
    await draw(
      withItems({
        id: "n7",
        type: "Select",
        props: { label: "Choice", options },
        layout: { x: 4, y: 4, w: 4, h: 2 },
      }),
    );
    await select("n7");
    await type("options", "[{");
    expect(screen.getByText("Not valid JSON")).toBeTruthy();
    expect(node("n7").props.options).toEqual(options);
    expect(editor.canUndo).toBe(false);
    await type("options", '"nope"');
    expect(screen.getByText("Expected an array")).toBeTruthy();
    expect(node("n7").props.options).toEqual(options);
    await type("options", '[{"label":"A","value":"a"}]');
    expect(node("n7").props.options).toEqual([{ label: "A", value: "a" }]);
  });

  it("names a field, refusing a taken name", async () => {
    const field = (id: string, label: string, name: string, y: number) => ({
      id,
      type: "Input",
      props: { label },
      layout: { x: 0, y, w: 4, h: 2 },
      field: { name, rules: [], auto: true },
    });
    await draw(
      withItems({
        id: "n7",
        type: "Form",
        props: {},
        layout: { x: 6, y: 4, w: 6, h: 4 },
        columns: 6,
        children: [
          field("n8", "Email", "email", 0),
          field("n9", "Phone", "phone", 2),
        ],
      }),
    );
    await select("n9");
    await type("Field name", "email");
    expect(node("n9").field?.name).toBe("phone");
    expect(screen.getByText("Already used in this form")).toBeTruthy();
    await type("Field name", "mobile");
    expect(node("n9").field?.name).toBe("mobile");
    await fireEvent.press(switchFor("Required"));
    expect(node("n9").field?.rules).toContainEqual({ required: true });
  });

  it("edits tabs, asking before removing one with content", async () => {
    await draw();
    await select("n3");
    await fireEvent.press(screen.getByText("Add tab"));
    expect(node("n3").tabs).toHaveLength(3);
    await type("Tab 3", "C");
    expect(node("n3").tabs?.[2].label).toBe("C");
    await fireEvent.press(screen.getAllByLabelText("Remove tab")[0]);
    expect(screen.getByText("Remove the tab and its content?")).toBeTruthy();
    await fireEvent.press(screen.getByText("Cancel"));
    expect(node("n3").tabs).toHaveLength(3);
    await fireEvent.press(screen.getAllByLabelText("Remove tab")[0]);
    await fireEvent.press(screen.getByText("Remove"));
    expect(node("n3").tabs).toHaveLength(2);
    expect(findNode(editor.doc, "n4")).toBeNull();
    await fireEvent.press(screen.getAllByLabelText("Remove tab")[0]);
    expect(node("n3").tabs).toHaveLength(1);
    expect(
      screen.getByLabelText("Remove tab").props.accessibilityState?.disabled,
    ).toBe(true);
  });

  it("lists what is set in code", async () => {
    await draw();
    await select("n6");
    expect(screen.getByText(/onClick/)).toBeTruthy();
  });
});

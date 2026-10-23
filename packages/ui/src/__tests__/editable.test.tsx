import React, { useState } from "react";
import { Platform, StyleSheet, Text } from "react-native";
import { act, cleanup, fireEvent, render } from "@testing-library/react-native";
import { Editable, ThemeProvider } from "..";
import type { EditableProps } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

/** An `Editable` whose value the app holds, as in a form. */
const Held = (props: Partial<EditableProps> & { start?: string }) => {
  const { start = "Ada", ...rest } = props;
  const [value, setValue] = useState(start);
  return <Editable label="Name" value={value} onChange={setValue} {...rest} />;
};

const open = async (view: Awaited<ReturnType<typeof draw>>, name: string) =>
  fireEvent.press(view.getByRole("button", { name }));

describe("Editable display", () => {
  it("reads as text and opens as a labelled button", async () => {
    const view = await draw(<Editable label="Name" defaultValue="Ada" />);
    expect(view.getByText("Ada")).toBeTruthy();
    const button = view.getByRole("button", { name: "Name: Ada" });
    expect(button.props.accessibilityHint).toBe("Edit");
    expect(view.queryByLabelText("Name")).toBeNull();
  });

  it("shows the placeholder for an empty value, and renderDisplay over the text", async () => {
    const empty = await draw(<Editable placeholder="Add a name" />);
    expect(empty.getByText("Add a name")).toBeTruthy();
    const custom = await draw(
      <Editable
        defaultValue="12.5"
        renderDisplay={(v) => <Text>{`EUR ${v}`}</Text>}
      />,
    );
    expect(custom.getByText("EUR 12.5")).toBeTruthy();
  });

  it("does not open when disabled, and has no button when read only", async () => {
    const disabled = await draw(
      <Editable label="Name" defaultValue="Ada" disabled />,
    );
    const button = disabled.getByRole("button", { name: "Name: Ada" });
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(button);
    expect(disabled.queryByLabelText("Name")).toBeNull();

    const readOnly = await draw(
      <Editable label="Name" defaultValue="Bob" readOnly />,
    );
    expect(readOnly.getByText("Bob")).toBeTruthy();
    expect(readOnly.queryByRole("button")).toBeNull();
  });

  it("draws the type of textVariant, else of size", async () => {
    const big = await draw(<Editable defaultValue="x" size="large" />);
    const small = await draw(<Editable defaultValue="x" size="small" />);
    const bigSize = big.getByText("x").props.style;
    const smallSize = small.getByText("x").props.style;
    const flat = (s: unknown) => Object.assign({}, ...[s].flat(Infinity));
    expect(flat(bigSize).fontSize).toBeGreaterThan(flat(smallSize).fontSize);
  });
});

describe("Editable text editing", () => {
  it("opens a focused field on press, reports each edit and keeps it on Enter", async () => {
    const onChange = jest.fn();
    const onSubmit = jest.fn();
    const onEditingChange = jest.fn();
    const view = await draw(
      <Editable
        label="Name"
        defaultValue="Ada"
        onChange={onChange}
        onSubmit={onSubmit}
        onEditingChange={onEditingChange}
      />,
    );
    await open(view, "Name: Ada");
    expect(onEditingChange).toHaveBeenLastCalledWith(true);
    const field = view.getByLabelText("Name");
    expect(field.props.autoFocus).toBe(true);
    expect(field.props.value).toBe("Ada");

    await fireEvent.changeText(field, "Ada L");
    expect(onChange).toHaveBeenLastCalledWith("Ada L");
    await fireEvent(view.getByLabelText("Name"), "submitEditing");
    expect(onSubmit).toHaveBeenCalledWith("Ada L");
    expect(onEditingChange).toHaveBeenLastCalledWith(false);
    expect(view.queryByLabelText("Name")).toBeNull();
    expect(view.getByText("Ada L")).toBeTruthy();
  });

  it("counts Enter and the blur it causes as one submit", async () => {
    const onSubmit = jest.fn();
    const view = await draw(
      <Editable label="Name" defaultValue="Ada" onSubmit={onSubmit} />,
    );
    await open(view, "Name: Ada");
    const field = view.getByLabelText("Name");
    await fireEvent(field, "submitEditing");
    await fireEvent(field, "blur");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("submits on blur in 'blur' and 'both', not in 'enter'", async () => {
    for (const [submitMode, submits] of [
      ["blur", true],
      ["both", true],
      ["enter", false],
    ] as const) {
      const onSubmit = jest.fn();
      const view = await draw(
        <Editable
          label="Name"
          defaultValue="Ada"
          submitMode={submitMode}
          onSubmit={onSubmit}
        />,
      );
      await open(view, "Name: Ada");
      await fireEvent(view.getByLabelText("Name"), "blur");
      expect(onSubmit).toHaveBeenCalledTimes(submits ? 1 : 0);
      await view.unmount();
    }
  });

  it("does not submit on Enter in 'blur' mode", async () => {
    const onSubmit = jest.fn();
    const view = await draw(
      <Editable
        label="Name"
        defaultValue="Ada"
        submitMode="blur"
        onSubmit={onSubmit}
      />,
    );
    await open(view, "Name: Ada");
    expect(view.getByLabelText("Name").props.onSubmitEditing).toBeUndefined();
  });

  it("cancels on Escape: the value goes back, and onChange hears it", async () => {
    const onChange = jest.fn();
    const onCancel = jest.fn();
    const onSubmit = jest.fn();
    const view = await draw(
      <Editable
        label="Name"
        defaultValue="Ada"
        onChange={onChange}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />,
    );
    await open(view, "Name: Ada");
    await fireEvent.changeText(view.getByLabelText("Name"), "Zed");
    await fireEvent(view.getByLabelText("Name"), "keyPress", {
      nativeEvent: { key: "Escape" },
    });
    expect(onCancel).toHaveBeenCalledWith("Ada");
    expect(onChange).toHaveBeenLastCalledWith("Ada");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(view.getByText("Ada")).toBeTruthy();
  });

  it("works controlled: the app's value is shown, and a cancel restores it", async () => {
    const view = await draw(<Held />);
    await open(view, "Name: Ada");
    await fireEvent.changeText(view.getByLabelText("Name"), "Zed");
    expect(view.getByLabelText("Name").props.value).toBe("Zed");
    await fireEvent(view.getByLabelText("Name"), "keyPress", {
      nativeEvent: { key: "Escape" },
    });
    expect(view.getByText("Ada")).toBeTruthy();
  });

  it("selects the text on open when asked", async () => {
    const view = await draw(
      <Editable label="Name" defaultValue="Ada" selectAllOnFocus />,
    );
    await open(view, "Name: Ada");
    expect(view.getByLabelText("Name").props.selectTextOnFocus).toBe(true);
  });
});

describe("Editable controls", () => {
  it("shows save and cancel buttons in 'none' mode, and blur does nothing", async () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    const view = await draw(
      <Editable
        label="Name"
        defaultValue="Ada"
        submitMode="none"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );
    await open(view, "Name: Ada");
    await fireEvent(view.getByLabelText("Name"), "blur");
    expect(onSubmit).not.toHaveBeenCalled();
    await fireEvent.changeText(view.getByLabelText("Name"), "Bea");
    await fireEvent.press(view.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledWith("Bea");
    expect(view.getByText("Bea")).toBeTruthy();

    await open(view, "Name: Bea");
    await fireEvent.changeText(view.getByLabelText("Name"), "Cid");
    await fireEvent.press(view.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledWith("Bea");
    expect(view.getByText("Bea")).toBeTruthy();
  });

  it("can force the buttons in another mode, which stops blur from confirming", async () => {
    const onSubmit = jest.fn();
    const view = await draw(
      <Editable
        label="Name"
        defaultValue="Ada"
        showControls
        onSubmit={onSubmit}
      />,
    );
    await open(view, "Name: Ada");
    expect(view.getByRole("button", { name: "Save" })).toBeTruthy();
    await fireEvent(view.getByLabelText("Name"), "blur");
    expect(onSubmit).not.toHaveBeenCalled();
    // Enter still confirms in 'both'.
    await fireEvent(view.getByLabelText("Name"), "submitEditing");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("Editable validation", () => {
  const validate = (v: string) => (v.trim() ? undefined : "Required");

  it("shows the error once the value is touched and blocks the submit", async () => {
    const onSubmit = jest.fn();
    const view = await draw(
      <Editable
        label="Name"
        defaultValue="Ada"
        validate={validate}
        onSubmit={onSubmit}
      />,
    );
    await open(view, "Name: Ada");
    expect(view.queryByText("Required")).toBeNull();
    await fireEvent.changeText(view.getByLabelText("Name"), " ");
    expect(view.getByText("Required")).toBeTruthy();
    await fireEvent(view.getByLabelText("Name"), "submitEditing");
    await fireEvent(view.getByLabelText("Name"), "blur");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(view.getByLabelText("Name")).toBeTruthy();

    await fireEvent.changeText(view.getByLabelText("Name"), "Bea");
    expect(view.queryByText("Required")).toBeNull();
    await fireEvent(view.getByLabelText("Name"), "submitEditing");
    expect(onSubmit).toHaveBeenCalledWith("Bea");
  });

  it("shows the error on a submit of an untouched invalid value", async () => {
    const view = await draw(
      <Editable label="Name" defaultValue="" validate={validate} />,
    );
    await open(view, "Name: Edit");
    expect(view.queryByText("Required")).toBeNull();
    await fireEvent(view.getByLabelText("Name"), "submitEditing");
    expect(view.getByText("Required")).toBeTruthy();
  });
});

describe("Editable editing state", () => {
  it("starts open with startWithEditView", async () => {
    const view = await draw(
      <Editable label="Name" defaultValue="Ada" startWithEditView />,
    );
    expect(view.getByLabelText("Name")).toBeTruthy();
  });

  it("is driven by editing/onEditingChange when controlled", async () => {
    const onEditingChange = jest.fn();
    const view = await draw(
      <Editable
        label="Name"
        defaultValue="Ada"
        editing={false}
        onEditingChange={onEditingChange}
      />,
    );
    await open(view, "Name: Ada");
    expect(onEditingChange).toHaveBeenCalledWith(true);
    // The app did not open it, so it stays text.
    expect(view.queryByLabelText("Name")).toBeNull();
    await view.rerender(
      <ThemeProvider>
        <Editable label="Name" defaultValue="Ada" editing />
      </ThemeProvider>,
    );
    expect(view.getByLabelText("Name")).toBeTruthy();
  });
});

describe("Editable types", () => {
  it("number keeps digits and one decimal mark, honouring precision", async () => {
    const view = await draw(
      <Editable
        label="Price"
        type="number"
        defaultValue="1"
        precision={2}
        startWithEditView
      />,
    );
    await fireEvent.changeText(view.getByLabelText("Price"), "12a.567");
    expect(view.getByLabelText("Price").props.value).toBe("12.56");
  });

  it("textarea is multi-line, and only Ctrl or Cmd + Enter confirms", async () => {
    const onSubmit = jest.fn();
    const view = await draw(
      <Editable
        label="Bio"
        type="textarea"
        defaultValue="Hi"
        onSubmit={onSubmit}
        startWithEditView
      />,
    );
    const field = view.getByLabelText("Bio");
    expect(field.props.multiline).toBe(true);
    expect(field.props.onSubmitEditing).toBeUndefined();
    await fireEvent(field, "keyPress", { nativeEvent: { key: "Enter" } });
    expect(onSubmit).not.toHaveBeenCalled();
    await fireEvent(field, "keyPress", {
      nativeEvent: { key: "Enter", ctrlKey: true },
    });
    expect(onSubmit).toHaveBeenCalledWith("Hi");
  });

  it("select shows the label of the option and confirms on the pick", async () => {
    const options = [
      { id: "a", label: "Admin", value: "admin" },
      { id: "v", label: "Viewer", value: "viewer" },
    ];
    const onSubmit = jest.fn();
    const view = await draw(
      <Editable
        label="Role"
        type="select"
        options={options}
        defaultValue="viewer"
        onSubmit={onSubmit}
      />,
    );
    expect(view.getByText("Viewer")).toBeTruthy();
    await open(view, "Role: Viewer");
    // The list is already open.
    await fireEvent.press(view.getByRole("none", { name: "Admin" }));
    expect(onSubmit).toHaveBeenCalledWith("admin");
    expect(view.getByText("Admin")).toBeTruthy();
  });
});

describe("Editable on the web", () => {
  const asWeb = () => {
    jest.replaceProperty(Platform, "OS", "web");
    const listeners = new Map<string, (event: unknown) => void>();
    (globalThis as Record<string, unknown>).document = {
      addEventListener: (type: string, fn: (event: unknown) => void) =>
        listeners.set(type, fn),
      removeEventListener: (type: string) => listeners.delete(type),
    };
    return listeners;
  };
  afterEach(async () => {
    await cleanup();
    jest.restoreAllMocks();
    delete (globalThis as Record<string, unknown>).document;
  });

  it("keeps the pencil out of sight until hover or focus, but always draws it on touch", async () => {
    const native = await draw(<Editable label="Name" defaultValue="Ada" />);
    expect(JSON.stringify(native.toJSON())).toContain('"opacity":1');
    await native.unmount();

    asWeb();
    const web = await draw(<Editable label="Name" defaultValue="Ada" />);
    expect(JSON.stringify(web.toJSON())).toContain('"opacity":0');
  });

  it("cancels an open dropdown with Escape", async () => {
    const listeners = asWeb();
    const onCancel = jest.fn();
    const view = await draw(
      <Editable
        type="select"
        label="Role"
        options={[{ id: "a", label: "Admin", value: "admin" }]}
        defaultValue="admin"
        onCancel={onCancel}
        startWithEditView
      />,
    );
    await act(async () =>
      listeners.get("keydown")?.({ key: "Escape", preventDefault() {} }),
    );
    expect(onCancel).toHaveBeenCalledWith("admin");
    expect(view.getByRole("button", { name: "Role: Admin" })).toBeTruthy();
  });
});

describe("Editable width", () => {
  const measure = (node: any, width: number) =>
    fireEvent(node, "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width, height: 40 } },
    });
  const widthOf = (node: any) => StyleSheet.flatten(node.props.style);

  it.each(["text", "textarea", "number"] as const)(
    "%s: the open field is as wide as the text it replaced",
    async (type) => {
      const view = await draw(
        <Editable label="Name" type={type} defaultValue="12" testID="e" />,
      );
      await measure(view.getByTestId("e"), 240);
      await fireEvent.press(view.getByTestId("e"));
      expect(widthOf(view.getByTestId("e-field")).width).toBe(240);
      expect(widthOf(view.getByTestId("e-field")).flex).toBeUndefined();
    },
  );

  it("select: the open dropdown field is as wide as the label it replaced", async () => {
    const view = await draw(
      <Editable
        type="select"
        label="Role"
        options={[{ id: "a", label: "Admin", value: "admin" }]}
        defaultValue="admin"
        testID="e"
      />,
    );
    await measure(view.getByTestId("e"), 180);
    await fireEvent.press(view.getByTestId("e"));
    expect(widthOf(view.getByTestId("e-field")).width).toBe(180);
  });

  it("keeps room for a short or empty value, and when never measured", async () => {
    const view = await draw(<Editable label="Name" testID="e" />);
    await measure(view.getByTestId("e"), 40);
    await fireEvent.press(view.getByTestId("e"));
    expect(widthOf(view.getByTestId("e-field")).width).toBe(120);

    const open = await draw(<Editable startWithEditView testID="o" />);
    expect(widthOf(open.getByTestId("o-field")).width).toBe(120);
  });

  it("fullWidth fills the container in display and in edit", async () => {
    const view = await draw(
      <Editable label="Name" defaultValue="Ada" fullWidth testID="e" />,
    );
    expect(widthOf(view.getByTestId("e")).width).toBe("100%");
    await measure(view.getByTestId("e"), 240);
    await fireEvent.press(view.getByTestId("e"));
    const field = widthOf(view.getByTestId("e-field"));
    expect(field.width).toBeUndefined();
    expect(field.flex).toBe(1);
    expect(widthOf(view.getByTestId("e-field").parent!).width).toBe("100%");
  });

  // The open field insets its text by 16 px plus a 1 px border on each side;
  // the display has to inset by the same, or the text that fits on display is
  // clipped once the field takes its width.
  const FIELD_INSET = 17;

  it("leaves the open field a text area at least as wide as the display text", async () => {
    const TEXT = 107; // "Ada Lovelace" in bodyLarge
    const ICON = 18; // medium
    const view = await draw(
      <Editable label="Name" defaultValue="Ada Lovelace" testID="e" />,
    );
    const display = widthOf(view.getByTestId("e"));
    expect(display.paddingHorizontal).toBe(FIELD_INSET);

    const outer = TEXT + 2 * display.paddingHorizontal + display.gap + ICON;
    await measure(view.getByTestId("e"), outer);
    await fireEvent.press(view.getByTestId("e"));
    const field = widthOf(view.getByTestId("e-field")).width;
    expect(field).toBe(outer);
    expect(field - 2 * FIELD_INSET).toBeGreaterThanOrEqual(TEXT);
  });

  it("opened without a display, measures the text unseen and takes its width", async () => {
    const view = await draw(
      <Editable defaultValue="Ada Lovelace" startWithEditView testID="e" />,
    );
    const field = view.getByTestId("e-field");
    expect(widthOf(field).width).toBe(120);
    const measurer = field.parent!.children[0] as any;
    await measure(measurer, 149);
    expect(widthOf(view.getByTestId("e-field")).width).toBe(149);
    // Once known, it is not drawn again.
    expect(view.getByTestId("e-field").parent!.children).toHaveLength(1);
  });

  describe("started in edit view", () => {
    const roles = [{ id: "a", label: "Admin", value: "admin" }];

    it.each(["text", "number", "textarea"] as const)(
      "%s: the editor is there on the first render, with no layout event at all",
      async (type) => {
        const view = await draw(
          <Editable
            type={type}
            defaultValue="12"
            startWithEditView
            testID="e"
          />,
        );
        expect(view.getByTestId("e-input")).toBeTruthy();
        expect(widthOf(view.getByTestId("e-field")).width).toBe(120);
      },
    );

    it("select: the dropdown field is there on the first render", async () => {
      const view = await draw(
        <Editable
          type="select"
          label="Role"
          options={roles}
          defaultValue="admin"
          startWithEditView
          testID="e"
        />,
      );
      expect(view.getByTestId("e-field")).toBeTruthy();
      expect(view.queryByRole("button", { name: "Role: Admin" })).toBeNull();
      expect(widthOf(view.getByTestId("e-field")).width).toBe(120);
    });

    it("the measuring text is out of sight and of assistive tech, and refines the width", async () => {
      const view = await draw(
        <Editable defaultValue="Ada Lovelace" startWithEditView testID="e" />,
      );
      const measurer = view.getByTestId("e-field").parent!.children[0] as any;
      const style = widthOf(measurer);
      expect(style).toMatchObject({ position: "absolute", opacity: 0 });
      expect(measurer.props.pointerEvents).toBe("none");
      expect(measurer.props.accessibilityElementsHidden).toBe(true);

      await measure(measurer, 200);
      expect(widthOf(view.getByTestId("e-field")).width).toBe(200);
      expect(view.getByTestId("e-input")).toBeTruthy();
    });

    it("asks for focus once: a later render does not take it back", async () => {
      const view = await draw(
        <Editable defaultValue="Ada" startWithEditView testID="e" />,
      );
      expect(view.getByTestId("e-input").props.autoFocus).toBe(true);
      await fireEvent(view.getByTestId("e-input"), "focus");
      await measure(view.getByTestId("e-field").parent!.children[0], 149);
      expect(view.getByTestId("e-input").props.autoFocus).toBe(false);
    });
  });
});

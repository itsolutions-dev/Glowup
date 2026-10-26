import React, { createRef } from "react";
import { Platform, StyleSheet, TextInput } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { Form, FormField, Input, InputArea, ThemeProvider, useForm } from "..";
import { FIELD_MIN_WIDTH } from "../components/internal/fieldWidth";

type Props = Partial<React.ComponentProps<typeof InputArea>>;

const area = (props: Props = {}) => (
  <ThemeProvider>
    <InputArea label="Campo" value="" onChange={() => {}} {...props} />
  </ThemeProvider>
);

const heightOf = (field: { props: { style?: unknown } }) =>
  StyleSheet.flatten(field.props.style as any).height;

/** The text reports a content height, as a phone's text field does on every edit. */
const grow = (field: any, height: number) =>
  fireEvent(field, "contentSizeChange", {
    nativeEvent: { contentSize: { width: 200, height } },
  });

// Normal density: 24 px lines and 12 px of padding above and below the text.
const LINE = 24;
const PAD = 24;

describe("InputArea shares Input's props", () => {
  it("is a multi-line field with the label, the placeholder and a value", async () => {
    const view = await render(
      area({ value: "uno\ndue", placeholder: "Scrivi" }),
    );
    const field = view.getByLabelText("Campo");
    expect(field.props.multiline).toBe(true);
    expect(field.props.value).toBe("uno\ndue");
    expect(view.getByPlaceholderText("Scrivi")).toBeTruthy();
  });

  it("reports the text on every edit, and keeps the length limit", async () => {
    const onChange = jest.fn();
    const view = await render(area({ onChange, maxLength: 20 }));
    const field = view.getByLabelText("Campo");
    await fireEvent.changeText(field, "ciao\nmondo");
    expect(onChange).toHaveBeenCalledWith("ciao\nmondo");
    expect(field.props.maxLength).toBe(20);
  });

  it("marks a required label, and shows the helper or the error instead of it", async () => {
    const view = await render(
      area({ required: true, helperText: "Aiuto", error: undefined }),
    );
    expect(view.getByText("Campo *")).toBeTruthy();
    expect(view.getByText("Aiuto")).toBeTruthy();
    await view.rerender(area({ helperText: "Aiuto", error: "Troppo corto" }));
    expect(view.getByText("Troppo corto")).toBeTruthy();
    expect(view.queryByText("Aiuto")).toBeNull();
  });

  it("is not editable when disabled or read only", async () => {
    const off = await render(area({ disabled: true }));
    expect(off.getByLabelText("Campo").props.editable).toBe(false);
    const ro = await render(area({ readonly: true }));
    expect(ro.getAllByLabelText("Campo")[0].props.readOnly).toBe(true);
  });

  it("reports focus and blur", async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const view = await render(area({ onFocus, onBlur }));
    await fireEvent(view.getByLabelText("Campo"), "focus");
    expect(onFocus).toHaveBeenCalledTimes(1);
    await fireEvent(view.getByLabelText("Campo"), "blur");
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("puts the label inside the box when labelPlacement says so", async () => {
    const outside = await render(area());
    expect(JSON.stringify(outside.getByText("Campo").props.style)).toContain(
      "marginBottom",
    );
    const inside = await render(area({ labelPlacement: "inside" }));
    expect(
      JSON.stringify(inside.getAllByText("Campo")[0].props.style),
    ).not.toContain("marginBottom");
  });

  it("draws the same box as Input, in both variants", async () => {
    const box = async (ui: React.ReactElement) =>
      JSON.stringify(
        (await render(<ThemeProvider>{ui}</ThemeProvider>)).toJSON(),
      );
    const noop = () => {};
    for (const variant of ["outlined", "filled"] as const) {
      const a = JSON.parse(
        await box(
          <InputArea label="L" value="" onChange={noop} variant={variant} />,
        ),
      );
      const i = JSON.parse(
        await box(
          <Input label="L" value="" onChange={noop} variant={variant} />,
        ),
      );
      // wrapper > [label, box]: the box styles must match.
      expect(a.children[1].props.style).toEqual(i.children[1].props.style);
    }
    const filled = await box(
      <InputArea label="L" value="" onChange={noop} variant="filled" />,
    );
    expect(filled).toContain('"borderColor":"transparent"');
  });

  it("fills its container by default and shrinks, with a minimum, when fullWidth is false", async () => {
    const json = async (props: Props) =>
      JSON.stringify((await render(area(props))).toJSON());
    expect(await json({})).toContain('"width":"100%"');
    const narrow = await json({ fullWidth: false });
    expect(narrow).not.toContain('"width":"100%"');
    expect(narrow).toContain(`"minWidth":${FIELD_MIN_WIDTH}`);
  });

  it("keeps the line under the field when reserveHelperText says so", async () => {
    const without = JSON.stringify((await render(area())).toJSON());
    const reserved = JSON.stringify(
      (await render(area({ reserveHelperText: true }))).toJSON(),
    );
    expect(reserved.length).toBeGreaterThan(without.length);
  });

  it("is smaller when dense: 14 px text on 20 px lines", async () => {
    const view = await render(area({ density: "dense" }));
    expect(heightOf(view.getByLabelText("Campo"))).toBe(4 * 20 + 2 * 8);
  });

  it("draws icons, and hands over inputProps and a ref to the TextInput", async () => {
    const ref = createRef<TextInput>();
    const onPress = jest.fn();
    const view = await render(
      area({
        leadingIcon: "text-box-outline",
        trailingIcon: "close",
        onTrailingIconPress: onPress,
        inputRef: ref,
        inputProps: { testID: "area", autoFocus: true },
      }),
    );
    expect(view.getByTestId("area").props.autoFocus).toBe(true);
    expect(ref.current).toBeTruthy();
  });
});

describe("InputArea in a form", () => {
  const Host = ({ children }: { children: React.ReactNode }) => {
    const form = useForm({ note: "ciao" });
    return <Form form={form}>{children}</Form>;
  };

  it("gets its value, label, required and error from a FormField, and an edit reaches the form", async () => {
    const view = await render(
      <ThemeProvider>
        <Host>
          <FormField
            name="note"
            label="Nota"
            helperText="Una riga"
            rules={[{ required: true }]}
          >
            {(field) => <InputArea {...field} />}
          </FormField>
        </Host>
      </ThemeProvider>,
    );
    expect(view.getByText("Nota *")).toBeTruthy();
    expect(view.getByText("Una riga")).toBeTruthy();
    const field = view.getByLabelText("Nota");
    expect(field.props.value).toBe("ciao");
    await fireEvent.changeText(field, "");
    expect(view.getByText("This field is required")).toBeTruthy();
    await fireEvent.changeText(field, "uno\ndue");
    expect(view.getByLabelText("Nota").props.value).toBe("uno\ndue");
  });
});

describe("InputArea rows", () => {
  const draw = async (props: Props) =>
    (await render(area(props))).getByLabelText("Campo");

  it("is 4 lines, fixed, with none of rows, minRows and maxRows", async () => {
    const field = await draw({});
    expect(heightOf(field)).toBe(4 * LINE + PAD);
    expect(field.props.numberOfLines).toBe(4);
    // Fixed: the content does not move it.
    expect(field.props.onContentSizeChange).toBeUndefined();
  });

  it("is exactly `rows` lines tall, however much text there is", async () => {
    const field = await draw({ rows: 7, value: "x\n".repeat(30) });
    expect(heightOf(field)).toBe(7 * LINE + PAD);
    expect(field.props.numberOfLines).toBe(7);
    expect(field.props.onContentSizeChange).toBeUndefined();
  });

  it("lets rows win over minRows and maxRows", async () => {
    const field = await draw({ rows: 2, minRows: 5, maxRows: 8 });
    expect(heightOf(field)).toBe(2 * LINE + PAD);
    expect(field.props.onContentSizeChange).toBeUndefined();
  });

  it("starts at minRows and grows with its content up to maxRows, then stops", async () => {
    const field = await draw({ minRows: 2, maxRows: 5 });
    expect(heightOf(field)).toBe(2 * LINE + PAD);
    expect(field.props.numberOfLines).toBeUndefined();
    // Below the minimum.
    await grow(field, LINE);
    expect(heightOf(field)).toBe(2 * LINE + PAD);
    // Between the two: the content, plus the padding.
    await grow(field, 3.5 * LINE);
    expect(heightOf(field)).toBe(3.5 * LINE + PAD);
    // At the maximum, and past it: capped.
    await grow(field, 5 * LINE);
    expect(heightOf(field)).toBe(5 * LINE + PAD);
    await grow(field, 40 * LINE);
    expect(heightOf(field)).toBe(5 * LINE + PAD);
  });

  it("shrinks again when the content does", async () => {
    const field = await draw({ minRows: 2, maxRows: 5 });
    await grow(field, 4 * LINE);
    expect(heightOf(field)).toBe(4 * LINE + PAD);
    await grow(field, 2.5 * LINE);
    expect(heightOf(field)).toBe(2.5 * LINE + PAD);
    await grow(field, LINE);
    expect(heightOf(field)).toBe(2 * LINE + PAD);
  });

  it("grows without limit with minRows alone", async () => {
    const field = await draw({ minRows: 3 });
    expect(heightOf(field)).toBe(3 * LINE + PAD);
    await grow(field, 2 * LINE);
    expect(heightOf(field)).toBe(3 * LINE + PAD);
    await grow(field, 200 * LINE);
    expect(heightOf(field)).toBe(200 * LINE + PAD);
  });

  it("starts at one line and grows up to maxRows with maxRows alone", async () => {
    const field = await draw({ maxRows: 5 });
    expect(heightOf(field)).toBe(LINE + PAD);
    await grow(field, 3 * LINE);
    expect(heightOf(field)).toBe(3 * LINE + PAD);
    await grow(field, 99 * LINE);
    expect(heightOf(field)).toBe(5 * LINE + PAD);
  });

  it("raises maxRows to minRows when it is smaller", async () => {
    const field = await draw({ minRows: 6, maxRows: 3 });
    expect(heightOf(field)).toBe(6 * LINE + PAD);
    await grow(field, 30 * LINE);
    expect(heightOf(field)).toBe(6 * LINE + PAD);
  });

  it("sizes the lines from the label placement's padding too", async () => {
    const field = await draw({ labelPlacement: "inside", rows: 3 });
    expect(heightOf(field)).toBe(3 * LINE + 4);
  });

  it("never changes its width: only the height is set", async () => {
    const field = await draw({ minRows: 2, maxRows: 5 });
    await grow(field, 4 * LINE);
    const style = StyleSheet.flatten(field.props.style as any);
    expect(style.width).toBeUndefined();
    expect(style.minWidth).toBeUndefined();
  });

  describe("on the web", () => {
    const original = Platform.OS;
    beforeAll(() => {
      Platform.OS = "web";
    });
    afterAll(() => {
      Platform.OS = original;
    });

    it("measures the DOM, not onContentSizeChange: nothing to listen to, and a first height of minRows", async () => {
      const field = await draw({ minRows: 2, maxRows: 5 });
      expect(field.props.onContentSizeChange).toBeUndefined();
      expect(typeof field.props.onLayout).toBe("function");
      expect(heightOf(field)).toBe(2 * LINE + PAD);
    });

    it("collapses the textarea to read its content, restores it, and grows and shrinks to fit", async () => {
      // jest has no DOM: give the TextInput instance the two things the
      // measurement reads, a style and a scrollHeight (its box is never under
      // the content, so only the collapsed reading is the content's).
      const css = { height: "", overflow: "" };
      let content = 3 * LINE + PAD;
      const seen: string[] = [];
      const proto = TextInput.prototype as any;
      Object.defineProperty(proto, "style", {
        configurable: true,
        get: () => css,
      });
      Object.defineProperty(proto, "scrollHeight", {
        configurable: true,
        get: () => {
          seen.push(css.height);
          return css.height === "0px" ? content : 9999;
        },
      });
      try {
        const props = { minRows: 2, maxRows: 5 };
        const view = await render(area({ ...props, value: "a" }));
        const field = view.getByLabelText("Campo");
        expect(seen).toContain("0px");
        expect(css).toEqual({ height: "", overflow: "" });
        expect(heightOf(field)).toBe(3 * LINE + PAD);
        content = 40 * LINE + PAD;
        await view.rerender(area({ ...props, value: "a\nb" }));
        expect(heightOf(view.getByLabelText("Campo"))).toBe(5 * LINE + PAD);
        content = LINE + PAD;
        await view.rerender(area({ ...props, value: "a" }));
        expect(heightOf(view.getByLabelText("Campo"))).toBe(2 * LINE + PAD);
      } finally {
        delete proto.style;
        delete proto.scrollHeight;
      }
    });

    it("keeps a fixed field fixed", async () => {
      const field = await draw({ rows: 3 });
      expect(heightOf(field)).toBe(3 * LINE + PAD);
      expect(field.props.onLayout).toBeUndefined();
    });
  });
});

describe("Input is single-line only", () => {
  it("no longer takes multiline or rows", async () => {
    const view = await render(
      <ThemeProvider>
        {/* @ts-expect-error multiline moved to InputArea */}
        <Input label="Campo" value="" onChange={() => {}} multiline />
        {/* @ts-expect-error rows moved to InputArea */}
        <Input label="Altro" value="" onChange={() => {}} rows={3} />
      </ThemeProvider>,
    );
    expect(view.getByLabelText("Campo").props.multiline).toBeFalsy();
    expect(view.getByLabelText("Altro").props.numberOfLines).toBeUndefined();
  });
});

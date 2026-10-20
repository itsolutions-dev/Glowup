import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Input, ThemeProvider } from "..";
import { FIELD_MIN_WIDTH } from "../components/internal/fieldWidth";

type Props = Partial<React.ComponentProps<typeof Input>>;

/** Types `text` into a labelled field and returns what it reported and what it shows. */
const type = async (text: string, props: Props = {}) => {
  const seen: string[] = [];
  const ui = (value: string) => (
    <ThemeProvider>
      <Input
        label="Campo"
        value={value}
        onChange={(v) => seen.push(v)}
        {...props}
      />
    </ThemeProvider>
  );
  const view = await render(ui(""));
  await fireEvent.changeText(view.getByLabelText("Campo"), text);
  const reported = seen[seen.length - 1];
  await view.rerender(ui(reported));
  return { reported, shown: view.getByLabelText("Campo").props.value };
};

describe("Input number with a decimal comma", () => {
  const comma: Props = { type: "number", decimalSeparator: "," };

  it("reads 12,50 as 12.50 and shows 12,50", async () => {
    expect(await type("12,50", comma)).toEqual({
      reported: "12.50",
      shown: "12,50",
    });
  });

  it("keeps a trailing comma while typing, and drops the thousands dot", async () => {
    expect(await type("12,", comma)).toEqual({ reported: "12.", shown: "12," });
    expect((await type("1.250,50", comma)).reported).toBe("1250.50");
  });

  it("keeps the sign and honours precision", async () => {
    expect((await type("-3,5", comma)).reported).toBe("-3.5");
    expect((await type("1,2345", { ...comma, precision: 2 })).reported).toBe(
      "1.23",
    );
  });

  it("is unchanged by default: a dot is the mark and a comma is dropped", async () => {
    expect((await type("12.50", { type: "number" })).reported).toBe("12.50");
    expect((await type("12,50", { type: "number" })).reported).toBe("1250");
  });
});

describe("Input allUpperCase", () => {
  it("reports what is typed in capitals and asks the keyboard for them", async () => {
    expect((await type("ab12 cd", { allUpperCase: true })).reported).toBe(
      "AB12 CD",
    );
    expect((await type("ab12", {})).reported).toBe("ab12");
    const view = await render(
      <ThemeProvider>
        <Input label="Campo" value="" onChange={() => {}} allUpperCase />
      </ThemeProvider>,
    );
    expect(view.getByLabelText("Campo").props.autoCapitalize).toBe(
      "characters",
    );
  });
});

describe("Input reserveHelperText", () => {
  const rows = async (props: Props) => {
    const { toJSON } = await render(
      <ThemeProvider>
        <Input label="Campo" value="" onChange={() => {}} {...props} />
      </ThemeProvider>,
    );
    // The helper is the only place the field draws the alert glyph or its text.
    return JSON.stringify(toJSON());
  };

  it("keeps the line under the field when there is nothing to say", async () => {
    const without = await rows({});
    const reserved = await rows({ reserveHelperText: true });
    expect(reserved.length).toBeGreaterThan(without.length);
  });

  it("changes nothing when there is a helper or an error already", async () => {
    expect(await rows({ helperText: "Aiuto", reserveHelperText: true })).toBe(
      await rows({ helperText: "Aiuto" }),
    );
  });
});

describe("Input labelPlacement", () => {
  /** The label sits above the box (outside) when it carries a bottom margin. */
  const placement = async (props: Props) => {
    const { getByText } = await render(
      <ThemeProvider>
        <Input label="Campo" value="" onChange={() => {}} {...props} />
      </ThemeProvider>,
    );
    return JSON.stringify(getByText("Campo").props.style).includes(
      "marginBottom",
    )
      ? "outside"
      : "inside";
  };

  it("keeps the label above the box whatever the variant", async () => {
    expect(await placement({})).toBe("outside");
    expect(await placement({ variant: "outlined" })).toBe("outside");
    expect(await placement({ variant: "filled" })).toBe("outside");
  });

  it("puts the label inside the box when labelPlacement says so, in either variant", async () => {
    expect(await placement({ labelPlacement: "inside" })).toBe("inside");
    expect(
      await placement({ variant: "filled", labelPlacement: "inside" }),
    ).toBe("inside");
  });
});

describe("Input variant", () => {
  const transparent = async (props: Props) => {
    const { toJSON, getByLabelText } = await render(
      <ThemeProvider>
        <Input label="Campo" value="" onChange={() => {}} {...props} />
      </ThemeProvider>,
    );
    const count = () =>
      (JSON.stringify(toJSON()).match(/"borderColor":"transparent"/g) ?? [])
        .length;
    return { count, input: getByLabelText("Campo") };
  };

  it("draws a filled box with no border until it is focused or in error, like PinInput's cells", async () => {
    const outlined = (await transparent({})).count();
    const filled = await transparent({ variant: "filled" });
    expect(filled.count()).toBe(outlined + 1);
    await fireEvent(filled.input, "focus");
    expect(filled.count()).toBe(outlined);
    expect(
      (await transparent({ variant: "filled", error: "No" })).count(),
    ).toBe(outlined);
  });

  it("changes the box, not the label", async () => {
    const label = async (variant: "outlined" | "filled") => {
      const { getByText } = await render(
        <ThemeProvider>
          <Input label="Campo" value="" onChange={() => {}} variant={variant} />
        </ThemeProvider>,
      );
      return JSON.stringify(getByText("Campo").props.style);
    };
    expect(await label("filled")).toBe(await label("outlined"));
  });
});

describe("Input fullWidth", () => {
  const json = async (props: Props) =>
    JSON.stringify(
      (
        await render(
          <ThemeProvider>
            <Input label="Campo" value="" onChange={() => {}} {...props} />
          </ThemeProvider>,
        )
      ).toJSON(),
    );

  it("fills its container by default", async () => {
    const full = await json({});
    expect(full).toContain('"width":"100%"');
    expect(full).not.toContain('"alignSelf":"flex-start"');
  });

  it("shrinks to its content, with a minimum width, when false", async () => {
    const narrow = await json({ fullWidth: false });
    expect(narrow).not.toContain('"width":"100%"');
    expect(narrow).toContain('"alignSelf":"flex-start"');
    expect(narrow).toContain(`"minWidth":${FIELD_MIN_WIDTH}`);
  });
});

describe("Input rows", () => {
  const lines = async (props: Props) =>
    (
      await render(
        <ThemeProvider>
          <Input label="Campo" value="" onChange={() => {}} {...props} />
        </ThemeProvider>,
      )
    ).getByLabelText("Campo").props.numberOfLines;

  it("sizes a multiline field: 4 lines by default, or as many as asked", async () => {
    expect(await lines({ multiline: true })).toBe(4);
    expect(await lines({ multiline: true, rows: 7 })).toBe(7);
  });

  it("is ignored on a single-line field", async () => {
    expect(await lines({ rows: 7 })).toBeUndefined();
  });
});

describe("Input focus callbacks", () => {
  it("reports focus and blur", async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByLabelText } = await render(
      <ThemeProvider>
        <Input
          label="Campo"
          value=""
          onChange={() => {}}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </ThemeProvider>,
    );
    await fireEvent(getByLabelText("Campo"), "focus");
    expect(onFocus).toHaveBeenCalledTimes(1);
    await fireEvent(getByLabelText("Campo"), "blur");
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});

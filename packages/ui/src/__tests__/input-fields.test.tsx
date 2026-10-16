import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Input, ThemeProvider } from "..";

type Props = Partial<React.ComponentProps<typeof Input>>;

/** Types `text` into a labelled field and returns what it reported and what it shows. */
const type = async (text: string, props: Props = {}) => {
  const seen: string[] = [];
  const ui = (value: string) => (
    <ThemeProvider>
      <Input
        label="Campo"
        value={value}
        onChangeText={(v) => seen.push(v)}
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
        <Input label="Campo" value="" onChangeText={() => {}} allUpperCase />
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
        <Input label="Campo" value="" onChangeText={() => {}} {...props} />
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

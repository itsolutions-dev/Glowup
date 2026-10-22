import {
  hasProps,
  readProps,
  sameValue,
  serializeProps,
  withoutProps,
  writeProps,
} from "../site/exampleProps";

const CODE = `import { Button } from "@its/glowup-ui";

const props = {
  variant: "tonal",
  fullWidth: true,
  count: 3,
  anchorPosition: { vertical: "top", horizontal: "left" },
  selected: ["a", "b"],
};

export default function Example() {
  return <Button {...props} />;
}
`;

describe("the props literal of an example", () => {
  it("is read into values", () => {
    expect(readProps(CODE)).toEqual({
      variant: "tonal",
      fullWidth: true,
      count: 3,
      anchorPosition: { vertical: "top", horizontal: "left" },
      selected: ["a", "b"],
    });
    expect(hasProps(CODE)).toBe(true);
  });

  it("reads expressions a reader writes by hand", () => {
    const code = CODE.replace("count: 3", "count: 2 * 4");
    expect(readProps(code)?.count).toBe(8);
  });

  it("is null when there is none, or when it cannot be read", () => {
    expect(readProps("export default () => null;")).toBeNull();
    expect(hasProps("export default () => null;")).toBe(false);
    expect(readProps(CODE.replace('"tonal"', "tonal oops"))).toBeNull();
    // Not an object: the literal is expected to be one.
    expect(readProps("const props = {\n  ...nothing,\n};\n")).toBeNull();
  });

  it("is written back in the same shape it was read from", () => {
    // What the panel does to the code: read, write, with nothing else changed.
    const values = readProps(CODE) as Record<string, unknown>;
    expect(writeProps(CODE, values)).toBe(CODE);
  });

  it("changes only the literal when a value changes", () => {
    const next = writeProps(CODE, {
      ...(readProps(CODE) as object),
      variant: "outlined",
      disabled: true,
    });
    expect(next).toContain('variant: "outlined",');
    expect(next).toContain("disabled: true,");
    expect(next.slice(next.indexOf("export default"))).toBe(
      CODE.slice(CODE.indexOf("export default")),
    );
    expect(readProps(next)).toMatchObject({
      variant: "outlined",
      disabled: true,
    });
  });

  it("keeps the code around it out of the compiled text's way", () => {
    expect(withoutProps(CODE)).toContain("const props = __props;");
    expect(withoutProps(CODE)).not.toContain("variant:");
    // A change of a value does not change what is compiled.
    expect(withoutProps(writeProps(CODE, { variant: "text" }))).toBe(
      withoutProps(CODE),
    );
  });

  it("breaks a value that does not fit a line, and only that one", () => {
    const long = Array.from({ length: 12 }, (_, i) => `option-number-${i}`);
    const text = serializeProps({ short: [1, 2], long });
    expect(text).toContain("short: [1, 2],");
    expect(text).toContain("long: [\n");
    expect(text.split("\n").every((line) => line.length <= 82)).toBe(true);
    expect(readProps(text)).toEqual({ short: [1, 2], long });
  });

  it("quotes a key that is not an identifier, and leaves out undefined", () => {
    const text = serializeProps({ "data-id": 1, ok: undefined, fine: 2 });
    expect(text).toBe('const props = {\n  "data-id": 1,\n  fine: 2,\n};');
  });

  it("compares values by structure", () => {
    expect(sameValue({ a: 1 }, { a: 1 })).toBe(true);
    expect(sameValue(["x"], ["x"])).toBe(true);
    expect(sameValue({ a: 1 }, { a: 2 })).toBe(false);
    expect(sameValue(0, false)).toBe(false);
    expect(sameValue(undefined, undefined)).toBe(true);
  });
});

describe("a typed props literal", () => {
  const TYPED = `import type { ButtonProps } from "@its/glowup-ui";

const props: Partial<ButtonProps> = {
  variant: "tonal",
};

export default function Example() {
  return null;
}
`;

  it("is read, and written back with its annotation", () => {
    expect(readProps(TYPED)).toEqual({ variant: "tonal" });
    const next = writeProps(TYPED, { variant: "text", fullWidth: true });
    expect(next).toContain("const props: Partial<ButtonProps> = {");
    expect(next).toContain('  variant: "text",\n  fullWidth: true,\n};');
    expect(writeProps(TYPED, { variant: "tonal" })).toBe(TYPED);
  });
});

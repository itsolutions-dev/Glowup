import React, { type ReactNode } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Platform } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";

import { EXAMPLES, type LiveExampleDef } from "../catalogue/examples";
import { ComponentRegistry } from "../catalogue/registry";
import type { ComponentMetadata } from "../catalogue/types";
import { LiveExample } from "../site/LiveExample";
import { readProps, sameValue, writeProps } from "../site/exampleProps";
import { compileExample } from "../site/liveCode";

const Providers = ({ children }: { children: ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 1280, height: 900 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    <ThemeProvider>{children}</ThemeProvider>
  </SafeAreaProvider>
);

// A React element held in a host prop (a list's empty component) carries its
// owner fibre, which loops back on itself: leave that out of the dump.
const json = async (node: ReactNode) =>
  JSON.stringify(
    (await render(<Providers>{node}</Providers>)).toJSON(),
    (key, value) => (key === "_owner" ? undefined : value),
  );

// The examples that belong to a catalogue page. (A file that is not named after
// one is an example of nothing: the catalogue test pins that none is left.)
const own = Object.values(EXAMPLES).filter((example) =>
  Object.hasOwn(ComponentRegistry, example.id),
);
const all = own.map((example) => [example.id, example] as const);

describe("an example", () => {
  it.each(all)("%s renders", async (_, example) => {
    expect(await json(<example.Component />)).toContain('"type"');
  });

  // The page puts `source` in the editor as the code behind the stage; it must
  // be the file as it is now, not as it was at the last regeneration.
  it.each(all)(
    "%s embeds its current source (npm run examples -w @its/glowup-playground)",
    (_, example) => {
      const onDisk = readFileSync(
        join(__dirname, "../catalogue/examples", example.file),
        "utf8",
      ).replace(/\r\n/g, "\n");
      expect(example.source).toBe(onDisk);
    },
  );

  // What the editor shows once the text has been touched is the compiled text,
  // so compiling the file's own text has to draw what the real component draws.
  it.each(all)("%s compiles to the same screen", async (_, example) => {
    const result = compileExample(
      example.source,
      readProps(example.source) ?? {},
    );
    if (!result.ok) throw new Error(result.error);
    expect(await json(<result.Component />)).toBe(
      await json(<example.Component />),
    );
  });

  // The panel and the code are one thing: the literal has to hold keys the
  // component's controls know, with values those controls can show, and be in
  // the shape the panel writes so a control moved and moved back is no edit.
  it.each(all)(
    "%s has a props object its controls can edit",
    (name, example) => {
      const controls = ComponentRegistry[name].props;
      // A page whose component has nothing to control (Portal) has no literal.
      if (Object.keys(controls).length === 0) {
        expect(readProps(example.source)).toBeNull();
        return;
      }
      const props = readProps(example.source);
      expect(props).not.toBeNull();
      for (const [key, value] of Object.entries(props as object)) {
        const control = controls[key];
        expect({ key, known: !!control }).toEqual({ key, known: true });
        switch (control.type) {
          case "boolean":
            expect({ key, type: typeof value }).toEqual({
              key,
              type: "boolean",
            });
            break;
          case "number":
            expect({ key, type: typeof value }).toEqual({
              key,
              type: "number",
            });
            break;
          case "text":
          case "icon":
            expect({ key, type: typeof value }).toEqual({
              key,
              type: "string",
            });
            break;
          case "select":
            expect({
              key,
              allowed: (control.options ?? []).some((option) =>
                sameValue(option.value, value),
              ),
            }).toEqual({ key, allowed: true });
            break;
        }
      }
      expect(writeProps(example.source, props as Record<string, unknown>)).toBe(
        example.source,
      );
    },
  );
});

describe("compileExample", () => {
  it("compiles TSX with imports and a default export", async () => {
    const result = compileExample(`
      import { Typography } from "@its/glowup-ui";
      const label: string = "Hello";
      export default function Hi() {
        return <Typography>{label}</Typography>;
      }
    `);
    if (!result.ok) throw new Error(result.error);
    expect(await json(<result.Component />)).toContain("Hello");
  });

  it("reads the props literal from the object it is given, not from the text", async () => {
    const source = `
import { Typography } from "@its/glowup-ui";

const props = {
  label: "from the text",
};

export default function Hi() {
  return <Typography>{props.label}</Typography>;
}
`;
    const bag = { label: "from the bag" };
    const result = compileExample(source, bag);
    if (!result.ok) throw new Error(result.error);
    expect(await json(<result.Component />)).toContain("from the bag");
    // The bag is read on every render: a change of it shows at the next one.
    bag.label = "changed";
    expect(await json(<result.Component />)).toContain("changed");
  });

  it("reports a syntax error with its position", () => {
    const result = compileExample("export default function () { return <; }");
    expect(result).toMatchObject({ ok: false });
    expect(result.ok === false && result.error).toMatch(/\(\d+:\d+\)/);
  });

  it("refuses an import outside the allowed packages", () => {
    const result = compileExample(`
      import fs from "fs";
      export default function X() { return fs ? null : null; }
    `);
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringContaining('Cannot import "fs"'),
    });
  });

  it("asks for a default export that is a component", () => {
    expect(compileExample("export const x = 1;")).toMatchObject({
      ok: false,
      error: expect.stringContaining("export default"),
    });
  });
});

describe("LiveExample", () => {
  const SOURCE = `import { useState } from "react";
import { Button, Typography, VStack } from "@its/glowup-ui";

const props = {
  label: "Save",
  count: 1,
};

export default function Probe() {
  const [clicks, setClicks] = useState(0);
  return (
    <VStack>
      <Button variant="tonal" onClick={() => setClicks(clicks + 1)}>
        {props.label}
      </Button>
      <Typography>{\`clicks \${clicks} count \${props.count}\`}</Typography>
    </VStack>
  );
}
`;
  const real = compileExample(SOURCE, readProps(SOURCE) ?? {});
  if (!real.ok) throw new Error(real.error);
  const example: LiveExampleDef = {
    id: "Probe",
    Component: real.Component,
    file: "Probe.tsx",
    source: SOURCE,
  };
  const meta = {
    name: "Probe",
    Component: () => null,
    props: {
      label: { type: "text", default: "Hello", label: "Label" },
      count: { type: "number", default: 0, label: "Count" },
      dense: { type: "boolean", default: false, label: "Dense" },
    },
  } as unknown as ComponentMetadata;

  const draw = () =>
    render(
      <Providers>
        <LiveExample name="Probe" example={example} meta={meta} />
      </Providers>,
    );
  const editor = () => screen.getByLabelText("Probe example: code");
  const settle = () =>
    act(async () => {
      jest.advanceTimersByTime(400);
    });
  const typeCode = async (text: string) => {
    await fireEvent.changeText(editor(), text);
    await settle();
  };

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("starts with the file's code, the controls and nothing to reset", async () => {
    await draw();
    expect(editor().props.value).toBe(SOURCE);
    expect(screen.getByText("clicks 0 count 1")).toBeTruthy();
    expect(screen.getByLabelText("Label").props.value).toBe("Save");
    expect(
      screen.getByRole("button", { name: "Reset to default" }).props
        .accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("writes a control into the code and redraws without losing state", async () => {
    await draw();
    await fireEvent.changeText(screen.getByLabelText("Label"), "Send");
    await settle();
    expect(editor().props.value).toContain('label: "Send",');
    // The code outside the literal is untouched.
    expect(editor().props.value).toContain("const [clicks, setClicks]");
    expect(screen.getByRole("button", { name: "Send" })).toBeTruthy();

    // From the first change on the stage runs the compiled text, and the next
    // changes of a control redraw it without compiling it again: state stays.
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("clicks 1 count 1")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Label"), "Submit");
    await settle();
    expect(screen.getByRole("button", { name: "Submit" })).toBeTruthy();
    expect(screen.getByText("clicks 1 count 1")).toBeTruthy();
  });

  it("leaves the literal when a control goes back to its default, unless the example wrote it", async () => {
    await draw();
    // `count` is in the example's own literal: it stays when set to its default.
    await fireEvent.changeText(screen.getByLabelText("Count"), "0");
    await settle();
    expect(editor().props.value).toContain("count: 0,");
    // `dense` is not: it appears when set, and goes when put back.
    await fireEvent.press(screen.getByRole("switch"));
    await settle();
    expect(editor().props.value).toContain("dense: true,");
    await fireEvent.press(screen.getByRole("switch"));
    await settle();
    expect(editor().props.value).not.toContain("dense");
  });

  it("moves the controls when the literal is typed in", async () => {
    await draw();
    await typeCode(SOURCE.replace('label: "Save"', 'label: "Typed"'));
    expect(screen.getByLabelText("Label").props.value).toBe("Typed");
    expect(screen.getByRole("button", { name: "Typed" })).toBeTruthy();
  });

  it("redraws from edited code and keeps the last good stage while it is broken", async () => {
    await draw();
    await typeCode(SOURCE.replace("`clicks ", "`taps "));
    expect(screen.getByText("taps 0 count 1")).toBeTruthy();
    await typeCode(`${SOURCE}\n)))`);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("taps 0 count 1")).toBeTruthy();
  });

  it("says the controls are off when the literal cannot be read, and gets them back on reset", async () => {
    await draw();
    await typeCode(SOURCE.replace('label: "Save"', "label: oops oops"));
    expect(screen.getByText(/no longer has one that can be read/)).toBeTruthy();
    await fireEvent.press(
      screen.getAllByRole("button", { name: "Reset to default" })[0],
    );
    expect(editor().props.value).toBe(SOURCE);
    expect(screen.getByLabelText("Label").props.value).toBe("Save");
  });

  it("puts the original code and stage back on reset", async () => {
    await draw();
    await typeCode(SOURCE.replace("`clicks ", "`taps "));
    await fireEvent.press(
      screen.getByRole("button", { name: "Reset to default" }),
    );
    expect(editor().props.value).toBe(SOURCE);
    expect(screen.getByText("clicks 0 count 1")).toBeTruthy();
  });

  it("draws the web editor over a highlighted copy that screen readers skip", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    await draw();
    const tree = JSON.stringify(screen.toJSON());
    expect(tree).toContain('"aria-hidden":true');
    expect(tree).toContain("Probe");
  });

  it("shows a render error of the edited code instead of blanking the page", async () => {
    await draw();
    jest.spyOn(console, "error").mockImplementation(() => {});
    await typeCode(
      `export default function Boom() { throw new Error("kaboom"); }`,
    );
    expect(screen.getByText("kaboom")).toBeTruthy();
  });
});

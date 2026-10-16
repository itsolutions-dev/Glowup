import React from "react";
import { render } from "@testing-library/react-native";
import { Button, Input, Select, ThemeProvider } from "..";

const json = async (ui: React.ReactElement) =>
  JSON.stringify((await render(<ThemeProvider>{ui}</ThemeProvider>)).toJSON());

describe("density", () => {
  it("makes Input 40 high when dense, 56 otherwise, unless minHeight is given", async () => {
    const input = (props = {}) => (
      <Input label="Nome" value="" onChangeText={() => {}} {...props} />
    );
    expect(await json(input({ density: "dense" }))).toContain('"minHeight":40');
    expect(await json(input())).toContain('"minHeight":56');
    expect(await json(input({ density: "dense", minHeight: 72 }))).toContain(
      '"minHeight":72',
    );
  });

  it("makes Select 40 high when dense, 52 otherwise", async () => {
    const select = (props = {}) => (
      <Select
        options={[{ id: "1", label: "Uno", value: 1 }]}
        value={null}
        onSelect={() => {}}
        {...props}
      />
    );
    expect(await json(select({ density: "dense" }))).toContain(
      '"minHeight":40',
    );
    expect(await json(select())).toContain('"minHeight":52');
  });

  it("tightens Button padding when dense", async () => {
    expect(await json(<Button density="dense">Ok</Button>)).toContain(
      '"paddingVertical":10',
    );
    expect(await json(<Button>Ok</Button>)).not.toContain(
      '"paddingVertical":10',
    );
  });
});

describe("ThemeProvider density", () => {
  const withProvider = async (
    provider: Omit<React.ComponentProps<typeof ThemeProvider>, "children">,
    ui: React.ReactElement,
  ) =>
    JSON.stringify(
      (
        await render(<ThemeProvider {...provider}>{ui}</ThemeProvider>)
      ).toJSON(),
    );
  const field = (props = {}) => (
    <Input label="Nome" value="" onChangeText={() => {}} {...props} />
  );

  it("sets the default for every control inside", async () => {
    expect(await withProvider({ density: "dense" }, field())).toContain(
      '"minHeight":40',
    );
    expect(
      await withProvider({ density: "dense" }, <Button>Ok</Button>),
    ).toContain('"paddingVertical":10');
  });

  it("lets a control's own density win", async () => {
    expect(
      await withProvider({ density: "dense" }, field({ density: "normal" })),
    ).toContain('"minHeight":56');
  });

  it("is inherited by a nested provider that sets none", async () => {
    const out = await withProvider(
      { density: "dense" },
      <ThemeProvider>{field()}</ThemeProvider>,
    );
    expect(out).toContain('"minHeight":40');
  });
});

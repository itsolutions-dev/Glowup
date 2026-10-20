import React from "react";
import { Platform, Text, View } from "react-native";
import { act, cleanup, fireEvent, render } from "@testing-library/react-native";
import { Button, Form, ThemeProvider } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("Form on iOS and Android", () => {
  it("a submit button submits the form", async () => {
    const onSubmit = jest.fn();
    const { getByText } = await draw(
      <Form onSubmit={onSubmit}>
        <Text>Field</Text>
        <Button type="submit">Save</Button>
      </Form>,
    );
    await fireEvent.press(getByText("Save"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("submits once per press, however many times it is pressed", async () => {
    const onSubmit = jest.fn();
    const { getByText } = await draw(
      <Form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
        <Button type="submit">Save and close</Button>
      </Form>,
    );
    await fireEvent.press(getByText("Save"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await fireEvent.press(getByText("Save and close"));
    await fireEvent.press(getByText("Save and close"));
    expect(onSubmit).toHaveBeenCalledTimes(3);
  });

  it("a button is not a submit button unless it asks", async () => {
    const onSubmit = jest.fn();
    const onClick = jest.fn();
    const { getByText } = await draw(
      <Form onSubmit={onSubmit}>
        <Button onClick={onClick}>Cancel</Button>
        <Button type="button" onClick={onClick}>
          Reset
        </Button>
      </Form>,
    );
    await fireEvent.press(getByText("Cancel"));
    await fireEvent.press(getByText("Reset"));
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("runs the button's onClick first, then submits", async () => {
    const order: string[] = [];
    const { getByText } = await draw(
      <Form onSubmit={() => order.push("submit")}>
        <Button type="submit" onClick={() => order.push("click")}>
          Save
        </Button>
      </Form>,
    );
    await fireEvent.press(getByText("Save"));
    expect(order).toEqual(["click", "submit"]);
  });

  it("a submit button outside a form just clicks", async () => {
    const onClick = jest.fn();
    const { getByText } = await draw(
      <Button type="submit" onClick={onClick}>
        Save
      </Button>,
    );
    await fireEvent.press(getByText("Save"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["disabled", { disabled: true }],
    ["loading", { loading: true }],
    ["busy", { busy: true }],
  ] as const)("a %s submit button does not submit", async (_, state) => {
    const onSubmit = jest.fn();
    const { getByRole } = await draw(
      <Form onSubmit={onSubmit}>
        <Button type="submit" accessibilityLabel="Save" {...state}>
          Save
        </Button>
      </Form>,
    );
    await fireEvent.press(getByRole("button", { name: "Save" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls the latest onSubmit, not the one from the first render", async () => {
    const first = jest.fn();
    const second = jest.fn();
    const tree = (onSubmit: () => void) => (
      <ThemeProvider>
        <Form onSubmit={onSubmit}>
          <Button type="submit">Save</Button>
        </Form>
      </ThemeProvider>
    );
    const { getByText, rerender } = await render(tree(first));
    await rerender(tree(second));
    await fireEvent.press(getByText("Save"));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("works without an onSubmit", async () => {
    const { getByText } = await draw(
      <Form>
        <Button type="submit">Save</Button>
      </Form>,
    );
    await fireEvent.press(getByText("Save"));
  });

  it("renders a plain View: no form role, no hidden web button", async () => {
    const { container, getByTestId } = await draw(
      <Form testID="f" style={{ padding: 3 }}>
        <Text>Field</Text>
      </Form>,
    );
    expect(getByTestId("f").props.role).toBeUndefined();
    expect(getByTestId("f").props.style).toEqual({ padding: 3 });
    expect(container.queryAll((n) => n.type === "button")).toHaveLength(0);
  });

  it("a nested form submits only itself", async () => {
    const outer = jest.fn();
    const inner = jest.fn();
    const { getByText } = await draw(
      <Form onSubmit={outer}>
        <Form onSubmit={inner}>
          <Button type="submit">Inner</Button>
        </Form>
        <Button type="submit">Outer</Button>
      </Form>,
    );
    await fireEvent.press(getByText("Inner"));
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
    await fireEvent.press(getByText("Outer"));
    expect(outer).toHaveBeenCalledTimes(1);
  });
});

describe("Form on the web", () => {
  type Listener = (event: { preventDefault: () => void }) => void;
  const original = Object.getOwnPropertyDescriptor(Platform, "OS")!;
  // The test renderer hands a ref the mocked View instance, which has no DOM
  // methods: give every View the few a <form> has, and record the listener.
  const proto = (View as unknown as { prototype: Record<string, unknown> })
    .prototype;
  const listeners = new Map<string, Listener>();
  const requestSubmit = jest.fn(() => {
    const preventDefault = jest.fn();
    listeners.get("submit")?.({ preventDefault });
    return preventDefault;
  });

  beforeEach(() => {
    Object.defineProperty(Platform, "OS", {
      get: () => "web",
      configurable: true,
    });
    proto.addEventListener = (type: string, fn: Listener) =>
      listeners.set(type, fn);
    proto.removeEventListener = (type: string) => listeners.delete(type);
    proto.requestSubmit = requestSubmit;
  });
  afterEach(async () => {
    await cleanup();
    Object.defineProperty(Platform, "OS", original);
    delete proto.addEventListener;
    delete proto.removeEventListener;
    delete proto.requestSubmit;
    listeners.clear();
    requestSubmit.mockClear();
  });

  it("is a <form>, with a hidden submit button so Enter submits", async () => {
    const { container, getByTestId } = await draw(
      <Form testID="f">
        <Text>Field</Text>
      </Form>,
    );
    expect(getByTestId("f").props.role).toBe("form");
    const hidden = container.queryAll((n) => n.type === "button");
    expect(hidden).toHaveLength(1);
    expect(hidden[0].props.type).toBe("submit");
    expect(hidden[0].props.tabIndex).toBe(-1);
  });

  it("a submit button submits through the form's own submit event, once", async () => {
    const onSubmit = jest.fn();
    const { getByText } = await draw(
      <Form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </Form>,
    );
    await fireEvent.press(getByText("Save"));
    expect(requestSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("the submit event (what Enter in a field raises) prevents the page navigation and calls onSubmit", async () => {
    const onSubmit = jest.fn();
    await draw(
      <Form onSubmit={onSubmit}>
        <Text>Field</Text>
      </Form>,
    );
    const preventDefault = jest.fn();
    await act(async () => {
      listeners.get("submit")?.({ preventDefault });
    });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("stops listening when it unmounts", async () => {
    await draw(
      <Form onSubmit={() => {}}>
        <Text>Field</Text>
      </Form>,
    );
    expect(listeners.has("submit")).toBe(true);
    await cleanup();
    expect(listeners.has("submit")).toBe(false);
  });

  it("without requestSubmit it still submits, once", async () => {
    delete proto.requestSubmit;
    const onSubmit = jest.fn();
    const { getByText } = await draw(
      <Form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </Form>,
    );
    await fireEvent.press(getByText("Save"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

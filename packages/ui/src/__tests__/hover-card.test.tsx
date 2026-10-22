import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { act, cleanup, fireEvent, render } from "@testing-library/react-native";
import { Button, HoverCard, Portal, ThemeProvider } from "..";
import { placeOnSide } from "../components/internal/anchorPlacement";

const draw = (ui: React.ReactElement) =>
  render(
    <ThemeProvider>
      <Portal.Host>{ui}</Portal.Host>
    </ThemeProvider>,
  );

const drawInline = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

type Node = { props: Record<string, any>; parent?: Node | null };
/** The testIDs of everything a node sits inside. */
const ancestorIds = (node: Node) => {
  const ids: unknown[] = [];
  for (let n = node.parent; n; n = n.parent) ids.push(n.props?.testID);
  return ids;
};
const flat = (node: Node) => StyleSheet.flatten(node.props.style);

/** Where the trigger is, as the platform would report it. */
const measure = (x = 100, y = 200, width = 50, height = 20) =>
  jest
    .spyOn(View.prototype as any, "measureInWindow")
    .mockImplementation((cb: any) => cb(x, y, width, height));

const card = (
  <View testID="inner">
    <Text>Ada Lovelace</Text>
  </View>
);

describe("placeOnSide", () => {
  const window = { width: 800, height: 600 };
  const anchor = { x: 300, y: 250, width: 100, height: 40 };
  const size = { width: 200, height: 100 };

  it("centres the card on the side asked, a gap away", () => {
    expect(placeOnSide(anchor, size, window, "bottom")).toEqual({
      left: 250,
      top: 298,
      side: "bottom",
    });
    expect(placeOnSide(anchor, size, window, "top")).toEqual({
      left: 250,
      top: 142,
      side: "top",
    });
    expect(placeOnSide(anchor, size, window, "right")).toEqual({
      left: 408,
      top: 220,
      side: "right",
    });
    expect(placeOnSide(anchor, size, window, "left")).toEqual({
      left: 92,
      top: 220,
      side: "left",
    });
  });

  it("flips to the opposite side when the asked one has no room", () => {
    const low = { ...anchor, y: 540 };
    expect(placeOnSide(low, size, window, "bottom").side).toBe("top");
    const high = { ...anchor, y: 10 };
    expect(placeOnSide(high, size, window, "top").side).toBe("bottom");
    const edge = { ...anchor, x: 760 };
    expect(placeOnSide(edge, size, window, "right").side).toBe("left");
  });

  it("stays on the asked side when neither fits, and still keeps inside the window", () => {
    const tall = { width: 200, height: 580 };
    const placed = placeOnSide(anchor, tall, window, "bottom");
    expect(placed.side).toBe("bottom");
    expect(placed.top).toBeGreaterThanOrEqual(8);
    expect(placed.top + tall.height).toBeLessThanOrEqual(window.height - 8);
  });

  it("slides back inside the margins across the anchor", () => {
    const corner = { x: 0, y: 0, width: 20, height: 20 };
    const placed = placeOnSide(corner, size, window, "bottom");
    expect(placed.left).toBe(8);
    const far = { x: 790, y: 0, width: 10, height: 20 };
    expect(placeOnSide(far, size, window, "bottom").left).toBe(
      window.width - size.width - 8,
    );
  });
});

describe("HoverCard on native", () => {
  afterEach(() => jest.restoreAllMocks());

  it("is closed until the trigger is long pressed", async () => {
    const view = await draw(
      <HoverCard content={card} testID="hc">
        <Text>@ada</Text>
      </HoverCard>,
    );
    expect(view.queryByText("Ada Lovelace")).toBeNull();
    await fireEvent(view.getByText("@ada"), "longPress");
    expect(view.getByText("Ada Lovelace")).toBeTruthy();
  });

  it("closes on a press outside, and on Android back", async () => {
    const onOpenChange = jest.fn();
    const view = await draw(
      <HoverCard content={card} testID="hc" onOpenChange={onOpenChange}>
        <Text>@ada</Text>
      </HoverCard>,
    );
    await fireEvent(view.getByText("@ada"), "longPress");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await fireEvent.press(
      view.getByTestId("hc-backdrop", { includeHiddenElements: true }),
    );
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(view.queryByText("Ada Lovelace")).toBeNull();

    await fireEvent(view.getByText("@ada"), "longPress");
    const modal = view.container.queryAll((n) => n.type === "Modal")[0];
    await act(async () => modal.props.onRequestClose());
    expect(view.queryByText("Ada Lovelace")).toBeNull();
  });

  it("does not wrap the trigger in an accessible element, so a control stays reachable", async () => {
    const view = await draw(
      <HoverCard content={card}>
        <Button onClick={() => {}}>Follow</Button>
      </HoverCard>,
    );
    expect(view.getByRole("button", { name: "Follow" })).toBeTruthy();
    const wrappers = view.container.queryAll(
      (n) => n.props.accessible === false,
    );
    expect(wrappers.length).toBeGreaterThan(0);
  });

  it("opens from open/defaultOpen, and never while disabled", async () => {
    const shown = await draw(
      <HoverCard content={card} defaultOpen>
        <Text>t</Text>
      </HoverCard>,
    );
    expect(shown.getByText("Ada Lovelace")).toBeTruthy();

    const held = await draw(
      <HoverCard content={card} open={false} onOpenChange={() => {}}>
        <Text>held</Text>
      </HoverCard>,
    );
    await fireEvent(held.getByText("held"), "longPress");
    expect(held.queryByText("Ada Lovelace")).toBeNull();

    const off = await draw(
      <HoverCard content={card} disabled defaultOpen>
        <Text>off</Text>
      </HoverCard>,
    );
    expect(off.queryByText("Ada Lovelace")).toBeNull();
    await fireEvent(off.getByText("off"), "longPress");
    expect(off.queryByText("Ada Lovelace")).toBeNull();
  });

  it("places the card against the measured trigger, inside the window", async () => {
    measure(100, 200, 50, 20);
    const view = await draw(
      <HoverCard content={card} testID="hc" defaultOpen width={280}>
        <Text>t</Text>
      </HoverCard>,
    );
    const placed = view.getByTestId("hc-card");
    await fireEvent(placed, "layout", {
      nativeEvent: { layout: { width: 280, height: 100 } },
    });
    const style = flat(view.getByTestId("hc-card"));
    // Centred under the trigger would hang off the left edge: slid to the margin.
    expect(style).toMatchObject({ left: 8, top: 228, width: 280 });
    expect(style.opacity).toBeUndefined();
  });

  it("stays invisible until it has been measured", async () => {
    const view = await draw(
      <HoverCard content={card} testID="hc" defaultOpen>
        <Text>t</Text>
      </HoverCard>,
    );
    expect(flat(view.getByTestId("hc-card")).opacity).toBe(0);
  });

  it("places by anchorPosition as a Popover does", async () => {
    measure(100, 200, 50, 20);
    const view = await draw(
      <HoverCard
        content={card}
        testID="hc"
        defaultOpen
        width={200}
        anchorPosition={{ vertical: "bottom", horizontal: "left" }}
      >
        <Text>t</Text>
      </HoverCard>,
    );
    await fireEvent(view.getByTestId("hc-card"), "layout", {
      nativeEvent: { layout: { width: 200, height: 100 } },
    });
    expect(flat(view.getByTestId("hc-card"))).toMatchObject({
      left: 100,
      top: 228,
    });
  });
});

describe("HoverCard on the web", () => {
  const listeners = new Map<string, (event: unknown) => void>();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.replaceProperty(Platform, "OS", "web");
    (globalThis as Record<string, unknown>).document = {
      addEventListener: (type: string, fn: (event: unknown) => void) =>
        listeners.set(type, fn),
      removeEventListener: (type: string) => listeners.delete(type),
    };
  });
  afterEach(async () => {
    // Unmount while there is still a document for the Escape listener to leave.
    await cleanup();
    jest.useRealTimers();
    jest.restoreAllMocks();
    listeners.clear();
    delete (globalThis as Record<string, unknown>).document;
  });

  const wait = (ms: number) => act(async () => jest.advanceTimersByTime(ms));

  it("opens after openDelay of hover, not before", async () => {
    const view = await draw(
      <HoverCard content={card} testID="hc">
        <Text>@ada</Text>
      </HoverCard>,
    );
    await fireEvent(view.getByTestId("hc"), "pointerEnter");
    await wait(299);
    expect(view.queryByText("Ada Lovelace")).toBeNull();
    await wait(1);
    expect(view.getByText("Ada Lovelace")).toBeTruthy();
  });

  it("does not open when the pointer leaves first", async () => {
    const view = await draw(
      <HoverCard content={card} testID="hc">
        <Text>@ada</Text>
      </HoverCard>,
    );
    await fireEvent(view.getByTestId("hc"), "pointerEnter");
    await wait(100);
    await fireEvent(view.getByTestId("hc"), "pointerLeave");
    await wait(1000);
    expect(view.queryByText("Ada Lovelace")).toBeNull();
  });

  it("closes closeDelay after the pointer leaves, but not while it is over the card", async () => {
    const view = await draw(
      <HoverCard content={card} testID="hc" openDelay={0}>
        <Text>@ada</Text>
      </HoverCard>,
    );
    await fireEvent(view.getByTestId("hc"), "pointerEnter");
    expect(view.getByText("Ada Lovelace")).toBeTruthy();

    await fireEvent(view.getByTestId("hc"), "pointerLeave");
    await wait(100);
    // Onto the card before the delay is up: it stays.
    await fireEvent(view.getByTestId("hc-card"), "pointerEnter");
    await wait(1000);
    expect(view.getByText("Ada Lovelace")).toBeTruthy();

    await fireEvent(view.getByTestId("hc-card"), "pointerLeave");
    await wait(149);
    expect(view.getByText("Ada Lovelace")).toBeTruthy();
    await wait(1);
    expect(view.queryByText("Ada Lovelace")).toBeNull();
  });

  it("opens on focus and closes on blur, like a tooltip", async () => {
    const view = await draw(
      <HoverCard content={card} testID="hc" openDelay={0} closeDelay={0}>
        <Text>@ada</Text>
      </HoverCard>,
    );
    await fireEvent(view.getByTestId("hc"), "focus");
    expect(view.getByText("Ada Lovelace")).toBeTruthy();
    await fireEvent(view.getByTestId("hc"), "blur");
    expect(view.queryByText("Ada Lovelace")).toBeNull();
  });

  it("closes on Escape", async () => {
    const view = await draw(
      <HoverCard content={card} defaultOpen>
        <Text>@ada</Text>
      </HoverCard>,
    );
    expect(view.getByText("Ada Lovelace")).toBeTruthy();
    await act(async () =>
      listeners.get("keydown")?.({ key: "Escape", preventDefault() {} }),
    );
    expect(view.queryByText("Ada Lovelace")).toBeNull();
  });

  it("links the trigger to the card for assistive tech while it is open", async () => {
    const view = await draw(
      <HoverCard content={card} testID="hc" defaultOpen>
        <Text>@ada</Text>
      </HoverCard>,
    );
    const trigger = view.getByTestId("hc");
    const id = trigger.props["aria-describedby"];
    expect(id).toBeTruthy();
    expect(view.getByTestId("hc-card").props.nativeID).toBe(id);
  });

  it("is not modal: no backdrop is drawn, and the card is out of the trigger's subtree under a PortalHost", async () => {
    const view = await draw(
      <View style={{ overflow: "hidden" }}>
        <HoverCard content={card} testID="hc" defaultOpen>
          <Text>@ada</Text>
        </HoverCard>
      </View>,
    );
    expect(view.queryByTestId("hc-backdrop")).toBeNull();
    expect(view.container.queryAll((n) => n.type === "Modal")).toHaveLength(0);
    // Portalled: the card is not inside the trigger's wrapper.
    expect(ancestorIds(view.getByTestId("hc-card"))).not.toContain("hc");
  });

  it("draws inline next to the trigger without a PortalHost", async () => {
    const view = await drawInline(
      <HoverCard content={card} testID="hc" defaultOpen>
        <Text>@ada</Text>
      </HoverCard>,
    );
    expect(view.getByText("Ada Lovelace")).toBeTruthy();
    expect(ancestorIds(view.getByTestId("hc-card"))).toContain("hc");
  });

  it("never opens while disabled, and a controlled card follows its prop", async () => {
    const off = await draw(
      <HoverCard content={card} testID="hc" openDelay={0} disabled>
        <Text>@ada</Text>
      </HoverCard>,
    );
    await fireEvent(off.getByTestId("hc"), "pointerEnter");
    expect(off.queryByText("Ada Lovelace")).toBeNull();

    const onOpenChange = jest.fn();
    const held = await draw(
      <HoverCard
        content={card}
        testID="held"
        openDelay={0}
        open={false}
        onOpenChange={onOpenChange}
      >
        <Text>@bob</Text>
      </HoverCard>,
    );
    await fireEvent(held.getByTestId("held"), "pointerEnter");
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(held.queryByText("Ada Lovelace")).toBeNull();
  });
});

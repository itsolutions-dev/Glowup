import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { ThemeProvider, ToastProvider, useToast } from "..";

type Api = ReturnType<typeof useToast>;

/** Hands the provider's `useToast()` to the test, and counts the renders that read it. */
const draw = async (
  maxVisible?: number,
  position?: React.ComponentProps<typeof ToastProvider>["position"],
) => {
  const seen: Api[] = [];
  const Probe = () => {
    seen.push(useToast());
    return null;
  };
  const view = await render(
    <ThemeProvider>
      <ToastProvider maxVisible={maxVisible} position={position}>
        <Probe />
      </ToastProvider>
    </ThemeProvider>,
  );
  return { seen, ...view };
};

const alerts = (container: {
  queryAll: (p: (n: { props: Record<string, any> }) => boolean) => unknown[];
}) => container.queryAll((n) => n.props.accessibilityRole === "alert");

describe("ToastProvider maxVisible", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("shows one toast at a time by default and plays the rest back in order", async () => {
    const { seen, queryByText } = await draw();
    await act(async () => {
      seen[0].show({ message: "one", duration: 1000 });
      seen[0].show({ message: "two", duration: 1000 });
    });
    expect(queryByText("one")).toBeTruthy();
    expect(queryByText("two")).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(queryByText("one")).toBeNull();
    expect(queryByText("two")).toBeTruthy();
  });

  it("shows maxVisible together and brings the next in as a slot frees", async () => {
    const { seen, queryByText, getByText, container } = await draw(3);
    await act(async () => {
      seen[0].show({ message: "a", duration: 1000 });
      seen[0].show({ message: "b", duration: 5000 });
      seen[0].show({ message: "c", duration: 5000 });
      seen[0].show({ message: "d", duration: 5000 });
    });
    expect(alerts(container)).toHaveLength(3);
    expect(queryByText("d")).toBeNull();
    // Each has its own timer: only "a" is done after a second.
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(queryByText("a")).toBeNull();
    expect(getByText("b")).toBeTruthy();
    expect(getByText("d")).toBeTruthy();
    expect(alerts(container)).toHaveLength(3);
  });

  it("stacks downward from a top edge and upward from a bottom one, the newest nearest the edge", async () => {
    const order = async (position: "top-center" | "bottom-center") => {
      const { seen, toJSON, unmount } = await draw(3, position);
      await act(async () => {
        seen[0].show({ message: "first", duration: 0 });
        seen[0].show({ message: "second", duration: 0 });
      });
      const out = JSON.stringify(toJSON());
      await unmount();
      // Tree order is top-to-bottom order on screen.
      return out.indexOf("first") < out.indexOf("second")
        ? ["first", "second"]
        : ["second", "first"];
    };
    // Top to bottom on screen: the newest first from the top edge, last from the bottom one.
    expect(await order("top-center")).toEqual(["second", "first"]);
    expect(await order("bottom-center")).toEqual(["first", "second"]);
  });

  it("leaves a gap between stacked toasts", async () => {
    const { seen, container } = await draw(2);
    await act(async () => {
      seen[0].show({ message: "a", duration: 0 });
      seen[0].show({ message: "b", duration: 0 });
    });
    const [alert] = alerts(container) as { parent: any }[];
    let node = alert;
    while (node && StyleSheet.flatten(node.parent?.props.style)?.gap == null)
      node = node.parent;
    expect(StyleSheet.flatten(node.parent.props.style).gap).toBeGreaterThan(0);
  });
});

describe("useToast identity", () => {
  it("is the same object across enqueues, hides and the provider's re-renders", async () => {
    const { seen } = await draw();
    const first = seen[0];
    await act(async () => {
      first.show({ message: "a", duration: 0 });
      first.show({ message: "b", duration: 0 });
    });
    await act(async () => {
      first.hide();
    });
    expect(seen.length).toBeGreaterThan(0);
    expect(new Set(seen).size).toBe(1);
  });

  it("does not loop an effect that depends on it", async () => {
    let runs = 0;
    const Effect = () => {
      const toast = useToast();
      React.useEffect(() => {
        runs++;
        toast.show({ message: "once", duration: 0 });
      }, [toast]);
      return null;
    };
    await render(
      <ThemeProvider>
        <ToastProvider>
          <Effect />
        </ToastProvider>
      </ThemeProvider>,
    );
    expect(runs).toBe(1);
  });

  it("still lists the queued keys, read when accessed", async () => {
    const { seen } = await draw();
    let key = "";
    await act(async () => {
      key = seen[0].show({ message: "a", duration: 0 });
    });
    expect(seen[0].queue).toEqual([key]);
    await act(async () => {
      seen[0].hide(key);
    });
    expect(seen[0].queue).toEqual([]);
  });
});

describe("replacing a toast by id", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("restarts the timer of the visible one and keeps its place", async () => {
    const { seen, queryByText } = await draw();
    await act(async () => {
      seen[0].show({ id: "sync", message: "Syncing", duration: 1000 });
      seen[0].show({ message: "after", duration: 1000 });
    });
    await act(async () => {
      jest.advanceTimersByTime(800);
    });
    await act(async () => {
      seen[0].show({ id: "sync", message: "Synced", duration: 1000 });
    });
    // 800 ms of the old timer would have ended it at 1000: it is still up.
    await act(async () => {
      jest.advanceTimersByTime(800);
    });
    expect(queryByText("Synced")).toBeTruthy();
    expect(queryByText("Syncing")).toBeNull();
    expect(queryByText("after")).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(queryByText("Synced")).toBeNull();
    expect(queryByText("after")).toBeTruthy();
  });

  it("still dismisses by the id it was shown with", async () => {
    const Trigger = () => {
      const toast = useToast();
      return (
        <Pressable
          accessibilityLabel="go"
          onPress={() => toast.show({ id: "x", message: "hello" })}
        >
          <Text>go</Text>
        </Pressable>
      );
    };
    const { getByLabelText, queryByText } = await render(
      <ThemeProvider>
        <ToastProvider>
          <Trigger />
        </ToastProvider>
      </ThemeProvider>,
    );
    await fireEvent.press(getByLabelText("go"));
    await fireEvent.press(getByLabelText("go"));
    expect(queryByText("hello")).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    expect(queryByText("hello")).toBeNull();
  });
});

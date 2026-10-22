import React from "react";
import { AccessibilityInfo, Platform, StyleSheet, Text } from "react-native";
import {
  act,
  fireEvent,
  render,
  renderHook,
} from "@testing-library/react-native";
import { CaptionValue, Clipboard, ThemeProvider, useClipboard } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

const setClipboardApi = (value: unknown) =>
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value,
    configurable: true,
  });

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  delete (globalThis as Record<string, unknown>).document;
});

describe("useClipboard", () => {
  it("copies through the writer, then confirms for the timeout", async () => {
    jest.useFakeTimers();
    const write = jest.fn();
    const onCopy = jest.fn();
    const { result } = await renderHook(() =>
      useClipboard({ copy: write, onCopy, timeout: 500 }),
    );
    expect(result.current.copied).toBe(false);

    let done: boolean | undefined;
    await act(async () => {
      done = await result.current.copy("hello");
    });
    expect(done).toBe(true);
    expect(write).toHaveBeenCalledWith("hello");
    expect(onCopy).toHaveBeenCalledWith("hello");
    expect(result.current.copied).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(499);
    });
    expect(result.current.copied).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(2);
    });
    expect(result.current.copied).toBe(false);
  });

  it("defaults to 1500 ms", async () => {
    jest.useFakeTimers();
    const { result } = await renderHook(() => useClipboard({ copy: () => {} }));
    await act(async () => {
      await result.current.copy("x");
    });
    await act(async () => {
      jest.advanceTimersByTime(1499);
    });
    expect(result.current.copied).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(2);
    });
    expect(result.current.copied).toBe(false);
  });

  it("a second copy restarts the confirmation", async () => {
    jest.useFakeTimers();
    const { result } = await renderHook(() =>
      useClipboard({ copy: () => {}, timeout: 1000 }),
    );
    await act(async () => {
      await result.current.copy("a");
    });
    await act(async () => {
      jest.advanceTimersByTime(800);
    });
    await act(async () => {
      await result.current.copy("b");
    });
    await act(async () => {
      jest.advanceTimersByTime(800);
    });
    expect(result.current.copied).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.copied).toBe(false);
  });

  it("a writer that throws or rejects copied nothing: false, no report", async () => {
    const onCopy = jest.fn();
    const { result } = await renderHook(() =>
      useClipboard({
        copy: () => Promise.reject(new Error("denied")),
        onCopy,
      }),
    );
    let done: boolean | undefined;
    await act(async () => {
      done = await result.current.copy("x");
    });
    expect(done).toBe(false);
    expect(onCopy).not.toHaveBeenCalled();
    expect(result.current.copied).toBe(false);

    const sync = await renderHook(() =>
      useClipboard({
        copy: () => {
          throw new Error("nope");
        },
      }),
    );
    await act(async () => {
      done = await sync.result.current.copy("x");
    });
    expect(done).toBe(false);
  });

  it("on native, with neither a writer nor onCopy, there is nothing to copy with", async () => {
    const { result } = await renderHook(() => useClipboard());
    let done: boolean | undefined;
    await act(async () => {
      done = await result.current.copy("x");
    });
    expect(done).toBe(false);
    expect(result.current.copied).toBe(false);
  });

  it("on native, with only onCopy, hands the text over", async () => {
    const onCopy = jest.fn();
    const { result } = await renderHook(() => useClipboard({ onCopy }));
    await act(async () => {
      expect(await result.current.copy("x")).toBe(true);
    });
    expect(onCopy).toHaveBeenCalledWith("x");
    expect(result.current.copied).toBe(true);
  });

  it("announces the copy, in the words given, or not at all", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});
    const loud = await renderHook(() => useClipboard({ copy: () => {} }));
    await act(async () => {
      await loud.result.current.copy("x");
    });
    expect(announce).toHaveBeenCalledWith("Copied");

    announce.mockClear();
    const italian = await renderHook(() =>
      useClipboard({ copy: () => {}, announcement: "Copiato" }),
    );
    await act(async () => {
      await italian.result.current.copy("x");
    });
    expect(announce).toHaveBeenCalledWith("Copiato");

    announce.mockClear();
    const quiet = await renderHook(() =>
      useClipboard({ copy: () => {}, announcement: "" }),
    );
    await act(async () => {
      await quiet.result.current.copy("x");
    });
    expect(announce).not.toHaveBeenCalled();
  });

  it("does not leave a timer behind when it unmounts", async () => {
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(globalThis, "setTimeout");
    const clearTimeoutSpy = jest.spyOn(globalThis, "clearTimeout");
    const { result, unmount } = await renderHook(() =>
      useClipboard({ copy: () => {} }),
    );
    await act(async () => {
      await result.current.copy("x");
    });
    const index = setTimeoutSpy.mock.calls.findIndex(
      ([, delay]) => delay === 1500,
    );
    expect(index).toBeGreaterThanOrEqual(0);
    await unmount();
    // The confirmation's timer goes with it.
    expect(clearTimeoutSpy).toHaveBeenCalledWith(
      setTimeoutSpy.mock.results[index].value,
    );
  });

  it("a write that finishes after it unmounted still reports, but sets no confirmation", async () => {
    jest.useFakeTimers();
    let finish: () => void = () => {};
    const write = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const onCopy = jest.fn();
    const setTimeoutSpy = jest.spyOn(globalThis, "setTimeout");
    const { result, unmount } = await renderHook(() =>
      useClipboard({ copy: write, onCopy }),
    );
    let pending!: Promise<boolean>;
    await act(async () => {
      pending = result.current.copy("x");
    });
    await unmount();
    await act(async () => {
      finish();
      expect(await pending).toBe(true);
    });
    expect(onCopy).toHaveBeenCalledWith("x");
    expect(setTimeoutSpy.mock.calls.some(([, delay]) => delay === 1500)).toBe(
      false,
    );
  });

  describe("on web", () => {
    beforeEach(() => {
      jest.replaceProperty(Platform, "OS", "web");
    });

    it("writes with navigator.clipboard", async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      setClipboardApi({ writeText });
      const { result } = await renderHook(() => useClipboard());
      await act(async () => {
        expect(await result.current.copy("web text")).toBe(true);
      });
      expect(writeText).toHaveBeenCalledWith("web text");
      expect(result.current.copied).toBe(true);
    });

    it("a refused write is not a copy", async () => {
      setClipboardApi({
        writeText: jest.fn().mockRejectedValue(new Error("x")),
      });
      const onCopy = jest.fn();
      const { result } = await renderHook(() => useClipboard({ onCopy }));
      await act(async () => {
        expect(await result.current.copy("x")).toBe(false);
      });
      expect(onCopy).not.toHaveBeenCalled();
      expect(result.current.copied).toBe(false);
    });

    it("an explicit writer wins over the browser's", async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      setClipboardApi({ writeText });
      const write = jest.fn();
      const { result } = await renderHook(() => useClipboard({ copy: write }));
      await act(async () => {
        await result.current.copy("mine");
      });
      expect(write).toHaveBeenCalledWith("mine");
      expect(writeText).not.toHaveBeenCalled();
    });

    // A page with no async Clipboard API: a hidden textarea and the old command.
    const stubDocument = (execCommand: jest.Mock) => {
      const textarea = {
        value: "",
        style: {} as Record<string, string>,
        setAttribute: jest.fn(),
        select: jest.fn(),
        setSelectionRange: jest.fn(),
        remove: jest.fn(),
      };
      const body = { appendChild: jest.fn() };
      (globalThis as Record<string, unknown>).document = {
        createElement: jest.fn(() => textarea),
        body,
        execCommand,
        activeElement: null,
      };
      return { textarea, body };
    };

    it("falls back to execCommand when there is no clipboard API", async () => {
      setClipboardApi(undefined);
      const execCommand = jest.fn(() => true);
      const { textarea, body } = stubDocument(execCommand);
      const { result } = await renderHook(() => useClipboard());
      await act(async () => {
        expect(await result.current.copy("old school")).toBe(true);
      });
      expect(textarea.value).toBe("old school");
      expect(body.appendChild).toHaveBeenCalledWith(textarea);
      expect(execCommand).toHaveBeenCalledWith("copy");
      // The helper element does not stay in the page.
      expect(textarea.remove).toHaveBeenCalled();
      expect(result.current.copied).toBe(true);
    });

    it("tries execCommand when the API refuses, and fails when that does too", async () => {
      setClipboardApi({
        writeText: jest.fn().mockRejectedValue(new Error("x")),
      });
      const execCommand = jest.fn(() => true);
      stubDocument(execCommand);
      const works = await renderHook(() => useClipboard());
      await act(async () => {
        expect(await works.result.current.copy("x")).toBe(true);
      });

      execCommand.mockReturnValue(false);
      const fails = await renderHook(() => useClipboard());
      await act(async () => {
        expect(await fails.result.current.copy("x")).toBe(false);
      });
    });

    it("with no way to write at all, only onCopy can confirm", async () => {
      setClipboardApi(undefined);
      const none = await renderHook(() => useClipboard());
      await act(async () => {
        expect(await none.result.current.copy("x")).toBe(false);
      });
      const onCopy = jest.fn();
      const told = await renderHook(() => useClipboard({ onCopy }));
      await act(async () => {
        expect(await told.result.current.copy("x")).toBe(true);
      });
      expect(onCopy).toHaveBeenCalledWith("x");
    });
  });
});

describe("Clipboard", () => {
  it("is an icon button that copies the value and confirms", async () => {
    jest.useFakeTimers();
    const write = jest.fn();
    const onCopy = jest.fn();
    const { getByRole, queryByRole } = await draw(
      <Clipboard value="sk-123" copy={write} onCopy={onCopy} />,
    );
    await fireEvent.press(getByRole("button", { name: "Copy" }));
    expect(write).toHaveBeenCalledWith("sk-123");
    expect(onCopy).toHaveBeenCalledWith("sk-123");
    expect(getByRole("button", { name: "Copied" })).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(1600);
    });
    expect(queryByRole("button", { name: "Copied" })).toBeNull();
    expect(getByRole("button", { name: "Copy" })).toBeTruthy();
  });

  it("takes the timeout and the labels, and passes size and variant to the button", async () => {
    jest.useFakeTimers();
    const { getByRole, queryByRole } = await draw(
      <Clipboard
        value="x"
        copy={() => {}}
        timeout={200}
        label="Copia"
        copiedLabel="Copiato"
        size="small"
        variant="tonal"
      />,
    );
    const button = getByRole("button", { name: "Copia" });
    expect(StyleSheet.flatten(button.props.style)).toMatchObject({
      width: 32,
      height: 32,
    });
    await fireEvent.press(button);
    expect(getByRole("button", { name: "Copiato" })).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(queryByRole("button", { name: "Copiato" })).toBeNull();
  });

  it("is the 48 dp touch target unless told otherwise", async () => {
    const { getByRole } = await draw(<Clipboard value="x" copy={() => {}} />);
    expect(
      StyleSheet.flatten(getByRole("button", { name: "Copy" }).props.style),
    ).toMatchObject({ width: 48, height: 48 });
  });

  it("does nothing while disabled", async () => {
    const write = jest.fn();
    const { getByRole } = await draw(
      <Clipboard value="x" copy={write} disabled />,
    );
    expect(
      getByRole("button", { name: "Copy" }).props.accessibilityState,
    ).toMatchObject({ disabled: true });
    await fireEvent.press(getByRole("button", { name: "Copy" }));
    expect(write).not.toHaveBeenCalled();
  });

  it("on native draws nothing without a writer or an onCopy", async () => {
    const none = await draw(<Clipboard value="x" />);
    expect(none.queryByRole("button")).toBeNull();
    const custom = await draw(
      <Clipboard value="x">{() => <Text>hi</Text>}</Clipboard>,
    );
    expect(custom.queryByText("hi")).toBeNull();

    const withWriter = await draw(<Clipboard value="x" copy={() => {}} />);
    expect(withWriter.getByRole("button")).toBeTruthy();
    const withOnCopy = await draw(<Clipboard value="x" onCopy={() => {}} />);
    expect(withOnCopy.getByRole("button")).toBeTruthy();
  });

  it("on web needs neither", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboardApi({ writeText });
    const { getByRole } = await draw(<Clipboard value="abc" />);
    await fireEvent.press(getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith("abc");
    expect(getByRole("button", { name: "Copied" })).toBeTruthy();
  });

  it("a node as children is the content of the trigger", async () => {
    const write = jest.fn();
    const { getByRole, getByText } = await draw(
      <Clipboard value="invite-code" copy={write}>
        <Text>Share the code</Text>
      </Clipboard>,
    );
    expect(getByText("Share the code")).toBeTruthy();
    await fireEvent.press(getByRole("button", { name: "Copy" }));
    expect(write).toHaveBeenCalledWith("invite-code");
    expect(getByRole("button", { name: "Copied" })).toBeTruthy();
  });

  it("a function as children draws the whole trigger, with copied and a copy for the value", async () => {
    const write = jest.fn();
    const { getByText } = await draw(
      <Clipboard value="the value" copy={write}>
        {({ copied, copy }) => (
          <Text onPress={() => void copy()}>{copied ? "Done" : "Copy it"}</Text>
        )}
      </Clipboard>,
    );
    await fireEvent.press(getByText("Copy it"));
    expect(write).toHaveBeenCalledWith("the value");
    expect(getByText("Done")).toBeTruthy();
  });
});

describe("CaptionValue with a copy writer", () => {
  it("copies through the writer on native, no onCopy needed", async () => {
    const write = jest.fn();
    const { getByRole } = await draw(
      <CaptionValue caption="IBAN" value="IT60X" enableCopy copy={write} />,
    );
    await fireEvent.press(getByRole("button", { name: "Copy" }));
    expect(write).toHaveBeenCalledWith("IT60X");
    expect(getByRole("button", { name: "Copied" })).toBeTruthy();
  });

  it("reports the value after the writer succeeded", async () => {
    const onCopy = jest.fn();
    const { getByRole } = await draw(
      <CaptionValue
        caption="Order"
        value={4242}
        enableCopy
        copy={() => {}}
        onCopy={onCopy}
      />,
    );
    await fireEvent.press(getByRole("button", { name: "Copy" }));
    expect(onCopy).toHaveBeenCalledWith("4242");
  });

  it("a writer that fails leaves the button as it was", async () => {
    const onCopy = jest.fn();
    const { getByRole } = await draw(
      <CaptionValue
        caption="IBAN"
        value="x"
        enableCopy
        copy={() => Promise.reject(new Error("no"))}
        onCopy={onCopy}
      />,
    );
    await fireEvent.press(getByRole("button", { name: "Copy" }));
    expect(onCopy).not.toHaveBeenCalled();
    expect(getByRole("button", { name: "Copy" })).toBeTruthy();
  });
});

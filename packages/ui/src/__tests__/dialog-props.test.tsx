import React from "react";
import { Platform, StyleSheet, Text } from "react-native";
import { act, cleanup, fireEvent, render } from "@testing-library/react-native";
import {
  Alert,
  AlertProvider,
  Button,
  Dialog,
  ThemeProvider,
  palettes,
} from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

type Node = { type: string; props: Record<string, any> };
type Root = { queryAll: (predicate: (node: Node) => boolean) => Node[] };

const flat = (node: Node) => StyleSheet.flatten(node.props.style);
/** The dialog card: the only element marked as the modal view. */
const card = (container: Root) =>
  container.queryAll((n) => n.props.accessibilityViewIsModal === true)[0];
/** The props of react-native's Modal, which is where `onRequestClose` goes. */
const nativeModal = (container: Root) =>
  container.queryAll((n) => n.type === "Modal")[0];

type Listener = (event: unknown) => void;

/**
 * Makes the next renders run as the web: `Platform.OS` says so and there is a
 * `document` to listen on, which keeps the key listeners it is handed.
 * `restore` unmounts first, while the document is still there.
 */
const asWeb = () => {
  const original = Object.getOwnPropertyDescriptor(Platform, "OS")!;
  const listeners = new Map<string, Listener>();
  Object.defineProperty(Platform, "OS", {
    get: () => "web",
    configurable: true,
  });
  (globalThis as Record<string, unknown>).document = {
    addEventListener: (type: string, fn: Listener) => listeners.set(type, fn),
    removeEventListener: (type: string) => listeners.delete(type),
  };
  return {
    listeners,
    restore: async () => {
      await cleanup();
      Object.defineProperty(Platform, "OS", original);
      delete (globalThis as Record<string, unknown>).document;
    },
  };
};

describe("Dialog height", () => {
  it("gives the card a fixed height, in px or a percentage", async () => {
    const px = await draw(
      <Dialog visible title="T" height={320}>
        Body
      </Dialog>,
    );
    expect(flat(card(px.container)).height).toBe(320);
    const pct = await draw(
      <Dialog visible title="T" height="60%">
        Body
      </Dialog>,
    );
    expect(flat(card(pct.container)).height).toBe("60%");
  });

  it("has no fixed height by default", async () => {
    const { container } = await draw(
      <Dialog visible title="T">
        Body
      </Dialog>,
    );
    expect(flat(card(container)).height).toBeUndefined();
  });

  it("scrolls the body when the height is fixed", async () => {
    const scrolls = (ui: React.ReactElement) =>
      draw(ui).then(({ container }) =>
        container.queryAll((n) => n.type === "RCTScrollView"),
      );
    expect(
      await scrolls(
        <Dialog visible height={200}>
          Body
        </Dialog>,
      ),
    ).toHaveLength(1);
    expect(await scrolls(<Dialog visible>Body</Dialog>)).toHaveLength(0);
  });
});

describe("Dialog close icon", () => {
  it("shows a close icon while onClose is set, and it closes", async () => {
    const onClose = jest.fn();
    const { getByRole } = await draw(
      <Dialog visible title="T" onClose={onClose}>
        Body
      </Dialog>,
    );
    await fireEvent.press(getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("has no close icon without onClose", async () => {
    const { queryByRole } = await draw(
      <Dialog visible title="T">
        Body
      </Dialog>,
    );
    expect(queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("takes closeText as the icon's name", async () => {
    const { getByRole } = await draw(
      <Dialog visible title="T" onClose={() => {}} closeText="Chiudi">
        Body
      </Dialog>,
    );
    expect(getByRole("button", { name: "Chiudi" })).toBeTruthy();
  });

  it("closeIcon={false} hides it, and the text button stands in for it", async () => {
    const onClose = jest.fn();
    const { queryByRole, getByText } = await draw(
      <Dialog visible title="T" onClose={onClose} closeIcon={false}>
        Body
      </Dialog>,
    );
    // The only "Close" left is the text button, which has the same name.
    expect(queryByRole("button", { name: "Close" })).toBeTruthy();
    await fireEvent.press(getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closeIcon={false} with actions leaves no close control at all", async () => {
    const { queryByRole } = await draw(
      <Dialog
        visible
        title="T"
        onClose={() => {}}
        closeIcon={false}
        actions={<Text>Save</Text>}
      >
        Body
      </Dialog>,
    );
    expect(queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("shows the icon and not the text button by default, even with no actions", async () => {
    const { queryByText, getByRole } = await draw(
      <Dialog visible title="T" onClose={() => {}}>
        Body
      </Dialog>,
    );
    expect(getByRole("button", { name: "Close" })).toBeTruthy();
    expect(queryByText("Close")).toBeNull();
  });

  it("takes your own element as the icon", async () => {
    const onClose = jest.fn();
    const { getByText, getByRole } = await draw(
      <Dialog visible title="T" onClose={onClose} closeIcon={<Text>Done</Text>}>
        Body
      </Dialog>,
    );
    expect(getByText("Done")).toBeTruthy();
    await fireEvent.press(getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("is hidden in a full-screen dialog by closeIcon={false} too", async () => {
    const { queryByRole } = await draw(
      <Dialog visible fullScreen title="T" onClose={() => {}} closeIcon={false}>
        Body
      </Dialog>,
    );
    expect(queryByRole("button", { name: "Close" })).toBeNull();
  });
});

describe("Dialog dismissal", () => {
  it("passes onClose to Android back, unless disableEscapeKeyDown", async () => {
    const onClose = jest.fn();
    const open = await draw(
      <Dialog visible onClose={onClose}>
        Body
      </Dialog>,
    );
    nativeModal(open.container).props.onRequestClose();
    expect(onClose).toHaveBeenCalledTimes(1);

    const locked = await draw(
      <Dialog visible onClose={onClose} disableEscapeKeyDown>
        Body
      </Dialog>,
    );
    expect(nativeModal(locked.container).props.onRequestClose).toBeUndefined();
  });

  it("a backdrop press does not need disableEscapeKeyDown, and the reverse", async () => {
    const onClose = jest.fn();
    const { getByTestId } = await draw(
      <Dialog visible onClose={onClose} disableEscapeKeyDown>
        Body
      </Dialog>,
    );
    await fireEvent.press(
      getByTestId("dialog-scrim", { includeHiddenElements: true }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);

    const noBackdrop = await draw(
      <Dialog visible onClose={onClose} disableBackdropClick>
        Body
      </Dialog>,
    );
    // Back still closes.
    nativeModal(noBackdrop.container).props.onRequestClose();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  describe("Escape on the web", () => {
    let web: ReturnType<typeof asWeb>;
    let listeners: Map<string, Listener>;
    beforeEach(() => {
      web = asWeb();
      listeners = web.listeners;
    });
    afterEach(() => web.restore());

    const escape = () =>
      act(async () => {
        listeners.get("keydown")?.({ key: "Escape", preventDefault() {} });
      });

    it("closes the dialog", async () => {
      const onClose = jest.fn();
      await draw(
        <Dialog visible onClose={onClose}>
          Body
        </Dialog>,
      );
      await escape();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not listen at all with disableEscapeKeyDown", async () => {
      const onClose = jest.fn();
      await draw(
        <Dialog visible onClose={onClose} disableEscapeKeyDown>
          Body
        </Dialog>,
      );
      expect(listeners.has("keydown")).toBe(false);
      await escape();
      expect(onClose).not.toHaveBeenCalled();
    });

    it("does not listen while the dialog is closed", async () => {
      await draw(
        <Dialog visible={false} onClose={() => {}}>
          Body
        </Dialog>,
      );
      expect(listeners.has("keydown")).toBe(false);
    });
  });
});

describe("Dialog form", () => {
  it("submits through a submit button in the actions", async () => {
    const onSubmit = jest.fn();
    const { getByText } = await draw(
      <Dialog
        visible
        title="New"
        form
        onSubmit={onSubmit}
        actions={<Button type="submit">Save</Button>}
      >
        <Text>Field</Text>
      </Dialog>,
    );
    await fireEvent.press(getByText("Save"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("wraps both the content and the actions in the form", async () => {
    const { getByTestId } = await draw(
      <Dialog visible form actions={<Text>Save</Text>} testID="edit">
        <Text>Field</Text>
      </Dialog>,
    );
    const json = JSON.stringify(getByTestId("edit-form").children);
    expect(json).toContain("Field");
    expect(json).toContain("Save");
  });

  it("without form the actions are not in a form and a submit button does nothing", async () => {
    const onSubmit = jest.fn();
    const onClick = jest.fn();
    const { getByText, queryByTestId } = await draw(
      <Dialog
        visible
        onSubmit={onSubmit}
        actions={
          <Button type="submit" onClick={onClick}>
            Save
          </Button>
        }
      >
        <Text>Field</Text>
      </Dialog>,
    );
    expect(queryByTestId("dialog-form")).toBeNull();
    await fireEvent.press(getByText("Save"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("a plain button in the actions does not submit", async () => {
    const onSubmit = jest.fn();
    const { getByText } = await draw(
      <Dialog
        visible
        form
        onSubmit={onSubmit}
        actions={<Button onClick={() => {}}>Cancel</Button>}
      >
        <Text>Field</Text>
      </Dialog>,
    );
    await fireEvent.press(getByText("Cancel"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("puts the whole full-screen dialog, header included, in the form", async () => {
    const onSubmit = jest.fn();
    const { getByText } = await draw(
      <Dialog
        visible
        fullScreen
        form
        title="New"
        onSubmit={onSubmit}
        actions={<Button type="submit">Save</Button>}
      >
        <Text>Field</Text>
      </Dialog>,
    );
    await fireEvent.press(getByText("Save"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("Dialog slotStyles", () => {
  const colours = palettes.baseline.light;
  const marker = (name: string) => ({ paddingVertical: name.length + 41 });

  it("merges each slot after the component's own styles", async () => {
    const { container, getByText, getByTestId } = await draw(
      <Dialog
        visible
        title="Title"
        actions={<Text>Save</Text>}
        slotStyles={{
          backdrop: { backgroundColor: "#010203" },
          container: { backgroundColor: "#040506" },
          title: { color: "#070809" },
        }}
      >
        Body
      </Dialog>,
    );
    // Each overrides a colour the component sets itself.
    expect(
      flat(
        getByTestId("dialog-scrim", { includeHiddenElements: true }) as never,
      ).backgroundColor,
    ).toBe("#010203");
    expect(flat(card(container)).backgroundColor).toBe("#040506");
    expect(flat(getByText("Title") as never).color).toBe("#070809");
  });

  it("styles the header, the content and the actions", async () => {
    const { toJSON } = await draw(
      <Dialog
        visible
        title="Title"
        actions={<Text>Save</Text>}
        slotStyles={{
          header: marker("header"),
          content: marker("content"),
          actions: marker("actions"),
        }}
      >
        Body
      </Dialog>,
    );
    const out = JSON.stringify(toJSON());
    for (const name of ["header", "content", "actions"]) {
      expect(out).toContain(`"paddingVertical":${name.length + 41}`);
    }
  });

  it("leaves the component's own look without slotStyles", async () => {
    const { container } = await draw(
      <Dialog visible title="Title">
        Body
      </Dialog>,
    );
    expect(flat(card(container)).backgroundColor).toBe(
      colours.surfaceContainer,
    );
  });
});

describe("Alert on the web", () => {
  let web: ReturnType<typeof asWeb>;
  beforeEach(() => {
    web = asWeb();
  });
  afterEach(() => web.restore());

  it("opens a dialog with the message and runs the pressed button", async () => {
    const onPress = jest.fn();
    const { getByText, queryByText } = await draw(
      <AlertProvider>
        <Text>App</Text>
      </AlertProvider>,
    );
    await act(async () => {
      Alert("Delete file", "This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress },
      ]);
    });
    expect(getByText("Delete file")).toBeTruthy();
    expect(getByText("This cannot be undone.")).toBeTruthy();

    await fireEvent.press(getByText("Delete"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(queryByText("Delete file")).toBeNull();
  });

  it("falls back to a single OK", async () => {
    const { getByText, queryByText } = await draw(
      <AlertProvider>
        <Text>App</Text>
      </AlertProvider>,
    );
    await act(async () => {
      Alert("Saved");
    });
    await fireEvent.press(getByText("OK"));
    expect(queryByText("Saved")).toBeNull();
  });
});

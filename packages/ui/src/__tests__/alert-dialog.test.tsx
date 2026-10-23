import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { AlertDialog, Dialog, ThemeProvider, useTheme } from "..";
import type { Theme } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

type Node = { type: string; props: Record<string, any> };
type Root = { queryAll: (predicate: (node: Node) => boolean) => Node[] };

const flat = (node: Node) => StyleSheet.flatten(node.props.style);
/** The dialog card: the only element marked as the modal view. */
const card = (container: Root) =>
  container.queryAll((n) => n.props.accessibilityViewIsModal === true)[0];
const nativeModal = (container: Root) =>
  container.queryAll((n) => n.type === "Modal")[0];

/** The theme a test renders under, to compare colours with its tokens. */
const themeOf = async (): Promise<Theme> => {
  let seen!: Theme;
  const Probe = () => {
    seen = useTheme().theme;
    return null;
  };
  await draw(<Probe />);
  return seen;
};

describe("AlertDialog", () => {
  it("shows the title, the message and a single OK action", async () => {
    const onAction = jest.fn();
    const view = await draw(
      <AlertDialog
        visible
        title="Saved"
        message="Your changes are in."
        onAction={onAction}
      />,
    );
    expect(view.getByText("Saved")).toBeTruthy();
    expect(view.getByText("Your changes are in.")).toBeTruthy();
    await fireEvent.press(view.getByRole("button", { name: "OK" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    // One action only, and no close icon: the buttons are the way out.
    expect(view.getAllByRole("button")).toHaveLength(1);
  });

  it("draws nothing while not visible", async () => {
    const view = await draw(<AlertDialog visible={false} title="Hidden" />);
    expect(view.queryByText("Hidden")).toBeNull();
  });

  it("draws no secondary action for an empty cancelText", async () => {
    const view = await draw(<AlertDialog visible title="T" cancelText="" />);
    expect(view.getAllByRole("button")).toHaveLength(1);
  });

  it("adds a secondary action before the primary one when cancelText is given", async () => {
    const onAction = jest.fn();
    const onCancel = jest.fn();
    const view = await draw(
      <AlertDialog
        visible
        title="Delete?"
        actionText="Delete"
        cancelText="Keep"
        onAction={onAction}
        onCancel={onCancel}
      />,
    );
    expect(view.getAllByRole("button")).toHaveLength(2);
    // Keep comes first in the tree, so it is the first thing keyboard focus meets.
    const order = view.getAllByRole("button").map((b) => b.props.testID);
    expect(order).toEqual(["alert-dialog-cancel", "alert-dialog-action"]);

    await fireEvent.press(view.getByText("Keep"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await fireEvent.press(view.getByText("Delete"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("takes children as the body: a string, or any node", async () => {
    const text = await draw(
      <AlertDialog visible title="T">
        Plain words
      </AlertDialog>,
    );
    expect(text.getByText("Plain words")).toBeTruthy();
    const node = await draw(
      <AlertDialog visible title="T" message="Lead">
        <Text testID="extra">More</Text>
      </AlertDialog>,
    );
    expect(node.getByText("Lead")).toBeTruthy();
    expect(node.getByTestId("extra")).toBeTruthy();
  });

  it("paints the primary action in the error tone when destructive", async () => {
    const theme = await themeOf();
    const plain = await draw(<AlertDialog visible title="T" />);
    const danger = await draw(<AlertDialog visible title="T" destructive />);
    const bg = (view: typeof plain) =>
      JSON.stringify(
        flat(view.getByTestId("alert-dialog-action") as unknown as Node),
      );
    expect(bg(danger)).toContain(theme.colors.error);
    expect(bg(plain)).not.toContain(theme.colors.error);
  });
});

describe("AlertDialog severity", () => {
  it.each(["info", "success", "warning", "error"] as const)(
    "draws the %s icon in the colour of its status role",
    async (severity) => {
      const theme = await themeOf();
      const view = await draw(
        <AlertDialog visible title="T" severity={severity} />,
      );
      const coloured = view.container.queryAll(
        (n) =>
          n.type === "Text" &&
          JSON.stringify(n.props.style ?? "").includes(theme.colors[severity]),
      );
      // The glyph, in the status colour; no other text is drawn in it.
      expect(coloured.length).toBeGreaterThan(0);
    },
  );

  it("has no icon by default", async () => {
    const theme = await themeOf();
    const view = await draw(<AlertDialog visible title="T" message="M" />);
    const glyphs = view.container.queryAll(
      (n) =>
        n.type === "Text" &&
        [theme.colors.info, theme.colors.success, theme.colors.warning].some(
          (c) => JSON.stringify(n.props.style ?? "").includes(c),
        ),
    );
    expect(glyphs).toHaveLength(0);
  });
});

describe("AlertDialog accessibility", () => {
  it("is an alertdialog named by its title and described by its body", async () => {
    const view = await draw(
      <AlertDialog visible title="Delete?" message="This cannot be undone." />,
    );
    const alert = view.container.queryAll(
      (n) => n.props.role === "alertdialog",
    )[0];
    expect(alert).toBeDefined();
    const byId = (id: string) =>
      view.container.queryAll((n) => n.props.nativeID === id);
    const labelledBy = alert.props["aria-labelledby"];
    const describedBy = alert.props["aria-describedby"];
    expect(labelledBy).toBeTruthy();
    expect(describedBy).toBeTruthy();
    expect(byId(labelledBy)[0].props.accessibilityRole).toBe("header");
    expect(byId(describedBy)).toHaveLength(1);
  });

  it("a plain Dialog keeps no role of its own", async () => {
    const view = await draw(
      <Dialog visible title="T">
        Body
      </Dialog>,
    );
    expect(card(view.container).props.role).toBeUndefined();
    expect(
      view.container.queryAll((n) => n.props.nativeID !== undefined),
    ).toHaveLength(0);
  });
});

describe("AlertDialog dismissal", () => {
  it("ignores the backdrop and Escape/back by default", async () => {
    const onCancel = jest.fn();
    const view = await draw(
      <AlertDialog visible title="T" cancelText="No" onCancel={onCancel} />,
    );
    await fireEvent.press(
      view.getByTestId("alert-dialog-scrim", { includeHiddenElements: true }),
    );
    nativeModal(view.container).props.onRequestClose?.();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("lets either go through to onCancel when turned off", async () => {
    const onCancel = jest.fn();
    const view = await draw(
      <AlertDialog
        visible
        title="T"
        onCancel={onCancel}
        disableBackdropClick={false}
        disableEscapeKeyDown={false}
      />,
    );
    await fireEvent.press(
      view.getByTestId("alert-dialog-scrim", { includeHiddenElements: true }),
    );
    expect(onCancel).toHaveBeenCalledTimes(1);
    nativeModal(view.container).props.onRequestClose();
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("stays put while loading: the action is busy, the secondary is off, nothing dismisses it", async () => {
    const onAction = jest.fn();
    const onCancel = jest.fn();
    const view = await draw(
      <AlertDialog
        visible
        title="Saving"
        loading
        cancelText="Cancel"
        onAction={onAction}
        onCancel={onCancel}
        disableBackdropClick={false}
        disableEscapeKeyDown={false}
      />,
    );
    const action = view.getByTestId("alert-dialog-action");
    expect(action.props.accessibilityState).toMatchObject({ busy: true });
    await fireEvent.press(action);
    await fireEvent.press(view.getByTestId("alert-dialog-cancel"));
    await fireEvent.press(
      view.getByTestId("alert-dialog-scrim", { includeHiddenElements: true }),
    );
    expect(nativeModal(view.container).props.onRequestClose).toBeUndefined();
    expect(onAction).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(view.getByText("Saving")).toBeTruthy();
  });

  it("takes slotStyles and a testID", async () => {
    const view = await draw(
      <AlertDialog
        visible
        title="T"
        testID="gone"
        slotStyles={{ container: { borderWidth: 3 } }}
      />,
    );
    expect(view.getByTestId("gone")).toBeTruthy();
    expect(flat(card(view.container)).borderWidth).toBe(3);
    expect(view.getByTestId("gone-action")).toBeTruthy();
  });
});

describe("Dialog initialFocus", () => {
  const asWeb = () => jest.replaceProperty(Platform, "OS", "web");
  afterEach(() => {
    jest.restoreAllMocks();
    delete (View.prototype as unknown as Record<string, unknown>).querySelector;
  });

  it("focuses the first control of the actions row once the modal is shown, on the web", async () => {
    asWeb();
    const focus = jest.fn();
    const query = jest.fn(() => ({ focus }));
    (View.prototype as unknown as Record<string, unknown>).querySelector =
      query;
    const view = await draw(
      <Dialog
        visible
        title="T"
        initialFocus="actions"
        actions={<Text>Go</Text>}
      >
        Body
      </Dialog>,
    );
    await act(async () => nativeModal(view.container).props.onShow());
    expect(query).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("leaves focus to the modal by default, and on native", async () => {
    const auto = await draw(
      <Dialog visible title="T" actions={<Text>Go</Text>}>
        Body
      </Dialog>,
    );
    expect(nativeModal(auto.container).props.onShow).toBeUndefined();

    const query = jest.fn();
    (View.prototype as unknown as Record<string, unknown>).querySelector =
      query;
    const native = await draw(
      <Dialog
        visible
        title="T"
        initialFocus="actions"
        actions={<Text>Go</Text>}
      >
        Body
      </Dialog>,
    );
    await act(async () => nativeModal(native.container).props.onShow());
    expect(query).not.toHaveBeenCalled();
  });

  it("an AlertDialog asks for it", async () => {
    const view = await draw(<AlertDialog visible title="T" />);
    expect(nativeModal(view.container).props.onShow).toBeDefined();
  });
});

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { Menu, Popover, ThemeProvider, palettes, type MenuItem } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

type Node = { type: string; props: Record<string, any> };
const flat = (node: Node) => StyleSheet.flatten(node.props.style) ?? {};

const anchor = <Text>Anchor</Text>;
const colours = palettes.baseline.light;

const items = (...overrides: Partial<MenuItem>[]): MenuItem[] =>
  ["Edit", "Copy", "Delete"].map((label, i) => ({
    id: label.toLowerCase(),
    label,
    ...overrides[i],
  }));

describe("Menu", () => {
  it("shows its items only while visible", async () => {
    const closed = await draw(
      <Menu
        visible={false}
        anchor={anchor}
        items={items()}
        onClose={() => {}}
      />,
    );
    expect(closed.queryByText("Edit")).toBeNull();
    const open = await draw(
      <Menu visible anchor={anchor} items={items()} onClose={() => {}} />,
    );
    expect(open.getByText("Edit")).toBeTruthy();
  });

  it("runs the item's onClick, then the menu's onClick with the item, after closing", async () => {
    const order: string[] = [];
    const list = items({ onClick: () => order.push("item") });
    const { getByText } = await draw(
      <Menu
        visible
        anchor={anchor}
        items={list}
        onClose={() => order.push("close")}
        onClick={(item) => order.push(`menu:${item.id}`)}
      />,
    );
    await fireEvent.press(getByText("Edit"));
    expect(order).toEqual(["close", "item", "menu:edit"]);
  });

  it("an item needs no onClick of its own", async () => {
    const onClick = jest.fn();
    const { getByText } = await draw(
      <Menu
        visible
        anchor={anchor}
        items={items()}
        onClose={() => {}}
        onClick={onClick}
      />,
    );
    await fireEvent.press(getByText("Copy"));
    expect(onClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "copy" }),
    );
  });

  it("stays open with closeOnSelect={false}", async () => {
    const onClose = jest.fn();
    const onClick = jest.fn();
    const { getByText } = await draw(
      <Menu
        visible
        anchor={anchor}
        items={items()}
        closeOnSelect={false}
        onClose={onClose}
        onClick={onClick}
      />,
    );
    await fireEvent.press(getByText("Edit"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("a disabled item does nothing", async () => {
    const onClick = jest.fn();
    const onClose = jest.fn();
    const { getByText } = await draw(
      <Menu
        visible
        anchor={anchor}
        items={items({ disabled: true, onClick })}
        onClose={onClose}
        onClick={onClick}
      />,
    );
    await fireEvent.press(getByText("Edit"));
    expect(onClick).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  describe("selected", () => {
    const rows = async (selected?: string[]) => {
      const { getByRole } = await draw(
        <Menu
          visible
          anchor={anchor}
          items={items()}
          selected={selected}
          onClose={() => {}}
        />,
      );
      return (name: string) => getByRole("button", { name });
    };

    it("marks the items whose id is in the array, and only those", async () => {
      const row = await rows(["copy", "delete"]);
      expect(row("Edit").props.accessibilityState.selected).toBe(false);
      expect(row("Copy").props.accessibilityState.selected).toBe(true);
      expect(row("Delete").props.accessibilityState.selected).toBe(true);
    });

    it("tints the selected rows", async () => {
      const row = await rows(["copy"]);
      expect(flat(row("Copy")).backgroundColor).toBe(
        colours.secondaryContainer,
      );
      expect(flat(row("Edit")).backgroundColor).toBe("transparent");
    });

    it("draws a check mark on a selected row only", async () => {
      const marks = async (selected?: string[]) => {
        const { container } = await draw(
          <Menu
            visible
            anchor={anchor}
            items={items()}
            selected={selected}
            onClose={() => {}}
          />,
        );
        // The check is the only 18 px glyph in the menu.
        return container.queryAll(
          (n) =>
            n.type === "Text" &&
            flat(n).fontFamily === "material-community" &&
            flat(n).fontSize === 18,
        ).length;
      };
      expect(await marks()).toBe(0);
      expect(await marks([])).toBe(0);
      expect(await marks(["edit", "copy"])).toBe(2);
    });

    it("does not mark anything until `selected` is passed", async () => {
      const row = await rows();
      expect(row("Edit").props.accessibilityState.selected).toBeUndefined();
      const empty = await rows([]);
      expect(empty("Edit").props.accessibilityState.selected).toBe(false);
    });
  });

  describe("dividers", () => {
    const rules = async (props: Partial<React.ComponentProps<typeof Menu>>) => {
      const { container } = await draw(
        <Menu
          visible
          anchor={anchor}
          items={items()}
          onClose={() => {}}
          {...props}
        />,
      );
      return container.queryAll((n) => {
        const style = flat(n);
        return (
          style.backgroundColor === colours.outlineVariant && style.height === 1
        );
      }).length;
    };

    it("has none by default", async () => {
      expect(await rules({})).toBe(0);
    });

    it("draws a line between each pair of items", async () => {
      expect(await rules({ dividers: true })).toBe(2);
    });

    it("keeps dividerAbove on its own", async () => {
      expect(await rules({ items: items({}, { dividerAbove: true }) })).toBe(1);
    });

    it("does not double a line where dividerAbove meets dividers", async () => {
      expect(
        await rules({
          dividers: true,
          items: items({}, { dividerAbove: true }),
        }),
      ).toBe(2);
    });
  });
});

describe("Popover anchorPosition", () => {
  // The test renderer cannot measure, so give the anchor a rect and the card
  // a size, and read where the popover is placed.
  const proto = (View as unknown as { prototype: Record<string, any> })
    .prototype;
  const original = proto.measureInWindow;

  beforeEach(() => {
    proto.measureInWindow = (cb: (...rect: number[]) => void) =>
      cb(300, 200, 100, 40);
  });
  afterEach(() => {
    proto.measureInWindow = original;
  });

  const place = async (anchorPosition?: {
    vertical: "top" | "center" | "bottom";
    horizontal: "left" | "center" | "right";
  }) => {
    const { container } = await draw(
      <Popover
        visible
        anchor={anchor}
        onDismiss={() => {}}
        anchorPosition={anchorPosition}
      >
        <Text>Content</Text>
      </Popover>,
    );
    const card = container.queryAll(
      (n) => flat(n).position === "absolute" && flat(n).borderRadius === 12,
    )[0];
    // The card reports 199 px (the popover adds one) by 100 px.
    await fireEvent(card, "layout", {
      nativeEvent: { layout: { width: 199, height: 100 } },
    });
    const placed = container.queryAll(
      (n) => flat(n).position === "absolute" && flat(n).borderRadius === 12,
    )[0];
    return flat(placed);
  };

  it("sits below the anchor, left edges aligned, by default", async () => {
    expect(await place()).toMatchObject({ top: 248, left: 300 });
  });

  it("aligns the right edges, or the centres", async () => {
    expect(
      await place({ vertical: "bottom", horizontal: "right" }),
    ).toMatchObject({ top: 248, left: 200 });
    expect(
      await place({ vertical: "bottom", horizontal: "center" }),
    ).toMatchObject({ top: 248, left: 250 });
  });

  it("stands above the anchor with vertical top", async () => {
    const style = await place({ vertical: "top", horizontal: "left" });
    expect(style.top).toBeUndefined();
    expect(style.bottom).toBe(1334 - 200 + 8);
  });

  it("is centred on the anchor with vertical center", async () => {
    expect(
      await place({ vertical: "center", horizontal: "left" }),
    ).toMatchObject({ top: 170, left: 300 });
  });

  it("Menu hands its anchorPosition to the popover", async () => {
    const { container } = await draw(
      <Menu
        visible
        anchor={anchor}
        items={items()}
        onClose={() => {}}
        anchorPosition={{ vertical: "top", horizontal: "right" }}
      />,
    );
    const card = container.queryAll(
      (n) => flat(n).position === "absolute" && flat(n).borderRadius === 12,
    )[0];
    await fireEvent(card, "layout", {
      nativeEvent: { layout: { width: 199, height: 100 } },
    });
    const placed = flat(
      container.queryAll(
        (n) => flat(n).position === "absolute" && flat(n).borderRadius === 12,
      )[0],
    );
    expect(placed.top).toBeUndefined();
    expect(placed.left).toBe(200);
  });
});

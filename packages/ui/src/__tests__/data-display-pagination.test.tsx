import React from "react";
import { Platform, StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { Pagination, ThemeProvider, useTheme, type Theme } from "..";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

const json = async (ui: React.ReactElement) =>
  JSON.stringify((await draw(ui)).toJSON());

const themeOf = async () => {
  let theme: Theme | undefined;
  const Probe = () => {
    theme = useTheme().theme;
    return null;
  };
  await draw(<Probe />);
  return theme as unknown as Theme;
};

describe("Pagination", () => {
  it("marks activePage and reports the page picked through onChange", async () => {
    const onChange = jest.fn();
    const { getByRole } = await draw(
      <Pagination activePage={2} totalPages={5} onChange={onChange} />,
    );
    expect(
      getByRole("button", { name: "Page 2" }).props.accessibilityState,
    ).toMatchObject({ selected: true });
    await fireEvent.press(getByRole("button", { name: "Page 4" }));
    expect(onChange).toHaveBeenLastCalledWith(4);
    await fireEvent.press(getByRole("button", { name: "Next page" }));
    expect(onChange).toHaveBeenLastCalledWith(3);
    await fireEvent.press(getByRole("button", { name: "Previous page" }));
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("keeps the current page focusable: selected, not disabled, and a press is a no-op", async () => {
    const onChange = jest.fn();
    const { getByRole, getByLabelText } = await draw(
      <Pagination activePage={2} totalPages={5} onChange={onChange} />,
    );
    const current = getByRole("button", { name: "Page 2" });
    expect(current.props.accessibilityState?.disabled).toBeFalsy();
    await fireEvent.press(current);
    expect(onChange).not.toHaveBeenCalled();
    // A pager is navigation, not a menubar of menu items.
    expect(getByLabelText("Pagination").props.role).toBe("navigation");
  });

  it.each([1, 2])(
    "keeps the same number of slots on every page (siblingCount %i), so the row never jumps",
    async (siblingCount) => {
      const counts = new Set<number>();
      for (let page = 1; page <= 20; page++) {
        const view = await draw(
          <Pagination
            activePage={page}
            totalPages={20}
            siblingCount={siblingCount}
            onChange={() => {}}
          />,
        );
        const pages = view.getAllByRole("button", { name: /^Page \d+$/ });
        const gaps = view.queryAllByText("…");
        counts.add(pages.length + gaps.length);
        // The first, the last and the current page are always there.
        for (const n of [1, page, 20])
          expect(view.getByRole("button", { name: `Page ${n}` })).toBeTruthy();
        await view.unmount();
      }
      expect([...counts]).toEqual([siblingCount * 2 + 5]);
    },
  );

  it("marks the current page aria-current on the web", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    const { getByRole } = await draw(
      <Pagination activePage={2} totalPages={5} onChange={() => {}} />,
    );
    expect(getByRole("button", { name: "Page 2" }).props["aria-current"]).toBe(
      "page",
    );
    expect(
      getByRole("button", { name: "Page 3" }).props["aria-current"],
    ).toBeUndefined();
  });

  it("disables the arrows at the ends, and everything with disabled", async () => {
    const onChange = jest.fn();
    const ends = await draw(
      <Pagination activePage={1} totalPages={3} onChange={onChange} />,
    );
    await fireEvent.press(ends.getByRole("button", { name: "Previous page" }));
    expect(onChange).not.toHaveBeenCalled();

    const off = await draw(
      <Pagination activePage={2} totalPages={5} onChange={onChange} disabled />,
    );
    await fireEvent.press(off.getByRole("button", { name: "Page 4" }));
    await fireEvent.press(off.getByRole("button", { name: "Next page" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each([
    ["sm", 32],
    ["md", 40],
    ["lg", 48],
  ] as const)("draws %s buttons %i px square", async (size, box) => {
    const out = await json(
      <Pagination
        activePage={1}
        totalPages={3}
        onChange={() => {}}
        size={size}
      />,
    );
    expect(out).toContain(`"width":${box}`);
    expect(out).toContain(`"height":${box}`);
    if (size !== "md") expect(out).not.toContain('"width":40');
  });

  it("sizes the type with the buttons", async () => {
    const fontSize = async (size: "sm" | "md" | "lg") => {
      const { getByText } = await draw(
        <Pagination
          activePage={1}
          totalPages={3}
          onChange={() => {}}
          size={size}
        />,
      );
      return StyleSheet.flatten(getByText("1").props.style).fontSize;
    };
    const [sm, md, lg] = [
      await fontSize("sm"),
      await fontSize("md"),
      await fontSize("lg"),
    ];
    expect(sm).toBeLessThan(lg);
    expect(md).toBeGreaterThanOrEqual(sm);
  });

  it("draws rounded squares by default and circles for circular", async () => {
    const theme = await themeOf();
    const rounded = await json(
      <Pagination activePage={1} totalPages={3} onChange={() => {}} />,
    );
    expect(rounded).toContain(`"borderRadius":${theme.shape.small}`);
    expect(rounded).not.toContain('"borderRadius":20');
    const circular = await json(
      <Pagination
        activePage={1}
        totalPages={3}
        onChange={() => {}}
        variant="circular"
        size="lg"
      />,
    );
    expect(circular).toContain('"borderRadius":24');
  });

  it("paints the selected page in the colour role", async () => {
    const theme = await themeOf();
    const out = await json(
      <Pagination
        activePage={1}
        totalPages={3}
        onChange={() => {}}
        color="error"
      />,
    );
    expect(out).toContain(`"backgroundColor":"${theme.colors.error}"`);
    expect(out).toContain(`"color":"${theme.colors.onError}"`);
    const normal = await json(
      <Pagination activePage={1} totalPages={3} onChange={() => {}} />,
    );
    expect(normal).toContain(`"backgroundColor":"${theme.colors.primary}"`);
  });

  it("keeps showFirstLast and siblingCount", async () => {
    const { getByRole, getAllByText } = await draw(
      <Pagination
        activePage={10}
        totalPages={20}
        onChange={() => {}}
        showFirstLast
        siblingCount={2}
      />,
    );
    expect(getByRole("button", { name: "First page" })).toBeTruthy();
    expect(getByRole("button", { name: "Last page" })).toBeTruthy();
    expect(getByRole("button", { name: "Page 12" })).toBeTruthy();
    expect(getAllByText("…")).toHaveLength(2);
  });
});

describe("Pagination pageSelect", () => {
  const open = async (props: { totalPages: number; activePage?: number }) => {
    const onChange = jest.fn();
    const view = await draw(
      <Pagination
        activePage={props.activePage ?? 1}
        totalPages={props.totalPages}
        onChange={onChange}
        pageSelect
      />,
    );
    await fireEvent.press(view.getByRole("button", { name: "Select page" }));
    return { ...view, onChange };
  };

  it("shows no select unless asked", async () => {
    const { queryByRole } = await draw(
      <Pagination activePage={1} totalPages={5} onChange={() => {}} />,
    );
    expect(queryByRole("button", { name: "Select page" })).toBeNull();
  });

  it("opens a searchable list and jumps to the page picked", async () => {
    const { getByRole, getAllByRole, getByLabelText, onChange } = await open({
      totalPages: 25,
    });
    expect(getAllByRole("menuitem")).toHaveLength(25);
    // Digits narrow the list to the pages that contain them.
    await fireEvent.changeText(getByLabelText("Search page"), "1");
    const pages = getAllByRole("menuitem").map(
      (n) => n.props.accessibilityLabel,
    );
    expect(pages).toEqual([
      "Page 1",
      "Page 10",
      "Page 11",
      "Page 12",
      "Page 13",
      "Page 14",
      "Page 15",
      "Page 16",
      "Page 17",
      "Page 18",
      "Page 19",
      "Page 21",
    ]);
    await fireEvent.press(getByRole("menuitem", { name: "Page 12" }));
    expect(onChange).toHaveBeenCalledWith(12);
    // Picking closes it.
    expect(() => getByLabelText("Search page")).toThrow();
  });

  it("ignores what is not a digit, says when nothing matches, and picks the first match on submit", async () => {
    const { getByLabelText, getByText, queryAllByRole, onChange } = await open({
      totalPages: 30,
    });
    const input = getByLabelText("Search page");
    await fireEvent.changeText(input, "abc");
    expect(input.props.value).toBe("");
    await fireEvent.changeText(input, "99");
    expect(queryAllByRole("menuitem")).toHaveLength(0);
    expect(getByText("No page found")).toBeTruthy();
    await fireEvent.changeText(input, "2");
    await fireEvent(input, "submitEditing");
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("stays usable with a thousand pages: it lists a few, and the search finds the rest", async () => {
    const { getAllByRole, getByText, getByLabelText, getByRole, onChange } =
      await open({ totalPages: 1000, activePage: 500 });
    expect(getAllByRole("menuitem")).toHaveLength(50);
    expect(getByText("Type to narrow 1000 pages")).toBeTruthy();
    await fireEvent.changeText(getByLabelText("Search page"), "999");
    expect(getAllByRole("menuitem")).toHaveLength(1);
    await fireEvent.press(getByRole("menuitem", { name: "Page 999" }));
    expect(onChange).toHaveBeenCalledWith(999);
  });

  it("closes without a change when the active page is picked again", async () => {
    const { getByRole, onChange, queryByLabelText } = await open({
      totalPages: 5,
      activePage: 3,
    });
    expect(
      getByRole("menuitem", { name: "Page 3" }).props.accessibilityState,
    ).toMatchObject({ selected: true });
    await fireEvent.press(getByRole("menuitem", { name: "Page 3" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(queryByLabelText("Search page")).toBeNull();
  });

  it("does not open when disabled", async () => {
    const { getByRole, queryByLabelText } = await draw(
      <Pagination
        activePage={1}
        totalPages={5}
        onChange={() => {}}
        pageSelect
        disabled
      />,
    );
    await fireEvent.press(getByRole("button", { name: "Select page" }));
    expect(queryByLabelText("Search page")).toBeNull();
  });
});

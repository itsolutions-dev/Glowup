import React, { type ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";

import IconsPage from "../app/icons";
import { ComponentRegistry } from "../catalogue/registry";
import { IconGrid } from "../site/IconGrid";
import { IconPicker } from "../site/IconPicker";
import { PropControls } from "../site/PropControls";
import {
  ICON_NAMES,
  OUTLINED_PAIRS,
  codepointOf,
  filterByStyle,
  isIconName,
  searchIcons,
  styleOf,
} from "../site/iconCatalog";

jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));

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

describe("icon catalogue", () => {
  it("holds the whole font", () => {
    expect(ICON_NAMES.length).toBeGreaterThan(7000);
    expect(isIconName("account-circle-outline")).toBe(true);
    expect(isIconName("not-an-icon")).toBe(false);
    expect(isIconName(undefined)).toBe(false);
    expect(codepointOf("home")).toMatch(/^[0-9A-F]+$/);
  });

  it("returns every name for an empty search", () => {
    expect(searchIcons("  ")).toHaveLength(ICON_NAMES.length);
  });

  it("puts the exact name first, then names that start with it, then the rest", () => {
    const [first, second, ...rest] = searchIcons("home");
    expect(first).toBe("home");
    expect(second.startsWith("home")).toBe(true);
    expect(rest.length).toBeGreaterThan(10);
    // Words in any order and any separator reach the same icon.
    expect(searchIcons("arrow left")).toContain("arrow-left");
    expect(searchIcons("left-arrow")).toContain("arrow-left");
    // A word inside another word is a weaker match than a word of the name.
    expect(searchIcons("circ")[0]).not.toBe("");
    expect(searchIcons("zzzzzz")).toEqual([]);
  });

  it("knows which icons come in a filled and an outline pair", () => {
    expect(OUTLINED_PAIRS).toContain("star");
    expect(OUTLINED_PAIRS).not.toContain("star-outline");
    const single = ICON_NAMES.find(
      (name) => !name.endsWith("-outline") && !OUTLINED_PAIRS.includes(name),
    ) as string;
    expect(isIconName(`${single}-outline`)).toBe(false);
  });
});

describe("IconGrid", () => {
  it("shows the names and reports the pressed one", async () => {
    const onSelect = jest.fn();
    await render(
      <Providers>
        <IconGrid
          names={["home", "camera", "star"]}
          selected="camera"
          onSelect={onSelect}
          height={300}
        />
      </Providers>,
    );
    expect(screen.getByText("camera")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "camera" }).props.accessibilityState,
    ).toMatchObject({ selected: true });
    await fireEvent.press(screen.getByRole("button", { name: "star" }));
    expect(onSelect).toHaveBeenCalledWith("star");
  });

  it("says so when nothing matches", async () => {
    await render(
      <Providers>
        <IconGrid
          names={[]}
          onSelect={jest.fn()}
          height={300}
          emptyText="Nothing here"
        />
      </Providers>,
    );
    expect(screen.getByText("Nothing here")).toBeTruthy();
  });
});

describe("IconPicker", () => {
  it("searches the font and hands back the choice", async () => {
    const onSelect = jest.fn();
    await render(
      <Providers>
        <IconPicker visible onClose={jest.fn()} onSelect={onSelect} />
      </Providers>,
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText(/Search [\d,]+ icons/),
      "camera-flip",
    );
    await fireEvent.press(screen.getByRole("button", { name: "camera-flip" }));
    expect(onSelect).toHaveBeenCalledWith("camera-flip");
  });

  it("offers to clear the icon only when it may be left out", async () => {
    const onSelect = jest.fn();
    const { rerender } = await render(
      <Providers>
        <IconPicker visible onClose={jest.fn()} onSelect={onSelect} />
      </Providers>,
    );
    expect(screen.queryByText("No icon")).toBeNull();
    await rerender(
      <Providers>
        <IconPicker
          visible
          allowClear
          onClose={jest.fn()}
          onSelect={onSelect}
        />
      </Providers>,
    );
    await fireEvent.press(screen.getByRole("button", { name: "No icon" }));
    expect(onSelect).toHaveBeenCalledWith("");
  });
});

describe("the icon control", () => {
  const meta = {
    name: "Probe",
    Component: () => null,
    props: {
      iconName: { type: "icon", default: "", label: "Icon Name" },
    },
  } as never;

  it("opens the search from the field and writes the chosen name", async () => {
    const onChange = jest.fn();
    await render(
      <Providers>
        <PropControls
          meta={meta}
          values={{ iconName: "" }}
          onChange={onChange}
          onReset={jest.fn()}
        />
      </Providers>,
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Search icons for Icon Name" }),
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText(/Search [\d,]+ icons/),
      "camera-flip",
    );
    await fireEvent.press(screen.getByRole("button", { name: "camera-flip" }));
    expect(onChange).toHaveBeenCalledWith("iconName", "camera-flip");
  });

  it("is what every icon prop of the catalogue uses", () => {
    // A glyph name typed by hand is a guess; the search is the control. A prop
    // named like an icon that is a plain text field would be one more guess.
    const plain = Object.entries(ComponentRegistry).flatMap(([name, entry]) =>
      Object.entries(entry.props)
        .filter(
          ([key, definition]) =>
            /icon|glyph/i.test(key) && definition.type === "text",
        )
        .map(([key]) => `${name}.${key}`),
    );
    expect(plain).toEqual([]);
  });
});

describe("the icons page", () => {
  const draw = () =>
    render(
      <Providers>
        <IconsPage />
      </Providers>,
    );
  const search = (text: string) =>
    fireEvent.changeText(
      screen.getByPlaceholderText(/Search [\d,]+ icons/),
      text,
    );

  it("opens the pressed icon in a dialog, with its details and a copy button", async () => {
    await draw();
    await search("camera-flip");
    expect(screen.queryByText("Code point", { exact: false })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "camera-flip" }));
    expect(screen.getByText("Code point", { exact: false })).toBeTruthy();
    expect(screen.getByText("Usage")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Copy name" }));
    });
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith("camera-flip");
    expect(screen.getByText("Copied")).toBeTruthy();
  });

  it("filters the list to contained or outlined icons", async () => {
    await draw();
    await search("camera");
    const all = searchIcons("camera");
    expect(
      screen.getByText(`${all.length} icons matching “camera”`),
    ).toBeTruthy();

    await fireEvent.press(screen.getByRole("radio", { name: "Outlined" }));
    const outlined = filterByStyle(all, "outlined");
    expect(outlined.length).toBeGreaterThan(0);
    expect(outlined.length).toBeLessThan(all.length);
    expect(
      screen.getByText(`${outlined.length} icons matching “camera”`),
    ).toBeTruthy();

    await fireEvent.press(screen.getByRole("radio", { name: "Contained" }));
    expect(
      screen.getByText(
        `${filterByStyle(all, "contained").length} icons matching “camera”`,
      ),
    ).toBeTruthy();
  });
});

describe("the icon style", () => {
  it("splits the font into contained icons and their outline twins", () => {
    expect(styleOf("home")).toBe("contained");
    expect(styleOf("home-outline")).toBe("outlined");
    const contained = filterByStyle(ICON_NAMES, "contained");
    const outlined = filterByStyle(ICON_NAMES, "outlined");
    expect(contained.length + outlined.length).toBe(ICON_NAMES.length);
    expect(filterByStyle(ICON_NAMES, "all")).toBe(ICON_NAMES);
  });
});

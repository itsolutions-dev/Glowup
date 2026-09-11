import React from "react";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  AlertProvider,
  AlertProviderWrapper,
  ThemeProvider,
  ToastProvider,
} from "@its/glowup-ui";

import ComponentPreview from "../catalogue/ComponentPreview";
import { ComponentRegistry } from "../catalogue/registry";
import { CATEGORIES, FLAT_ORDER, TOTAL_COUNT } from "../catalogue/categories";
import { buildSnippet } from "../catalogue/snippet";
import { VARIANTS_BY_COMPONENT } from "../catalogue/variants";
import { COMPONENT_DOCS } from "../site/propsData";

// Same provider chain app/_layout.tsx mounts — the kit's components read from
// all of it. The router is deliberately not mounted: what has to keep working
// is that every catalogue entry renders, and rendering it through a navigator
// only adds ways for the test to fail for reasons that are not that.
const renderDemo = async (name: string) => {
  const meta = ComponentRegistry[name];
  const props: Record<string, any> = {};
  for (const [key, definition] of Object.entries(meta.props)) {
    props[key] = definition.default;
  }

  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1280, height: 900 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <AlertProvider>
          <AlertProviderWrapper>
            <ToastProvider>
              <ComponentPreview
                selectedComponentName={name}
                activeMeta={meta}
                componentProps={props}
                updateProp={() => {}}
              />
            </ToastProvider>
          </AlertProviderWrapper>
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
};

// Kept in sync with CATEGORIES in ../catalogue/categories.ts. A component added
// to the catalogue but left without a working demo fails here rather than in
// someone's browser, which is the whole point of the screen.
const CATALOGUE = [
  // Foundations
  "Typography",
  "Divider",
  "Paper",
  "Card",
  "CardTitle",
  "CardContent",
  "CardCover",
  "CardActions",
  "Icon",
  "TouchableRipple",
  // Actions
  "Button",
  "IconButton",
  "Chip",
  "FAB",
  "AnimatedFAB",
  "SpeedDial",
  "ToggleButton",
  "ToggleButtonGroup",
  // Inputs
  "Input",
  "NumericInput",
  "Select",
  "Checkbox",
  "RadioButton",
  "RadioGroup",
  "Toggle",
  "Slider",
  "Spinner",
  "SearchBar",
  "Autocomplete",
  "PinInput",
  "FormControl",
  "DateTimePicker",
  "DatePicker",
  "DatePickerInput",
  "DateRangePicker",
  "TimePicker",
  "TimeSelect",
  "Calendar",
  "ClockPicker",
  "ClockDial",
  "Rating",
  "HelperText",
  // Data Display
  "Avatar",
  "Badge",
  "IconBadge",
  "StatusBadge",
  "DataGrid",
  "ListItem",
  "ListSection",
  "ListSubheader",
  "Tooltip",
  "Accordion",
  "Carousel",
  "Stat",
  "Image",
  "Link",
  // Feedback
  "Snackbar",
  "Banner",
  "Modal",
  "ConfirmDialog",
  "Popover",
  "BottomSheet",
  "Menu",
  "Skeleton",
  "CircularProgress",
  "LinearProgress",
  "EmptyState",
  "Toast",
  "Collapse",
  "Portal",
  // Navigation
  "NavigationBar",
  "Tabs",
  "TabContent",
  "Breadcrumbs",
  "Pagination",
  "Stepper",
  "LanguageSelector",
  "DrawerPreferenceItem",
  // Layout
  "Box",
  "Stack",
  "Grid",
  "AspectRatio",
  "Center",
  "Spacer",
];

// Catalogued, but not a component the extractor can document: `Toast` is the
// imperative `useToast()` API, demoed through a Button that raises one. It has
// no props type because it has no props.
const WITHOUT_PROPS_TABLE = ["Toast"];

describe("Playground catalogue", () => {
  it("covers every catalogued component", () => {
    // Pins this list to the catalogue's own ordering, so adding a component to
    // CATEGORIES without adding it here fails instead of going untested.
    expect(CATALOGUE).toEqual(FLAT_ORDER);
    expect(CATALOGUE).toHaveLength(TOTAL_COUNT);
  });

  it("gives every catalogued component a registry entry", () => {
    const missing = FLAT_ORDER.filter((name) => !ComponentRegistry[name]);
    expect(missing).toEqual([]);
  });

  it("puts every registry entry in exactly one category", () => {
    const catalogued = CATEGORIES.flatMap((category) => category.items);
    expect(new Set(catalogued).size).toBe(catalogued.length);
    expect(Object.keys(ComponentRegistry).sort()).toEqual(
      [...catalogued].sort(),
    );
  });

  it("documents every catalogued component from the library source", () => {
    // The reference page renders COMPONENT_DOCS; a catalogue entry the
    // generator could not read would silently lose its API table.
    const undocumented = FLAT_ORDER.filter(
      (name) => !COMPONENT_DOCS[name] && !WITHOUT_PROPS_TABLE.includes(name),
    );
    expect(undocumented).toEqual([]);
  });

  it("attaches variants only to components that exist", () => {
    const unknown = Object.keys(VARIANTS_BY_COMPONENT).filter(
      (name) => !ComponentRegistry[name],
    );
    expect(unknown).toEqual([]);
  });

  it.each(CATALOGUE)("renders the %s demo", async (name) => {
    const { toJSON } = await renderDemo(name);
    expect(toJSON()).toBeTruthy();
  });

  it.each(CATALOGUE)("builds a usage snippet for %s", (name) => {
    const meta = ComponentRegistry[name];
    const props: Record<string, any> = {};
    for (const [key, definition] of Object.entries(meta.props)) {
      props[key] = definition.default;
    }
    const snippet = buildSnippet(name, meta, props);
    expect(snippet.startsWith(`<${name}`)).toBe(true);
  });
});

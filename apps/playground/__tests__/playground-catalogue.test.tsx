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
import { COMPONENT_DOCS, requiredPropsOf } from "../site/propsData";

/** The panel's opening state for a component: every prop at its default. */
const defaultsOf = (name: string) => {
  const props: Record<string, any> = {};
  for (const [key, definition] of Object.entries(
    ComponentRegistry[name].props,
  )) {
    props[key] = definition.default;
  }
  return props;
};

// Same provider chain app/_layout.tsx mounts — the kit's components read from
// all of it. The router is deliberately not mounted: what has to keep working
// is that every catalogue entry renders, and rendering it through a navigator
// only adds ways for the test to fail for reasons that are not that.
const renderDemo = async (name: string) => {
  const meta = ComponentRegistry[name];
  const props = defaultsOf(name);

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

  it("gives every catalogued component a variant gallery", () => {
    // A component page without one shows a configurable instance and nothing
    // about the states the component is meant to be used in. Either the
    // authored preview converts, or a gallery goes in catalogue/variants/manual.
    const withoutGallery = FLAT_ORDER.filter(
      (name) => !VARIANTS_BY_COMPONENT[name]?.length,
    );
    expect(withoutGallery).toEqual([]);
  });

  it.each(CATALOGUE)("renders the %s demo", async (name) => {
    const { toJSON } = await renderDemo(name);
    expect(toJSON()).toBeTruthy();
  });

  it.each(CATALOGUE)("builds a usage snippet for %s", (name) => {
    const snippet = buildSnippet(
      name,
      ComponentRegistry[name],
      defaultsOf(name),
      requiredPropsOf(name),
    );
    expect(snippet.startsWith(`<${name}`)).toBe(true);
  });

  it.each(CATALOGUE)("puts %s's content in the right slot", (name) => {
    // `label` and `title` used to go between the tags alongside `children`,
    // which produced `<Slider>Volume</Slider>` — Slider takes no children, so
    // a reader who pasted it got a slider with no label. Whether a component
    // takes children is whether its entry declares a `children` prop, nothing
    // else, and that is what decides the slot.
    const meta = ComponentRegistry[name];
    const snippet = buildSnippet(
      name,
      meta,
      defaultsOf(name),
      requiredPropsOf(name),
    );
    const takesChildren = typeof meta.props.children?.default === "string";

    expect(snippet.endsWith("/>")).toBe(!takesChildren);
    for (const key of ["label", "title"]) {
      const value = meta.props[key]?.default;
      if (typeof value !== "string" || !value) continue;
      // Written, but inside the tag rather than between the tags.
      expect(snippet).toContain(`${key}=${JSON.stringify(value)}`);
    }
  });

  it.each(CATALOGUE)("keeps %s's required props in the snippet", (name) => {
    // A prop equal to its default is omitted, which is what keeps a snippet to
    // the attributes that matter — but applied to a required one it produced
    // `<Modal>…</Modal>` without `visible`, the prop that decides whether the
    // dialog is on screen at all. Required-ness comes from the library's own
    // types via the generated docs, so this cannot drift from the source.
    const meta = ComponentRegistry[name];
    const values = defaultsOf(name);
    const snippet = buildSnippet(name, meta, values, requiredPropsOf(name));

    for (const key of requiredPropsOf(name)) {
      const definition = meta.props[key];
      // Only the ones the panel drives: a required handler or data prop has no
      // control and no value to write. See the note in snippet.ts.
      if (!definition || values[key] === undefined) continue;
      if (definition.appliesWhen?.(values) === false) continue;

      if (key === "children") expect(snippet).toContain(values[key]);
      // A `true` boolean is written bare, the way it would be by hand.
      else if (definition.type === "boolean" && values[key])
        expect(snippet).toMatch(new RegExp(`\\b${key}\\b`));
      else expect(snippet).toContain(`${key}=`);
    }
  });

  it("writes a content prop even at its default, and drops it when emptied", () => {
    // Every other prop is omitted at its default, which is what keeps the
    // snippet short. Applied to the content prop it gave `<Chip />`, a tag
    // whose whole subject is missing.
    expect(
      buildSnippet(
        "Chip",
        ComponentRegistry.Chip,
        defaultsOf("Chip"),
        requiredPropsOf("Chip"),
      ),
    ).toBe('<Chip label="React Native" />');

    // Emptying an optional one is a deliberate "no label"…
    expect(
      buildSnippet(
        "Input",
        ComponentRegistry.Input,
        { ...defaultsOf("Input"), label: "" },
        requiredPropsOf("Input"),
      ),
    ).not.toContain("label=");

    // …but a required one is written as the empty string the demo passes,
    // because a tag without it does not type-check.
    expect(
      buildSnippet(
        "Chip",
        ComponentRegistry.Chip,
        { ...defaultsOf("Chip"), label: "" },
        requiredPropsOf("Chip"),
      ),
    ).toBe('<Chip label="" />');
  });

  it("leaves an inapplicable prop out of the snippet", () => {
    // Divider drops its label once it is vertical, so a snippet that still
    // wrote one would promise something the demo above it visibly does not do.
    const meta = ComponentRegistry.Divider;
    const required = requiredPropsOf("Divider");

    expect(
      buildSnippet("Divider", meta, defaultsOf("Divider"), required),
    ).toContain("OR");
    expect(
      buildSnippet(
        "Divider",
        meta,
        { ...defaultsOf("Divider"), orientation: "vertical" },
        required,
      ),
    ).not.toContain("OR");
  });

  // Every `appliesWhen` in the catalogue, as the pair of panel states that
  // makes it fire and unfire: the props listed are inapplicable under `off`
  // and applicable under `on`. Each was read off the library source — the
  // component does not merely ignore these, it never renders the thing that
  // reads them — and asserting both directions keeps a predicate that is
  // simply always false from passing as an exclusion.
  const EXCLUSIONS: {
    component: string;
    off: Record<string, any>;
    on: Record<string, any>;
    props: string[];
  }[] = [
    // A vertical rule takes no label.
    {
      component: "Divider",
      off: { orientation: "vertical" },
      on: {},
      props: ["children"],
    },

    // Every field in the kit hides its helper text while an error shows.
    ...[
      "Input",
      "Autocomplete",
      "PinInput",
      "FormControl",
      "DatePickerInput",
      "DateTimePicker",
    ].map((component) => ({
      component,
      off: { error: "Something is wrong" },
      on: { error: "" },
      props: ["helperText"],
    })),

    // DateTimePicker's mode picks the surface, and each surface owns props.
    {
      component: "DateTimePicker",
      off: { mode: "time" },
      on: { mode: "date" },
      props: ["selectionMode", "scrollMode", "limitToThisMonth", "noWeekends"],
    },
    {
      component: "DateTimePicker",
      off: { mode: "date" },
      on: { mode: "time" },
      props: ["minuteInterval", "use24HourClock"],
    },
    {
      component: "DateTimePicker",
      off: { mode: "date", selectionMode: "range" },
      on: { mode: "date", selectionMode: "single" },
      props: ["inputEnabled"],
    },

    {
      component: "ClockPicker",
      off: { inputType: "keyboard" },
      on: { inputType: "picker" },
      props: ["minuteInterval"],
    },
    {
      component: "ClockDial",
      off: { unit: "hours" },
      on: { unit: "minutes" },
      props: ["minuteInterval"],
    },
    {
      component: "ClockDial",
      off: { unit: "minutes" },
      on: { unit: "hours" },
      props: ["use24HourClock"],
    },

    {
      component: "DataGrid",
      off: { empty: false },
      on: { empty: true, loading: false },
      props: ["emptyMessage"],
    },
    {
      component: "DataGrid",
      off: { empty: true, loading: true },
      on: { empty: true, loading: false },
      props: ["emptyMessage"],
    },

    {
      component: "Stat",
      off: { delta: "" },
      on: { delta: "12.5%" },
      props: ["trend", "invertTrendColors"],
    },
    {
      component: "Stat",
      off: { trend: "flat" },
      on: { trend: "up" },
      props: ["invertTrendColors"],
    },

    {
      component: "Skeleton",
      off: { animate: false },
      on: { animate: true },
      props: ["duration"],
    },
    {
      component: "LinearProgress",
      off: { indeterminate: true },
      on: { indeterminate: false },
      props: ["progress"],
    },
    {
      component: "Grid",
      off: { minChildWidth: 160 },
      on: { minChildWidth: 0 },
      props: ["columns"],
    },
    {
      component: "Slider",
      off: { step: 0 },
      on: { step: 10 },
      props: ["marks"],
    },
    {
      component: "Avatar",
      off: { name: "Ada Lovelace" },
      on: { name: "" },
      props: ["icon"],
    },
  ];

  it.each(EXCLUSIONS)(
    "$component drops $props when $off",
    ({ component, off, on, props }) => {
      const meta = ComponentRegistry[component];
      for (const key of props) {
        // The prop has to exist, or the row is pinning a typo.
        expect(meta.props[key]).toBeDefined();
        expect(
          meta.props[key].appliesWhen?.({ ...defaultsOf(component), ...off }),
        ).toBe(false);
        expect(
          meta.props[key].appliesWhen?.({ ...defaultsOf(component), ...on }),
        ).toBe(true);
      }
    },
  );

  it("opens with nothing hidden but a mode switch away", () => {
    // A control hidden in the panel's *opening* state is a prop nobody
    // discovers: you cannot toggle something you cannot see. That is tolerable
    // only where the switch that brings it back sits right beside it and is
    // the obvious thing to try — a Mode select, a Unit select, an Empty Data
    // toggle. It is not tolerable where the switch is a number field you would
    // have to guess at, which is what Slider's `step` and Avatar's `name`
    // defaults used to be. Anything new here needs the same argument or a
    // better default.
    const HIDDEN_AT_REST = [
      "DateTimePicker.minuteInterval", // Mode → Time / Date & Time
      "DateTimePicker.use24HourClock", // Mode → Time / Date & Time
      "ClockDial.minuteInterval", // Unit → Minutes
      "DataGrid.emptyMessage", // Empty Data → on
    ];

    const hidden = Object.entries(ComponentRegistry).flatMap(([name, meta]) =>
      Object.entries(meta.props)
        .filter(
          ([, definition]) =>
            definition.appliesWhen?.(defaultsOf(name)) === false,
        )
        .map(([key]) => `${name}.${key}`),
    );
    expect(hidden.sort()).toEqual([...HIDDEN_AT_REST].sort());
  });

  it("pins every appliesWhen in the catalogue to a case above", () => {
    // A new exclusion that nobody covered is an exclusion nobody checked
    // against the library, which is the whole risk this pattern carries.
    const declared = Object.entries(ComponentRegistry).flatMap(([name, meta]) =>
      Object.entries(meta.props)
        .filter(([, definition]) => definition.appliesWhen)
        .map(([key]) => `${name}.${key}`),
    );
    const covered = new Set(
      EXCLUSIONS.flatMap((row) =>
        row.props.map((key) => `${row.component}.${key}`),
      ),
    );
    expect(declared.filter((entry) => !covered.has(entry))).toEqual([]);
  });
});

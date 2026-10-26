import React, { type ComponentType, type ReactNode } from "react";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AlertProvider, ThemeProvider, ToastProvider } from "@its/glowup-ui";

import { DESCRIPTIONS } from "../catalogue/descriptions";
import { EXAMPLES, exampleFor } from "../catalogue/examples";
import { ComponentRegistry } from "../catalogue/registry";
import { CATEGORIES, FLAT_ORDER, TOTAL_COUNT } from "../catalogue/categories";
import { VARIANTS_BY_COMPONENT } from "../catalogue/variants";
import { COMPONENT_DOCS } from "../site/propsData";

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
const Providers = ({ children }: { children: ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 1280, height: 900 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    <ThemeProvider>
      <AlertProvider>
        <ToastProvider>{children}</ToastProvider>
      </AlertProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);

// A page is its example: that is what the stage draws.
const renderDemo = async (name: string) => {
  const example = exampleFor(name);
  if (!example) throw new Error(`${name} has no example`);
  return render(
    <Providers>
      <example.Component />
    </Providers>,
  );
};

/**
 * Host nodes an open overlay leaves in the tree. React Native's Modal renders
 * nothing while `visible` is false and a `Modal` host element once it is, so
 * finding one means something opened itself on mount.
 */
const openOverlaysIn = (node: any): any[] => {
  if (!node || typeof node === "string") return [];
  const here = node.type === "Modal" ? [node] : [];
  return (node.children ?? []).reduce(
    (found: any[], child: any) => found.concat(openOverlaysIn(child)),
    here,
  );
};

/** Every gallery entry on every component page, as [label, demo] pairs. */
const GALLERY: [string, ComponentType][] = Object.entries(
  VARIANTS_BY_COMPONENT,
).flatMap(([name, variants]) =>
  variants.map(
    (variant) =>
      [`${name} — ${variant.title}`, variant.render] as [string, ComponentType],
  ),
);

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
  "ProgressButton",
  "IconButton",
  "Chip",
  "ChipGroup",
  "FAB",
  "SpeedDial",
  "ToggleButton",
  "ToggleButtonGroup",
  "ButtonGroup",
  "SplitButton",
  "Clipboard",
  "Download",
  // Inputs
  "Input",
  "InputArea",
  "PasswordField",
  "Select",
  "Checkbox",
  "CheckboxGroup",
  "RadioButton",
  "RadioGroup",
  "Switch",
  "Slider",
  "NumberField",
  "SearchBar",
  "Autocomplete",
  "PinInput",
  "Editable",
  "Upload",
  "FormControl",
  "DateTimePicker",
  "DatePicker",
  "TimePicker",
  "Rating",
  "HelperText",
  // Data Display
  "Avatar",
  "Badge",
  "StatusBadge",
  "DataGrid",
  "Table",
  "ListItem",
  "ListSection",
  "ListSubheader",
  "Tooltip",
  "Accordion",
  "Carousel",
  "Stat",
  "CaptionValue",
  "Image",
  "Link",
  "CodeBlock",
  "QrCode",
  "Tree",
  "IFrame",
  "Blink",
  // Feedback
  "Snackbar",
  "Banner",
  "Dialog",
  "AlertDialog",
  "Form",
  "Popover",
  "HoverCard",
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
  "AppBar",
  "NavBar",
  "NavigationRail",
  "Drawer",
  "Toolbar",
  "Tabs",
  "TabContent",
  "Breadcrumbs",
  "Pagination",
  "Stepper",
  // Layout
  "Box",
  "Center",
  "AbsoluteCenter",
  "Break",
  "Stack",
  "Grid",
  "AspectRatio",
  "Spacer",
  "Visible",
  "ScrollArea",
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

  it("gives every catalogued component an example", () => {
    // The page is its one example; a component without one has no stage.
    const withoutExample = FLAT_ORDER.filter((name) => !exampleFor(name));
    expect(withoutExample).toEqual([]);
  });

  it("has no example that is not a catalogued component's", () => {
    const stray = Object.keys(EXAMPLES).filter(
      (name) => !FLAT_ORDER.includes(name),
    );
    expect(stray).toEqual([]);
  });

  it("gives every catalogued component one sentence of description", () => {
    // It sits under the title, in the gallery card and in the search result.
    const missing = FLAT_ORDER.filter((name) => !DESCRIPTIONS[name]?.trim());
    expect(missing).toEqual([]);
    const notASentence = FLAT_ORDER.filter(
      (name) => !/^[A-Z].*[.)]$/.test(DESCRIPTIONS[name] ?? ""),
    );
    expect(notASentence).toEqual([]);
    expect(
      Object.keys(DESCRIPTIONS).filter((name) => !FLAT_ORDER.includes(name)),
    ).toEqual([]);
  });

  it.each(GALLERY)(
    "renders the %s gallery entry closed",
    async (label, Demo) => {
      // A gallery entry may not mount an overlay already open. Modal,
      // AlertDialog, BottomSheet, Popover and Menu all render through
      // react-native-web's Modal — a real portal into document.body — so an
      // entry that opened on mount would cover the component page it belongs
      // to, and a demo's close handler is the page's only way back out. The
      // overlay galleries in catalogue/variants/manual open from a trigger
      // instead; this pins that, and that every entry renders at all.
      const { toJSON } = await render(
        <Providers>
          <Demo />
        </Providers>,
      );

      const tree = toJSON();
      expect(tree).toBeTruthy();
      expect(openOverlaysIn(tree).map(() => label)).toEqual([]);
    },
  );

  it.each(CATALOGUE)("renders the %s demo", async (name) => {
    const { toJSON } = await renderDemo(name);
    expect(toJSON()).toBeTruthy();
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
      "InputArea",
      "PasswordField",
      "Autocomplete",
      "PinInput",
      "FormControl",
      "CheckboxGroup",
      "DateTimePicker",
      "DatePicker",
      "TimePicker",
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
      props: ["scrollMode"],
    },
    {
      component: "DateTimePicker",
      off: { mode: "date" },
      on: { mode: "time" },
      props: ["minuteInterval", "use24HourClock"],
    },

    // A static picker is the bare surface: nothing of the field is drawn.
    {
      component: "DateTimePicker",
      off: { variant: "static" },
      on: { variant: "default" },
      props: [
        "label",
        "presentation",
        "fieldVariant",
        "placeholder",
        "helperText",
        "error",
        "required",
        "clearable",
        "defaultInputType",
        "showOkButton",
      ],
    },
    ...["DatePicker", "TimePicker"].map((component) => ({
      component,
      off: { variant: "static" },
      on: { variant: "default" },
      props: [
        "label",
        "presentation",
        "fieldVariant",
        "placeholder",
        "helperText",
        "error",
        "required",
        "clearable",
        "defaultInputType",
        "showOkButton",
      ],
    })),

    // `rows` fixes the height, and wins over the two that let it grow.
    {
      component: "InputArea",
      off: { rows: 6 },
      on: { rows: undefined },
      props: ["minRows", "maxRows"],
    },
    // Decimals and the separator belong to a number field.
    {
      component: "Input",
      off: { type: "text" },
      on: { type: "number" },
      props: ["decimalSeparator", "precision"],
    },
    // Chips are a way of showing several choices; one choice can be cleared.
    {
      component: "Select",
      off: { multiple: false },
      on: { multiple: true },
      props: ["showAsChips"],
    },
    {
      component: "Select",
      off: { multiple: true },
      on: { multiple: false },
      props: ["nullable"],
    },
    // A switch without a label has nothing to place.
    {
      component: "Switch",
      off: { label: "" },
      on: { label: "Email notifications" },
      props: ["labelPlacement"],
    },

    // Only the animated FAB folds its label away, so only it has these.
    {
      component: "FAB",
      off: { variant: "icon" },
      on: { variant: "animated" },
      props: ["animateFrom", "iconMode", "duration"],
    },

    // The empty message is for a grid that is not loading.
    {
      component: "DataGrid",
      off: { loading: true },
      on: { loading: false },
      props: ["emptyMessage"],
    },

    {
      component: "Stat",
      off: { delta: "" },
      on: { delta: "12.5%" },
      props: ["trend", "trendColor"],
    },
    // The fallback stands in for an empty value; a caption-less field has no
    // caption to colour or to space from the value.
    {
      component: "CaptionValue",
      off: { value: "+39 06 1234 5678" },
      on: { value: "" },
      props: ["fallback"],
    },
    {
      component: "CaptionValue",
      off: { omitCaption: true },
      on: { omitCaption: false },
      props: ["captionColor", "gap"],
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
    // A ring with a value does not spin: there is no spin to time.
    {
      component: "CircularProgress",
      off: { progress: 0.5 },
      on: { progress: undefined },
      props: ["duration"],
    },
    // The full-screen dialog fills the window, so it has no width or height
    // of its own, no scrim to click and no body to size.
    {
      component: "Dialog",
      off: { fullScreen: true },
      on: { fullScreen: false },
      props: ["width", "height", "scrollable", "disableBackdropClick"],
    },
    // A side drawer is a column of `width`; a top or bottom one spans the
    // window and is as tall as its content, up to `height`.
    {
      component: "Drawer",
      off: { position: "top" },
      on: { position: "left" },
      props: ["width"],
    },
    {
      component: "Drawer",
      off: { position: "left" },
      on: { position: "top" },
      props: ["height"],
    },
    // No border, no border colour (on a Box and on what is built on one).
    ...["Box", "Stack", "Center", "AspectRatio"].map((component) => ({
      component,
      off: { borderWidth: 0 },
      on: { borderWidth: 2 },
      props: ["borderColor"],
    })),
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
    // `required` only guards the last selected chip of a single-select group.
    {
      component: "ChipGroup",
      off: { multiple: true },
      on: { multiple: false },
      props: ["required"],
    },
    // A tonal colour is drawn from a seed; an outlined chip has no fill to tint.
    {
      component: "Chip",
      off: { variant: "outlined" },
      on: { variant: "filled" },
      props: ["toneFrom"],
    },
    // Only a rich tooltip has a title.
    {
      component: "Tooltip",
      off: { variant: "plain" },
      on: { variant: "rich" },
      props: ["title"],
    },
    // Colour and orientation belong to the floating toolbar.
    {
      component: "Toolbar",
      off: { variant: "docked" },
      on: { variant: "floating" },
      props: ["color", "orientation"],
    },
    // A bar that is always there, or hides itself on its own, has no delay.
    {
      component: "ScrollArea",
      off: { type: "auto" },
      on: { type: "scroll" },
      props: ["scrollHideDelay"],
    },
    // A select edits through its menu: there is no text to select, and a number
    // is the only value with decimals.
    {
      component: "Editable",
      off: { type: "select" },
      on: { type: "text" },
      props: ["selectAllOnFocus"],
    },
    {
      component: "Editable",
      off: { type: "text" },
      on: { type: "number" },
      props: ["precision"],
    },
    // An anchor position replaces the side the card is placed on.
    {
      component: "HoverCard",
      off: { anchorPosition: { vertical: "top", horizontal: "center" } },
      on: { anchorPosition: undefined },
      props: ["placement"],
    },
    // A logo covers the middle of the code, which raises the level to High.
    {
      component: "QrCode",
      off: { logo: "star" },
      on: { logo: "" },
      props: ["level"],
    },
    // Boxes to tick belong to a tree that selects several rows.
    {
      component: "Tree",
      off: { selectionMode: "single" },
      on: { selectionMode: "multiple" },
      props: ["checkboxes"],
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
      "Input.decimalSeparator", // Type → Number
      "Input.precision", // Type → Number
      "Select.showAsChips", // Multiple → on
      "Slider.marks", // Step → a number
      "Switch.labelPlacement", // Label → anything
      "FAB.animateFrom", // Variant → Animated
      "FAB.iconMode", // Variant → Animated
      "FAB.duration", // Variant → Animated
      "Drawer.height", // Position → Top / Bottom
      "Box.borderColor", // Border Width → above 0
      "Stack.borderColor", // Border Width → above 0
      "Center.borderColor", // Border Width → above 0
      "AspectRatio.borderColor", // Border Width → above 0
      "Stat.trend", // Delta → anything
      "Stat.trendColor", // Delta → anything
      "Tooltip.title", // Variant → Rich
      "Toolbar.color", // Variant → Floating
      "Toolbar.orientation", // Variant → Floating
      "ScrollArea.scrollHideDelay", // Type → Scroll / Hover
      "Editable.precision", // Type → Number
      "Tree.checkboxes", // Selection Mode → Multiple
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

import React, { type ComponentType, type ReactNode } from "react";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AlertProvider, ThemeProvider, ToastProvider } from "@its/glowup-ui";

import ComponentPreview from "../catalogue/ComponentPreview";
import { exampleFor } from "../catalogue/examples";
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

const renderDemo = async (name: string) => {
  const meta = ComponentRegistry[name];
  const props = defaultsOf(name);
  const example = exampleFor(name);

  // A page with its example shows that; the others still have the stage.
  if (example) {
    return render(
      <Providers>
        <example.Component />
      </Providers>,
    );
  }

  return render(
    <Providers>
      <ComponentPreview
        selectedComponentName={name}
        activeMeta={meta}
        componentProps={props}
        updateProp={() => {}}
      />
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
  // Inputs
  "Input",
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
  "IFrame",
  "Blink",
  // Feedback
  "Snackbar",
  "Banner",
  "Dialog",
  "ConfirmDialog",
  "Form",
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
  "Stack",
  "Grid",
  "AspectRatio",
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

  it.each(GALLERY)(
    "renders the %s gallery entry closed",
    async (label, Demo) => {
      // A gallery entry may not mount an overlay already open. Modal,
      // ConfirmDialog, BottomSheet, Popover and Menu all render through
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

  // The usage snippet belongs to the stage that is being replaced by examples:
  // a page with its example has the code in the editor instead.
  const STAGED = CATALOGUE.filter((name) => !exampleFor(name));

  it.each(STAGED)("builds a usage snippet for %s", (name) => {
    const snippet = buildSnippet(
      name,
      ComponentRegistry[name],
      defaultsOf(name),
      requiredPropsOf(name),
    );
    expect(snippet.startsWith(`<${name}`)).toBe(true);
  });

  it.each(STAGED)("puts %s's content in the right slot", (name) => {
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

  it.each(STAGED)("keeps %s's required props in the snippet", (name) => {
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
        "inputEnabled",
      ],
    },
    ...["DatePicker", "TimePicker"].map((component) => ({
      component,
      off: { variant: "static" },
      on: { variant: "default" },
      props: ["label", "presentation", "fieldVariant"],
    })),

    // Only a multiline field has lines to count.
    {
      component: "Input",
      off: { multiline: false },
      on: { multiline: true },
      props: ["rows"],
    },
    // The empty message replaces the list, so it needs an empty list.
    {
      component: "Select",
      off: { empty: false },
      on: { empty: true },
      props: ["emptyMessage"],
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
      props: ["extended", "animateFrom", "iconMode"],
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
      props: ["trend", "trendColor"],
    },
    // A row with no action has no trailing slot to size.
    {
      component: "ListItem",
      off: { action: "" },
      on: { action: "chevron" },
      props: ["trailingWidth"],
    },
    // The empty message replaces the rows, so it needs no rows.
    {
      component: "Table",
      off: { empty: false },
      on: { empty: true },
      props: ["emptyMessage"],
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
    // Progress and the per-status labels only mean something in their status.
    {
      component: "ProgressButton",
      off: { status: "idle" },
      on: { status: "loading" },
      props: ["progress", "loadingLabel"],
    },
    {
      component: "LinearProgress",
      off: { indeterminate: true },
      on: { indeterminate: false },
      props: ["progress"],
    },
    {
      component: "CircularProgress",
      off: { indeterminate: true },
      on: { indeterminate: false },
      props: ["progress"],
    },
    // A snackbar with a close button stays up: there is no timeout to set.
    {
      component: "Snackbar",
      off: { closable: true },
      on: { closable: false },
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
    // Only the swipeable drawer is opened and closed; a static one is always there.
    {
      component: "Drawer",
      off: { variant: "static" },
      on: { variant: "swipeable" },
      props: ["visible"],
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
    // No border, no border colour.
    {
      component: "Box",
      off: { borderWidth: 0 },
      on: { borderWidth: 2 },
      props: ["borderColor"],
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
    // `required` only guards the last selected chip of a single-select group.
    {
      component: "ChipGroup",
      off: { multiple: true },
      on: { multiple: false },
      props: ["required"],
    },
    // Colour, orientation and the FAB belong to the floating toolbar.
    {
      component: "Toolbar",
      off: { variant: "docked" },
      on: { variant: "floating" },
      props: ["color", "orientation", "withFab"],
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
      "Input.rows", // Multiline → on
      "Select.emptyMessage", // Empty options → on
      "FAB.extended", // Variant → Animated
      "FAB.animateFrom", // Variant → Animated
      "FAB.iconMode", // Variant → Animated
      "DataGrid.emptyMessage", // Empty Data → on
      "ProgressButton.progress", // Status → Loading
      "ProgressButton.loadingLabel", // Status → Loading
      "Drawer.visible", // Variant → Swipeable
      "Drawer.height", // Position → Top / Bottom
      "Box.borderColor", // Border Width → above 0
      "ListItem.trailingWidth", // Action → anything but None
      "Table.emptyMessage", // Empty Data → on
      "CaptionValue.fallback", // Value → emptied
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

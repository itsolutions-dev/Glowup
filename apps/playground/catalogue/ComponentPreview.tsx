import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  useTheme,
  useToast,
  Typography,
  Button,
  Checkbox,
  Toggle,
  Chip,
  Avatar,
  Card,
  ListItem,
  IconButton,
  CardTitle,
  Portal,
  Center,
  EMPTY_RANGE,
} from "@its/glowup-ui";
import type { DateRange } from "@its/glowup-ui";
import type { ComponentMetadata } from "./types";

interface ComponentPreviewProps {
  /** Registry key of the component on the stage. */
  selectedComponentName: string;
  activeMeta: ComponentMetadata;
  /** Live values from the properties panel. */
  componentProps: Record<string, any>;
  /** Writes a value back to the panel, for demos that are controlled. */
  updateProp: (key: string, value: any) => void;
}

/**
 * Renders one catalogue entry with the props the panel currently holds.
 * Most entries are just `<Component {...props} />`; the ones below need a
 * controlled value, sample data or a coerced number, which is the whole
 * reason this is a component and not a one-liner.
 */
const ComponentPreview = ({
  selectedComponentName,
  activeMeta,
  componentProps,
  updateProp,
}: ComponentPreviewProps) => {
  const { theme } = useTheme();
  const toast = useToast();

  // Demo-only state: the stage keeps it across component switches, exactly as
  // the screen did when this lived inside it.
  const [dateValue, setDateValue] = useState<Date | null>(() => new Date());
  const [dateRange, setDateRange] = useState<DateRange>(() => EMPTY_RANGE);
  const [dateList, setDateList] = useState<Date[]>([]);
  const [pinValue, setPinValue] = useState("");
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [collapseOpen, setCollapseOpen] = useState(false);
  const [languageDemo, setLanguageDemo] = useState("en");
  const [preferenceDemo, setPreferenceDemo] = useState(true);

  const gridData = useMemo(
    () => [
      { id: 1, name: "Item 1", value: "Val 1" },
      { id: 2, name: "Item 2", value: "Val 2" },
    ],
    [],
  );
  const gridCols = useMemo(
    () => [
      { id: "name", label: "Name", width: 150 },
      { id: "value", label: "Value", width: 150 },
    ],
    [],
  );

  const { Component, isContainer } = activeMeta;
  let props = { ...componentProps };

  // Special handling for some components
  if (selectedComponentName === "DataGrid") {
    props.data = props.empty ? [] : gridData;
    props.columns = gridCols;
    delete props.empty;
  }

  if (selectedComponentName === "Badge") {
    props.count = Number(props.count) || 0;
    props.max = Number(props.max) || 99;
  }

  if (selectedComponentName === "Checkbox") {
    props.onValueChange = (v: boolean) => updateProp("checked", v);
  }

  if (selectedComponentName === "RadioGroup") {
    props.options = [
      { id: "a", label: "Option A", value: "a" },
      { id: "b", label: "Option B (disabled)", value: "b", disabled: true },
      { id: "c", label: "Option C", value: "c" },
    ];
    props.onValueChange = (v: any) => updateProp("value", v);
  }

  if (selectedComponentName === "Slider") {
    props.value = Number(props.value) || 0;
    props.min = Number(props.min) || 0;
    props.max = Number(props.max) || 100;
    props.step = Number(props.step) || undefined;
    props.onValueChange = (v: number) => updateProp("value", v);
  }

  if (selectedComponentName === "Spinner") {
    props.value = Number(props.value) || 0;
    props.min = Number(props.min) || 0;
    props.max = Number(props.max) || 100;
    props.onChange = (v: number) => updateProp("value", v);
  }

  if (selectedComponentName === "Tooltip") {
    return (
      <Component {...props}>
        <Button mode="tonal" onPress={() => {}}>
          Hover / long-press me
        </Button>
      </Component>
    );
  }

  if (selectedComponentName === "Menu") {
    props.items = [
      { id: "1", label: "Edit", icon: "pencil-outline", onPress: () => {} },
      {
        id: "2",
        label: "Duplicate",
        icon: "content-copy",
        trailing: "Ctrl+D",
        onPress: () => {},
      },
      {
        id: "3",
        label: "Delete",
        icon: "delete-outline",
        destructive: true,
        dividerAbove: true,
        onPress: () => {},
      },
    ];
    props.onDismiss = () => updateProp("visible", false);
    props.anchor = (
      <Button mode="tonal" onPress={() => updateProp("visible", true)}>
        Open Menu
      </Button>
    );
    return <Component {...props} />;
  }

  if (selectedComponentName === "BottomSheet") {
    props.onDismiss = () => updateProp("visible", false);
    return (
      <>
        <Button mode="tonal" onPress={() => updateProp("visible", true)}>
          Open Bottom Sheet
        </Button>
        <Component {...props}>
          <Typography variant="bodyMedium">
            Bottom sheet content goes here. Drag the handle down or tap the
            scrim to dismiss.
          </Typography>
        </Component>
      </>
    );
  }

  if (selectedComponentName === "NavigationBar") {
    props.items = [
      { id: "home", label: "Home", icon: "home-outline", badgeCount: 0 },
      {
        id: "search",
        label: "Search",
        icon: "magnify",
      },
      {
        id: "inbox",
        label: "Inbox",
        icon: "email-outline",
        badgeCount: 3,
      },
      {
        id: "profile",
        label: "Profile",
        icon: "account-outline",
      },
    ];
    props.onItemPress = (id: string) => updateProp("activeId", id);
  }

  if (selectedComponentName === "Skeleton") {
    props.width = Number(props.width) || 200;
    props.height = Number(props.height) || 48;
    props.duration = Number(props.duration) || 1200;
  }

  if (selectedComponentName === "SearchBar") {
    props.onChangeText = (t: string) => updateProp("value", t);
  }

  if (selectedComponentName === "Banner") {
    props.actions = [
      { label: "Dismiss", onPress: () => updateProp("visible", false) },
      { label: "Renew", onPress: () => {} },
    ];
    props.onDismiss = () => updateProp("visible", false);
  }

  if (selectedComponentName === "Breadcrumbs") {
    const maxItems = Number(props.maxItems) || 0;
    props.maxItems = maxItems > 0 ? maxItems : undefined;
    props.items = [
      { id: "1", label: "Home", icon: "home-outline", onPress: () => {} },
      { id: "2", label: "Projects", onPress: () => {} },
      { id: "3", label: "Glowup", onPress: () => {} },
      { id: "4", label: "Components", onPress: () => {} },
      { id: "5", label: "Breadcrumbs" },
    ];
  }

  if (selectedComponentName === "Pagination") {
    props.page = Number(props.page) || 1;
    props.totalPages = Number(props.totalPages) || 1;
    props.siblingCount = Number(props.siblingCount) || 1;
    props.onPageChange = (p: number) => updateProp("page", p);
  }

  if (selectedComponentName === "Rating") {
    props.value = Number(props.value) || 0;
    props.max = Number(props.max) || 5;
    props.size = Number(props.size) || 24;
    props.onChange = (v: number) => updateProp("value", v);
  }

  if (selectedComponentName === "EmptyState") {
    props.action = {
      label: "Add item",
      iconName: "plus",
      onPress: () => {},
    };
  }

  if (selectedComponentName === "Carousel") {
    props.autoPlayInterval = Number(props.autoPlayInterval) || 0;
    return (
      <View style={{ width: "100%", maxWidth: 480 }}>
        <Component {...props}>
          {["primaryContainer", "secondaryContainer", "tertiaryContainer"].map(
            (colorKey, i) => (
              <View
                key={colorKey}
                style={{
                  height: 160,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: (theme.colors as any)[colorKey],
                }}
              >
                <Typography variant="titleMedium">{`Slide ${i + 1}`}</Typography>
              </View>
            ),
          )}
        </Component>
      </View>
    );
  }

  if (selectedComponentName === "ClockPicker") {
    if (!props.locale) delete props.locale;
    props.minuteInterval = Number(props.minuteInterval) || 1;
    // The surface edits an instant, so it needs a non-null value.
    props.value = dateValue ?? new Date();
    props.onChange = (d: Date) => setDateValue(d);
    // The M3 time surface has an intrinsic ~278px width (it is sized for a
    // 328dp dialog); the stage is narrower than that below ~1400px, so let it
    // scroll rather than clipping the AM/PM switch off the edge.
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 4,
          flexGrow: 1,
          justifyContent: "center",
        }}
      >
        <Component {...props} />
      </ScrollView>
    );
  }

  if (
    selectedComponentName === "DateTimePicker" ||
    selectedComponentName === "DatePicker" ||
    selectedComponentName === "TimePicker" ||
    selectedComponentName === "DatePickerInput" ||
    selectedComponentName === "DateRangePicker" ||
    selectedComponentName === "Calendar"
  ) {
    // limitToThisMonth / noWeekends are playground switches, not component
    // props — they stand in for a real validRange / isDateDisabled.
    const { limitToThisMonth, noWeekends, ...rest } = props;
    props = rest;
    if (!props.locale) delete props.locale;
    if (!props.error) delete props.error;
    if (!props.helperText) delete props.helperText;
    if (limitToThisMonth) {
      const now = new Date();
      props.validRange = {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    }
    if (noWeekends) {
      props.isDateDisabled = (date: Date) =>
        date.getDay() === 0 || date.getDay() === 6;
    }

    // Each selection mode reports through its own callback and reads from
    // its own state, so the three are wired separately. `DateRangePicker`
    // locks the mode away as a prop, hence the name check.
    const selection =
      selectedComponentName === "DateRangePicker"
        ? "range"
        : (props.selectionMode ?? "single");

    if (selection === "range") {
      if (selectedComponentName === "Calendar") {
        props.range = dateRange;
        props.onRangeChange = setDateRange;
      } else {
        props.value = dateRange;
        props.onChange = setDateRange;
        props.onClear = () => setDateRange(EMPTY_RANGE);
      }
    } else if (selection === "multiple") {
      if (selectedComponentName === "Calendar") {
        props.dates = dateList;
        props.onDatesChange = setDateList;
      } else {
        props.value = dateList;
        props.onChange = setDateList;
        props.onClear = () => setDateList([]);
      }
    } else {
      props.value = dateValue;
      props.onChange = (d: Date) => setDateValue(d);
      props.onClear = () => setDateValue(null);
    }

    if (selectedComponentName === "Calendar") {
      return <Component {...props} />;
    }
    props.minuteInterval = Number(props.minuteInterval) || 1;
    return (
      <View style={{ width: "100%", maxWidth: 360 }}>
        <Component {...props} />
      </View>
    );
  }

  if (selectedComponentName === "IconButton") {
    return (
      <Component
        {...props}
        accessibilityLabel={props.icon || "Icon button"}
        onPress={() => {}}
      />
    );
  }

  if (selectedComponentName === "Link") {
    const { children, ...linkProps } = props;
    if (!linkProps.href) delete linkProps.href;
    return <Component {...linkProps}>{children}</Component>;
  }

  if (selectedComponentName === "Stat") {
    if (!props.icon) delete props.icon;
    if (!props.delta) delete props.delta;
    if (!props.helpText) delete props.helpText;
    return (
      <View style={{ minWidth: 240 }}>
        <Component {...props} />
      </View>
    );
  }

  if (selectedComponentName === "PinInput") {
    props.length = Math.max(2, Math.min(10, Number(props.length) || 6));
    props.value = pinValue;
    props.onChangeText = setPinValue;
    if (!props.error) delete props.error;
    if (!props.helperText) delete props.helperText;
    return (
      <View style={{ alignItems: "center" }}>
        <Component {...props} />
      </View>
    );
  }

  if (selectedComponentName === "Autocomplete") {
    props.minChars = Math.max(0, Number(props.minChars) || 0);
    props.value = autocompleteQuery;
    props.onChangeText = setAutocompleteQuery;
    props.onSelect = () => {};
    props.options = [
      {
        id: "it",
        label: "Italy",
        value: "IT",
        description: "Europe",
        icon: "map-marker-outline",
      },
      { id: "is", label: "Iceland", value: "IS", description: "Europe" },
      { id: "in", label: "India", value: "IN", description: "Asia" },
      { id: "id", label: "Indonesia", value: "ID", description: "Asia" },
      { id: "ie", label: "Ireland", value: "IE", description: "Europe" },
      { id: "jp", label: "Japan", value: "JP", description: "Asia" },
    ];
    if (!props.error) delete props.error;
    if (!props.helperText) delete props.helperText;
    if (!props.emptyMessage) delete props.emptyMessage;
    return (
      <View style={{ width: "100%", maxWidth: 360, minHeight: 300 }}>
        <Component {...props} />
      </View>
    );
  }

  if (selectedComponentName === "FormControl") {
    if (!props.error) delete props.error;
    if (!props.helperText) delete props.helperText;
    return (
      <View style={{ width: "100%", maxWidth: 360 }}>
        <Component {...props}>
          <Checkbox
            label="Email me about incidents"
            checked
            onValueChange={() => {}}
          />
          <Checkbox
            label="Email me a weekly digest"
            checked={false}
            onValueChange={() => {}}
          />
        </Component>
      </View>
    );
  }

  if (selectedComponentName === "Collapse") {
    props.collapsedHeight = Number(props.collapsedHeight) || 0;
    props.duration = Number(props.duration) || 200;
    return (
      <View style={{ width: "100%", maxWidth: 420, gap: 12 }}>
        <Button mode="tonal" onPress={() => setCollapseOpen((o) => !o)}>
          {collapseOpen ? "Collapse" : "Expand"}
        </Button>
        <Component {...props} open={collapseOpen}>
          <View
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: theme.colors.secondaryContainer,
            }}
          >
            <Typography variant="bodyMedium">
              The height is measured from the content, so this animates
              correctly however much text it holds — no fixed height needed.
            </Typography>
          </View>
        </Component>
      </View>
    );
  }

  if (selectedComponentName === "Image") {
    const { broken, ...imageProps } = props;
    imageProps.ratio = Number(imageProps.ratio) || 1.5;
    imageProps.source = {
      uri: broken
        ? "https://example.invalid/missing.png"
        : "https://picsum.photos/seed/glowup/640/420",
    };
    return (
      <View style={{ width: "100%", maxWidth: 420 }}>
        <Component {...imageProps} />
      </View>
    );
  }

  if (
    selectedComponentName === "Box" ||
    selectedComponentName === "Stack" ||
    selectedComponentName === "Grid"
  ) {
    if (selectedComponentName === "Grid") {
      props.columns = Math.max(1, Number(props.columns) || 1);
      const minChildWidth = Number(props.minChildWidth) || 0;
      props.minChildWidth = minChildWidth > 0 ? minChildWidth : undefined;
    }
    const swatches = ["primary", "secondary", "tertiary", "error"];
    return (
      <View style={{ width: "100%", maxWidth: 420 }}>
        <Component {...props}>
          {swatches.map((colorKey) => (
            <View
              key={colorKey}
              style={{
                minWidth: 72,
                paddingVertical: 18,
                paddingHorizontal: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: (theme.colors as any)[colorKey],
              }}
            >
              <Typography
                variant="labelMedium"
                style={{
                  color: (theme.colors as any)[
                    `on${colorKey[0].toUpperCase()}${colorKey.slice(1)}`
                  ],
                }}
              >
                {colorKey}
              </Typography>
            </View>
          ))}
        </Component>
      </View>
    );
  }

  if (selectedComponentName === "Toast") {
    const duration = Number(props.duration) || 4000;
    const action = props.withAction
      ? { label: "Undo", onPress: () => {} }
      : undefined;
    const message = props.message || "Changes saved";
    return (
      <View style={{ gap: 12, alignItems: "center" }}>
        <Typography
          variant="bodyMedium"
          style={{
            color: theme.colors.onSurfaceVariant,
            textAlign: "center",
          }}
        >
          useToast() queues toasts from anywhere in the tree — no `visible`
          state to thread through the screen.
        </Typography>
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Button
            mode="tonal"
            onPress={() => toast.show({ message, duration, action })}
          >
            Show
          </Button>
          <Button
            mode="tonal"
            onPress={() => toast.success(message, { duration, action })}
          >
            Success
          </Button>
          <Button
            mode="tonal"
            onPress={() => toast.error(message, { duration, action })}
          >
            Error
          </Button>
          <Button mode="outlined" onPress={() => toast.hide()}>
            Clear queue
          </Button>
        </View>
      </View>
    );
  }

  if (selectedComponentName === "FAB") {
    if (!props.label) delete props.label;
    return (
      <View style={{ width: "100%", height: 200 }}>
        <Component {...props} onPress={() => {}} />
      </View>
    );
  }

  if (selectedComponentName === "IconBadge") {
    props.badgeCount = Number(props.badgeCount) || 0;
    props.size = Number(props.size) || 32;
    if (!props.badgeColor) delete props.badgeColor;
    if (!props.color) delete props.color;
    return <Component {...props} onPress={() => {}} />;
  }

  if (selectedComponentName === "NumericInput") {
    props.precision = props.precision ? Number(props.precision) : undefined;
    props.onChangeText = (t: string) => updateProp("value", t);
    if (!props.prefix) delete props.prefix;
    if (!props.suffix) delete props.suffix;
    return (
      <View style={{ width: "100%", maxWidth: 360 }}>
        <Component {...props} />
      </View>
    );
  }

  if (selectedComponentName === "Toggle") {
    props.width = Number(props.width) || 48;
    props.height = Number(props.height) || 28;
    props.onValueChange = (v: boolean) => updateProp("value", v);
    return <Component {...props} />;
  }

  if (selectedComponentName === "Select") {
    props.options = [
      { id: "it", label: "Italy", value: "it", icon: "flag-outline" },
      { id: "fr", label: "France", value: "fr", icon: "flag-outline" },
      { id: "de", label: "Germany", value: "de", icon: "flag-outline" },
      { id: "es", label: "Spain", value: "es", icon: "flag-outline" },
    ];
    props.onSelect = (v: any) => updateProp("value", v);
    return (
      <View style={{ width: "100%", maxWidth: 360 }}>
        <Component {...props} />
      </View>
    );
  }

  if (selectedComponentName === "Stepper") {
    props.activeStep = Number(props.activeStep) || 0;
    props.steps = ["Cart", "Shipping", "Payment", "Review"];
    props.onStepPress = (i: number) => updateProp("activeStep", i);
    return (
      <View style={{ width: "100%", maxWidth: 420 }}>
        <Component {...props} />
      </View>
    );
  }

  if (selectedComponentName === "StatusBadge") {
    if (!props.icon) delete props.icon;
    return <Component {...props} />;
  }

  if (selectedComponentName === "Tabs") {
    props.activeTab = Number(props.activeTab) || 0;
    props.tabs = ["Overview", "Specs", "Reviews"];
    props.onChange = (i: number) => updateProp("activeTab", i);
    return (
      <View style={{ width: "100%", maxWidth: 420 }}>
        <Component {...props} />
      </View>
    );
  }

  if (selectedComponentName === "ToggleButtonGroup") {
    props.options = [
      { label: "List", icon: "format-list-bulleted", value: "list" },
      { label: "Grid", icon: "view-grid-outline", value: "grid" },
      { label: "Cards", icon: "card-outline", value: "cards" },
    ];
    props.onValueChange = (v: any) => updateProp("value", v);
    return <Component {...props} />;
  }

  if (selectedComponentName === "CircularProgress") {
    props.size = Number(props.size) || 48;
    props.strokeWidth = Number(props.strokeWidth) || 4;
    props.duration = Number(props.duration) || 1000;
    if (!props.color) delete props.color;
    return <Component {...props} />;
  }

  if (selectedComponentName === "LinearProgress") {
    props.progress = Number(props.progress) || 0;
    props.height = Number(props.height) || 4;
    if (!props.color) delete props.color;
    return (
      <View style={{ width: "100%", maxWidth: 400 }}>
        <Component {...props} />
      </View>
    );
  }

  if (selectedComponentName === "Snackbar") {
    props.duration = Number(props.duration) || 0;
    props.onDismiss = () => updateProp("visible", false);
    props.action = { label: "Undo", onPress: () => {} };
    if (!props.icon) delete props.icon;
    return (
      <View style={{ width: "100%", height: 160 }}>
        <Button mode="tonal" onPress={() => updateProp("visible", true)}>
          Show Snackbar
        </Button>
        <Component {...props} />
      </View>
    );
  }

  if (selectedComponentName === "SpeedDial") {
    props.actions = [
      { id: "1", label: "New Doc", icon: "file-outline", onPress: () => {} },
      { id: "2", label: "Upload", icon: "upload-outline", onPress: () => {} },
      { id: "3", label: "Folder", icon: "folder-outline", onPress: () => {} },
    ];
    return (
      <View style={{ width: "100%", height: 260 }}>
        <Component {...props} />
      </View>
    );
  }

  if (selectedComponentName === "Modal") {
    props.onClose = () => updateProp("visible", false);
    const { children, ...modalProps } = props;
    return (
      <>
        <Button mode="tonal" onPress={() => updateProp("visible", true)}>
          Open Modal
        </Button>
        <Component {...modalProps}>{children}</Component>
      </>
    );
  }

  if (selectedComponentName === "ConfirmDialog") {
    props.onConfirm = () => updateProp("visible", false);
    props.onCancel = () => updateProp("visible", false);
    return (
      <>
        <Button mode="tonal" onPress={() => updateProp("visible", true)}>
          Open Confirm Dialog
        </Button>
        <Component {...props} />
      </>
    );
  }

  if (selectedComponentName === "Popover") {
    props.onDismiss = () => updateProp("visible", false);
    props.anchor = (
      <Button mode="tonal" onPress={() => updateProp("visible", true)}>
        Open Popover
      </Button>
    );
    return (
      <Component {...props}>
        <View style={{ padding: 16, maxWidth: 240 }}>
          <Typography variant="bodyMedium">
            Popover content anchored to the button above.
          </Typography>
        </View>
      </Component>
    );
  }

  if (selectedComponentName === "Divider") {
    props.thickness = Number(props.thickness) || 1;
    props.inset = Number(props.inset) || 0;
    const { children, ...dividerProps } = props;

    // A vertical rule is as tall as the row it separates, so on its own it has
    // nothing to measure against and the stage showed an invisible hairline.
    // Give it the two columns it exists to divide. The label is horizontal-only
    // by design, so it is not passed here.
    if (dividerProps.orientation === "vertical") {
      return (
        <View
          style={{
            flexDirection: "row",
            alignItems: "stretch",
            height: 72,
            width: "100%",
            maxWidth: 420,
          }}
        >
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Typography variant="bodyMedium">Before</Typography>
          </View>
          <Component {...dividerProps} />
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Typography variant="bodyMedium">After</Typography>
          </View>
        </View>
      );
    }

    return (
      <View style={{ width: "100%", maxWidth: 420 }}>
        <Component {...dividerProps}>{children}</Component>
      </View>
    );
  }

  if (selectedComponentName === "Paper") {
    props.elevation = Number(props.elevation) || 0;
  }

  if (selectedComponentName === "Icon") {
    props.size = Number(props.size) || 24;
    return <Component {...props} />;
  }

  if (selectedComponentName === "TouchableRipple") {
    props.borderRadius = Number(props.borderRadius) || 0;
    return (
      <Component
        {...props}
        onPress={() => {}}
        accessibilityLabel="Tappable surface"
      >
        <View style={{ padding: 16 }}>
          <Typography variant="bodyMedium">
            Hover or press this surface
          </Typography>
        </View>
      </Component>
    );
  }

  // The Card parts only read correctly inside the surface they belong to.
  if (selectedComponentName === "CardTitle") {
    return (
      <Card variant="elevated" style={{ width: "100%", maxWidth: 420 }}>
        <Component
          {...props}
          left={<Avatar name="Ada Lovelace" size={40} />}
          right={
            <IconButton
              icon="dots-vertical"
              accessibilityLabel="More actions"
              onPress={() => {}}
            />
          }
        />
      </Card>
    );
  }

  if (selectedComponentName === "CardContent") {
    const { children, ...rest } = props;
    return (
      <Card variant="elevated" style={{ width: "100%", maxWidth: 420 }}>
        <CardTitle title="Line 4" subtitle="Scheduled maintenance" />
        <Component {...rest}>
          <Typography variant="bodyMedium">{children}</Typography>
        </Component>
      </Card>
    );
  }

  if (selectedComponentName === "CardCover") {
    props.ratio = Number(props.ratio) || 16 / 9;
    return (
      <Card variant="elevated" style={{ width: "100%", maxWidth: 420 }}>
        <Component
          {...props}
          source={{ uri: "https://picsum.photos/seed/glowup/800/450" }}
        />
        <CardTitle title="Line 4" subtitle="Scheduled maintenance" />
      </Card>
    );
  }

  if (selectedComponentName === "CardActions") {
    return (
      <Card variant="elevated" style={{ width: "100%", maxWidth: 420 }}>
        <CardTitle title="Line 4" subtitle="Confirm the service call" />
        <Component {...props}>
          <Button mode="text" onPress={() => {}}>
            Postpone
          </Button>
          <Button onPress={() => {}}>Confirm</Button>
        </Component>
      </Card>
    );
  }

  if (selectedComponentName === "RadioButton") {
    props.onPress = () => updateProp("selected", !props.selected);
    return <Component {...props} />;
  }

  if (selectedComponentName === "ToggleButton") {
    props.onPress = () => updateProp("active", !props.active);
    return <Component {...props} />;
  }

  if (selectedComponentName === "AnimatedFAB") {
    props.onPress = () => {};
    // Floating pins it to the screen corner, so give it room to sit in.
    return (
      <View style={{ width: "100%", height: 160, justifyContent: "center" }}>
        <Component {...props} />
      </View>
    );
  }

  if (selectedComponentName === "AspectRatio") {
    props.ratio = Number(props.ratio) || 1;
    return (
      <View style={{ width: "100%", maxWidth: 420 }}>
        <Component {...props} radius="medium" bg="surfaceContainerHigh">
          <Center style={{ flex: 1 }}>
            <Typography variant="labelLarge">
              {`ratio ${props.ratio.toFixed(2)}`}
            </Typography>
          </Center>
        </Component>
      </View>
    );
  }

  if (selectedComponentName === "Center") {
    return (
      <View style={{ width: "100%", maxWidth: 420, height: 140 }}>
        <Component {...props} style={{ flex: 1 }} bg="surfaceContainerHigh">
          <Typography variant="labelLarge">Centred on both axes</Typography>
        </Component>
      </View>
    );
  }

  if (selectedComponentName === "Spacer") {
    props.size = Number(props.size) || 0;
    const horizontal = props.axis === "horizontal";
    return (
      <View
        style={{
          width: "100%",
          maxWidth: 420,
          flexDirection: horizontal ? "row" : "column",
          alignItems: horizontal ? "center" : "stretch",
        }}
      >
        <Chip label="Before" />
        <Component {...props} />
        <Chip label="After" />
      </View>
    );
  }

  if (selectedComponentName === "TabContent") {
    props.activeTab = Number(props.activeTab) || 0;
    return (
      <View style={{ width: "100%", maxWidth: 420 }}>
        <Component {...props}>
          <Typography variant="bodyMedium">Tab 0 content</Typography>
          <Typography variant="bodyMedium">Tab 1 content</Typography>
          <Typography variant="bodyMedium">Tab 2 content</Typography>
        </Component>
      </View>
    );
  }

  if (selectedComponentName === "ListSection") {
    return (
      <View style={{ width: "100%", maxWidth: 420 }}>
        <Component {...props}>
          <ListItem
            trailing={<Typography variant="bodySmall">Weekly</Typography>}
          >
            Email digest
          </ListItem>
          <ListItem
            trailing={<Typography variant="bodySmall">Instant</Typography>}
          >
            Mentions
          </ListItem>
        </Component>
      </View>
    );
  }

  if (selectedComponentName === "Portal") {
    // The whole point is escaping a clipping parent, so show one.
    return (
      <Portal.Host>
        <View style={{ width: "100%", maxWidth: 420, gap: 12 }}>
          <Typography variant="bodySmall">
            The panel below is 64px tall with overflow: hidden. The portalled
            content is drawn at the host, so the clip does not reach it.
          </Typography>
          <View
            style={{
              height: 64,
              overflow: "hidden",
              borderRadius: 12,
              backgroundColor: theme.colors.surfaceContainerHigh,
              padding: 12,
            }}
          >
            <Typography variant="labelLarge">Clipping parent</Typography>
            <Portal>
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 96,
                  left: 24,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: theme.colors.inverseSurface,
                }}
              >
                <Typography
                  variant="labelLarge"
                  style={{ color: theme.colors.inverseOnSurface }}
                >
                  Drawn at the host
                </Typography>
              </View>
            </Portal>
          </View>
        </View>
      </Portal.Host>
    );
  }

  if (selectedComponentName === "LanguageSelector") {
    props.currentLang = languageDemo;
    props.onChange = setLanguageDemo;
    return <Component {...props} />;
  }

  if (selectedComponentName === "DrawerPreferenceItem") {
    return (
      <View style={{ width: "100%", maxWidth: 420 }}>
        <Component {...props}>
          <Toggle value={preferenceDemo} onValueChange={setPreferenceDemo} />
        </Component>
      </View>
    );
  }

  if (selectedComponentName === "ClockDial") {
    const current = dateValue ?? new Date();
    props.minuteInterval = Number(props.minuteInterval) || 1;
    props.hours = current.getHours();
    props.minutes = current.getMinutes();
    props.onChangeHours = (hours: number) => {
      const next = new Date(current);
      next.setHours(hours);
      setDateValue(next);
    };
    props.onChangeMinutes = (minutes: number) => {
      const next = new Date(current);
      next.setMinutes(minutes);
      setDateValue(next);
    };
    return <Component {...props} />;
  }

  if (selectedComponentName === "TimeSelect") {
    props.minuteInterval = Number(props.minuteInterval) || 1;
    props.value = dateValue ?? new Date();
    props.onChange = setDateValue;
    return <Component {...props} />;
  }

  if (isContainer) {
    const { children, ...otherProps } = props;
    return (
      <Component {...otherProps}>
        {typeof children === "string" ? (
          <Typography variant="bodyMedium">{children}</Typography>
        ) : (
          children
        )}
      </Component>
    );
  }

  return <Component {...props} onPress={() => console.log("Pressed")} />;
};

export default ComponentPreview;

import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  useTheme,
  useToast,
  Typography,
  Button,
  ProgressButton,
  Checkbox,
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
import { useHydrated } from "../site/useHydrated";

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
 * The instant the date and time stages open on — fixed, like the variant
 * galleries' sample dates. Not `new Date()`: the static export prerenders the
 * build's "now", and a visitor's "now" is a different time, so the field text
 * would disagree on hydration (React error #418).
 */
const DEMO_DATE = new Date(2024, 4, 15, 10, 30);

/**
 * Renders one catalogue entry with the props the panel currently holds.
 * Most entries are `<Component {...props} />` plus their registry's `sample`,
 * `controlled`, `dropWhenFalsy` and `stage`; the branches below are the ones
 * that need children, demo state or a trigger.
 */
const ComponentPreview = ({
  selectedComponentName,
  activeMeta,
  componentProps,
  updateProp,
}: ComponentPreviewProps) => {
  const { theme } = useTheme();
  const toast = useToast();
  const hydrated = useHydrated();

  // Demo-only state: the stage keeps it across component switches, exactly as
  // the screen did when this lived inside it.
  const [dateValue, setDateValue] = useState<Date | null>(DEMO_DATE);
  const [dateRange, setDateRange] = useState<DateRange>(() => EMPTY_RANGE);
  const [dateList, setDateList] = useState<Date[]>([]);
  const [pinValue, setPinValue] = useState("");
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [collapseOpen, setCollapseOpen] = useState(false);

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

  const {
    Component,
    Demo,
    isContainer,
    clientOnly,
    sample,
    controlled,
    dropWhenFalsy,
    stage,
  } = activeMeta;
  if (clientOnly && !hydrated) return null;
  if (Demo) return <Demo props={componentProps} updateProp={updateProp} />;
  let props = { ...componentProps, ...sample };
  for (const key of dropWhenFalsy ?? []) if (!props[key]) delete props[key];
  for (const [callback, key] of Object.entries(controlled ?? {})) {
    props[callback] = (value: any) => updateProp(key, value);
  }

  // The entries that need more than the registry's fields can say.
  if (selectedComponentName === "DataGrid") {
    props.data = props.empty ? [] : gridData;
    props.columns = gridCols;
    delete props.empty;
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

  if (selectedComponentName === "Banner") {
    props.actions = [
      { label: "Dismiss", onPress: () => updateProp("visible", false) },
      { label: "Renew", onPress: () => {} },
    ];
    props.onDismiss = () => updateProp("visible", false);
  }

  if (selectedComponentName === "Carousel") {
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
    // The surface edits an instant, so it needs a non-null value.
    props.value = dateValue ?? DEMO_DATE;
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
    return (
      <View style={{ width: "100%", maxWidth: 360 }}>
        <Component {...props} />
      </View>
    );
  }

  if (selectedComponentName === "ProgressButton") {
    return <ProgressButtonStage props={props} updateProp={updateProp} />;
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

  if (selectedComponentName === "PinInput") {
    props.length = Math.max(2, Math.min(10, props.length));
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
    props.minChars = Math.max(0, props.minChars);
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
      props.columns = Math.max(1, props.columns);
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
    const { duration } = props;
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

  if (selectedComponentName === "Snackbar") {
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

  if (selectedComponentName === "TouchableRipple") {
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

  if (selectedComponentName === "AspectRatio") {
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

  if (selectedComponentName === "ClockDial") {
    const current = dateValue ?? DEMO_DATE;
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

  let element;
  if (isContainer) {
    const { children, ...otherProps } = props;
    element = (
      <Component {...otherProps}>
        {typeof children === "string" ? (
          <Typography variant="bodyMedium">{children}</Typography>
        ) : (
          children
        )}
      </Component>
    );
  } else {
    element = <Component {...props} onPress={() => console.log("Pressed")} />;
  }
  return stage ? <View style={stage}>{element}</View> : element;
};

/**
 * ProgressButton's stage: the panel's props, plus a task to run. Pressing the
 * button (or the failure trigger) walks the panel through the statuses a real
 * caller would — loading with progress ticking up, then success or error —
 * by writing them back with `updateProp`, so the controls follow along.
 */
const ProgressButtonStage = ({
  props,
  updateProp,
}: {
  props: Record<string, any>;
  updateProp: (key: string, value: any) => void;
}) => {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [running, setRunning] = useState(false);
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  };
  useEffect(() => stop, []);

  const run = (failAt?: number) => {
    stop();
    setRunning(true);
    let progress = 0;
    updateProp("progress", 0);
    updateProp("status", "loading");
    timer.current = setInterval(() => {
      progress = Math.min(1, progress + 0.04 + Math.random() * 0.08);
      if (failAt !== undefined && progress >= failAt) {
        stop();
        updateProp("status", "error");
        return;
      }
      updateProp("progress", Number(progress.toFixed(2)));
      if (progress >= 1) {
        stop();
        updateProp("status", "success");
      }
    }, 180);
  };

  return (
    <View style={{ alignItems: "center", gap: 16 }}>
      <ProgressButton
        {...props}
        loadingLabel={props.loadingLabel || undefined}
        iconName={props.iconName || undefined}
        onPress={() => run()}
        onSuccessEnd={() => updateProp("status", "idle")}
      />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button
          mode="text"
          iconName="play"
          disabled={running}
          onPress={() => run()}
        >
          Run the task
        </Button>
        <Button
          mode="text"
          tone="error"
          iconName="alert-outline"
          disabled={running}
          onPress={() => run(0.7)}
        >
          Fail at 70%
        </Button>
      </View>
    </View>
  );
};

export default ComponentPreview;

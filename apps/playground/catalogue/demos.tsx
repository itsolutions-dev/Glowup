// Stage demos for catalogue entries that need more than `<Component {...props} />`.
// Each is attached to its registry entry as `Demo`; ComponentPreview renders it
// with the panel's live props.
import { useState } from "react";
import { View } from "react-native";
import {
  Button,
  ButtonGroup,
  ChipGroup,
  DrawerItem,
  DrawerSection,
  FAB,
  IconButton,
  NavigationDrawer,
  NavigationRail,
  SideSheet,
  SplitButton,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Toolbar,
  TopAppBar,
  Typography,
  useTheme,
} from "@its/glowup-ui";
import type { DemoProps } from "./types";

const RAIL_ITEMS = [
  { id: "home", label: "Home", icon: "home-outline" as const },
  { id: "search", label: "Search", icon: "magnify" as const },
  {
    id: "inbox",
    label: "Inbox",
    icon: "inbox-outline" as const,
    badgeCount: 4,
  },
  { id: "settings", label: "Settings", icon: "cog-outline" as const },
];

export const NavigationRailDemo = ({ props, updateProp }: DemoProps) => (
  <View style={{ height: 420, flexDirection: "row" }}>
    <NavigationRail
      items={RAIL_ITEMS}
      activeId={props.activeId}
      onItemPress={(id) => updateProp("activeId", id)}
      showLabels={props.showLabels}
      alignment={props.alignment}
      header={
        props.withFab ? (
          <>
            <IconButton
              icon="menu"
              accessibilityLabel="Menu"
              onPress={() => {}}
            />
            <FAB icon="pencil-outline" placement="inline" onPress={() => {}} />
          </>
        ) : undefined
      }
    />
  </View>
);

const DrawerContent = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) => (
  <>
    <DrawerSection>
      {[
        {
          id: "inbox",
          label: "Inbox",
          icon: "inbox-outline" as const,
          badge: 24,
        },
        { id: "sent", label: "Sent", icon: "send-outline" as const },
        {
          id: "drafts",
          label: "Drafts",
          icon: "file-outline" as const,
          badge: 3,
        },
      ].map((item) => (
        <DrawerItem
          key={item.id}
          {...item}
          selected={selected === item.id}
          onPress={() => onSelect(item.id)}
        />
      ))}
    </DrawerSection>
    <DrawerSection title="Labels" showDivider>
      <DrawerItem
        label="Family"
        icon="label-outline"
        selected={selected === "family"}
        onPress={() => onSelect("family")}
      />
      <DrawerItem
        label="Work"
        icon="label-outline"
        selected={selected === "work"}
        onPress={() => onSelect("work")}
      />
    </DrawerSection>
  </>
);

export const NavigationDrawerDemo = ({ props }: DemoProps) => {
  const [selected, setSelected] = useState("inbox");
  const [open, setOpen] = useState(false);

  if (props.variant === "modal") {
    return (
      <>
        <Button mode="tonal" iconName="menu" onPress={() => setOpen(true)}>
          Open drawer
        </Button>
        <NavigationDrawer
          variant="modal"
          visible={open}
          onDismiss={() => setOpen(false)}
          title={props.title}
        >
          <DrawerContent
            selected={selected}
            onSelect={(id) => {
              setSelected(id);
              setOpen(false);
            }}
          />
        </NavigationDrawer>
      </>
    );
  }
  return (
    <View style={{ height: 440, width: "100%", maxWidth: 360 }}>
      <NavigationDrawer title={props.title} width={320}>
        <DrawerContent selected={selected} onSelect={setSelected} />
      </NavigationDrawer>
    </View>
  );
};

export const TopAppBarDemo = ({ props }: DemoProps) => (
  <View style={{ width: "100%", maxWidth: 480 }}>
    <TopAppBar
      title={props.title}
      subtitle={props.subtitle || undefined}
      variant={props.variant}
      elevated={props.elevated}
      safeArea={false}
      leading={
        <IconButton
          icon="arrow-left"
          accessibilityLabel="Back"
          onPress={() => {}}
        />
      }
      actions={
        <>
          <IconButton
            icon="magnify"
            accessibilityLabel="Search"
            onPress={() => {}}
          />
          <IconButton
            icon="dots-vertical"
            accessibilityLabel="More"
            onPress={() => {}}
          />
        </>
      }
    />
  </View>
);

const VIEWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export const ButtonGroupDemo = ({ props }: DemoProps) => {
  const [single, setSingle] = useState("week");
  const [many, setMany] = useState<string[]>(["day"]);
  return (
    <ButtonGroup
      options={VIEWS}
      value={props.multiSelect ? many : single}
      onValueChange={props.multiSelect ? setMany : setSingle}
      multiSelect={props.multiSelect}
      type={props.type}
      mode={props.mode}
      size={props.size}
      accessibilityLabel="Calendar view"
    />
  );
};

export const SplitButtonDemo = ({ props }: DemoProps) => (
  <SplitButton
    mode={props.mode}
    disabled={props.disabled}
    iconName="content-save-outline"
    onPress={() => {}}
    items={[
      {
        id: "copy",
        label: "Save a copy",
        icon: "content-copy",
        onPress: () => {},
      },
      {
        id: "draft",
        label: "Save as draft",
        icon: "file-outline",
        onPress: () => {},
      },
      {
        id: "discard",
        label: "Discard",
        icon: "delete-outline",
        destructive: true,
        dividerAbove: true,
        onPress: () => {},
      },
    ]}
  >
    {props.children}
  </SplitButton>
);

export const ToolbarDemo = ({ props }: DemoProps) => {
  const { theme } = useTheme();
  const vibrant = props.variant === "floating" && props.color === "vibrant";
  const actions = [
    "format-bold",
    "format-italic",
    "format-underline",
    "link",
  ].map((icon) => (
    <IconButton
      key={icon}
      icon={icon as any}
      accessibilityLabel={icon.replace("format-", "")}
      onPress={() => {}}
    />
  ));
  return (
    <View style={{ width: "100%", maxWidth: 480, alignItems: "center" }}>
      <Toolbar
        variant={props.variant}
        color={props.color}
        orientation={props.orientation}
        safeArea={false}
        accessibilityLabel="Formatting"
        fab={
          props.variant === "floating" && props.withFab ? (
            <FAB icon="plus" placement="inline" onPress={() => {}} />
          ) : undefined
        }
      >
        {actions}
      </Toolbar>
      {vibrant && (
        <Typography
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
        >
          Vibrant sits on primaryContainer.
        </Typography>
      )}
    </View>
  );
};

export const SideSheetDemo = ({ props }: DemoProps) => {
  const [open, setOpen] = useState(false);
  const sheet = (
    <SideSheet
      visible={open}
      onDismiss={() => setOpen(false)}
      modal={props.modal}
      side={props.side}
      title={props.title}
      actions={
        <>
          <Button onPress={() => setOpen(false)}>Apply</Button>
          <Button mode="outlined" onPress={() => setOpen(false)}>
            Reset
          </Button>
        </>
      }
    >
      <Typography variant="bodyMedium">
        Filters, details or a secondary form, beside the main content.
      </Typography>
    </SideSheet>
  );
  if (!props.modal) {
    return <View style={{ height: 360, alignSelf: "stretch" }}>{sheet}</View>;
  }
  return (
    <>
      <Button
        mode="tonal"
        iconName="filter-variant"
        onPress={() => setOpen(true)}
      >
        Open side sheet
      </Button>
      {sheet}
    </>
  );
};

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "review", label: "In review" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived", disabled: true },
];

export const ChipGroupDemo = ({ props }: DemoProps) => {
  const [single, setSingle] = useState<string | null>("open");
  const [many, setMany] = useState<string[]>(["open", "review"]);
  return (
    <View style={{ width: "100%", maxWidth: 420 }}>
      <ChipGroup
        options={STATUSES}
        value={props.multiSelect ? many : single}
        onValueChange={props.multiSelect ? setMany : setSingle}
        multiSelect={props.multiSelect}
        required={props.required}
        wrap={props.wrap}
        mode={props.mode}
        accessibilityLabel="Status"
      />
    </View>
  );
};

const ROWS = [
  { name: "Ada Lovelace", role: "Analyst", city: "London" },
  { name: "Grace Hopper", role: "Engineer", city: "New York" },
  { name: "Katherine Johnson", role: "Mathematician", city: "Hampton" },
];

export const TableDemo = () => (
  <View style={{ maxWidth: "100%" }}>
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell width={180}>Name</TableHeaderCell>
          <TableHeaderCell width={140}>Role</TableHeaderCell>
          <TableHeaderCell width={140}>City</TableHeaderCell>
        </TableRow>
      </TableHead>
      {ROWS.map((row) => (
        <TableRow key={row.name} style={{ minHeight: 48 }}>
          <TableCell width={180}>{row.name}</TableCell>
          <TableCell width={140}>{row.role}</TableCell>
          <TableCell width={140}>{row.city}</TableCell>
        </TableRow>
      ))}
    </Table>
  </View>
);

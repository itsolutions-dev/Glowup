// Stage demos for catalogue entries that need more than `<Component {...props} />`.
// Each is attached to its registry entry as `Demo`; ComponentPreview renders it
// with the panel's live props.
import { useState, type ReactNode } from "react";
import { Platform, View } from "react-native";
import {
  Button,
  ButtonGroup,
  CheckboxGroup,
  ChipGroup,
  DrawerItem,
  DrawerSection,
  FAB,
  IconButton,
  Drawer,
  NavigationRail,
  Rating,
  ConfirmDialog,
  Dialog,
  Form,
  Input,
  Menu,
  SplitButton,
  IFrame,
  Icon,
  ListItem,
  ListSection,
  ListSubheader,
  Accordion,
  Box,
  CaptionValue,
  Grid,
  Stat,
  StatusBadge,
  Switch,
  Table,
  Avatar,
  Chip,
  DataGrid,
  HStack,
  Stack,
  VStack,
  type ColumnDefinition,
  type TableColumn,
  type TableRowData,
  Toolbar,
  AppBar,
  Typography,
  useTheme,
  type DialogSlotStyles,
  type MenuItem,
  type Theme,
} from "@its/glowup-ui";
import type { DemoProps } from "./types";

const noop = () => {};

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
            <IconButton icon="menu" accessibilityLabel="Menu" onClick={noop} />
            <FAB icon="pencil-outline" placement="inline" onClick={noop} />
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
          onClick={() => onSelect(item.id)}
        />
      ))}
    </DrawerSection>
    <DrawerSection title="Labels" showDivider>
      <DrawerItem
        label="Family"
        icon="label-outline"
        selected={selected === "family"}
        onClick={() => onSelect("family")}
      />
      <DrawerItem
        label="Work"
        icon="label-outline"
        selected={selected === "work"}
        onClick={() => onSelect("work")}
      />
    </DrawerSection>
  </>
);

// A CRM-style menu: a group with sub-items, a collapsible section, a header.
const CrmDrawerContent = () => (
  <>
    <DrawerSection>
      <DrawerItem
        label="Customers"
        icon="account-multiple-outline"
        selected
        onClick={noop}
      />
      <DrawerItem label="Reports" icon="chart-box-outline" defaultExpanded>
        <DrawerItem label="Sales" onClick={noop} />
        <DrawerItem label="Agents" onClick={noop} />
      </DrawerItem>
    </DrawerSection>
    <DrawerSection title="Administration" showDivider collapsible>
      <DrawerItem label="Users" icon="shield-account-outline" onClick={noop} />
      <DrawerItem label="Routes" icon="sitemap-outline" onClick={noop} />
    </DrawerSection>
  </>
);

/**
 * A static drawer sits beside the page, so the stage draws a page for it to sit
 * beside, on the edge `position` names. A swipeable one opens from a button.
 * `props.layout` (set by the galleries, not the panel) swaps the content: `crm`
 * is a menu with groups, `sheet` is plain content with actions: the drawer as a
 * side sheet.
 */
export const DrawerDemo = ({ props, updateProp }: DemoProps) => {
  const { theme } = useTheme();
  const [selected, setSelected] = useState("inbox");
  const swipeable = props.variant === "swipeable";
  const position = props.position ?? "left";
  const crm = props.layout === "crm";
  const sheet = props.layout === "sheet";
  const close = () => updateProp("visible", false);
  const drawer = (
    <Drawer
      variant={swipeable ? "swipeable" : "static"}
      position={position}
      visible={!!props.visible}
      onClose={close}
      elevation={props.elevation === "" ? undefined : props.elevation}
      title={crm ? undefined : props.title}
      collapsed={!!props.collapsed}
      showCloseButton={props.showCloseButton}
      width={props.width}
      height={props.height}
      header={
        crm ? (
          props.collapsed ? (
            <IconButton
              icon="domain"
              accessibilityLabel="Acme"
              onClick={noop}
            />
          ) : (
            <Button variant="outlined">Acme · Rome</Button>
          )
        ) : undefined
      }
      actions={
        sheet ? (
          <>
            <Button onClick={close}>Apply</Button>
            <Button variant="outlined" onClick={close}>
              Reset
            </Button>
          </>
        ) : undefined
      }
    >
      {crm ? (
        <CrmDrawerContent />
      ) : sheet ? (
        <Typography variant="bodyMedium">
          Filters, details or a secondary form, beside the main content.
        </Typography>
      ) : (
        <DrawerContent
          selected={selected}
          onSelect={(id) => {
            setSelected(id);
            if (swipeable) close();
          }}
        />
      )}
    </Drawer>
  );

  if (swipeable) {
    return (
      <>
        <Button
          variant="tonal"
          iconName="menu"
          onClick={() => updateProp("visible", true)}
        >
          Open drawer
        </Button>
        {drawer}
      </>
    );
  }
  const vertical = position === "top" || position === "bottom";
  const atEnd = position === "right" || position === "bottom";
  // The drawer is the first child: reversing puts it on the far edge.
  const direction = vertical
    ? atEnd
      ? "column-reverse"
      : "column"
    : atEnd
      ? "row-reverse"
      : "row";
  return (
    <View
      style={{
        height: 440,
        width: "100%",
        maxWidth: 640,
        flexDirection: direction,
      }}
    >
      {drawer}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.surfaceContainerLow,
        }}
      >
        <Typography
          variant="labelMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Page content
        </Typography>
      </View>
    </View>
  );
};

// `props.paper` is set by the galleries, not the panel: an object has no control.
export const AppBarDemo = ({ props }: DemoProps) => (
  <View style={{ width: "100%", maxWidth: 480 }}>
    <AppBar
      title={props.title}
      subtitle={props.subtitle || undefined}
      variant={props.variant}
      elevated={props.elevated}
      divider={props.divider}
      paper={props.paper}
      safeArea={false}
      leading={
        <IconButton
          icon="arrow-left"
          accessibilityLabel="Back"
          onClick={noop}
        />
      }
      actions={
        <>
          <IconButton
            icon="magnify"
            accessibilityLabel="Search"
            onClick={noop}
          />
          <IconButton
            icon="dots-vertical"
            accessibilityLabel="More"
            onClick={noop}
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
    onPress={noop}
    items={[
      {
        id: "copy",
        label: "Save a copy",
        icon: "content-copy",
        onClick: noop,
      },
      {
        id: "draft",
        label: "Save as draft",
        icon: "file-outline",
        onClick: noop,
      },
      {
        id: "discard",
        label: "Discard",
        icon: "delete-outline",
        destructive: true,
        dividerAbove: true,
        onClick: noop,
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
      onClick={noop}
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
            <FAB icon="plus" placement="inline" onClick={noop} />
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

/** `customSlots`: one override per part, so the stage shows `slotStyles` at work. */
const demoSlotStyles = (theme: Theme): DialogSlotStyles => ({
  backdrop: { backgroundColor: theme.colors.primaryContainer, opacity: 0.7 },
  container: {
    borderRadius: theme.shape.small,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  title: { color: theme.colors.primary },
  actions: { justifyContent: "space-between" },
});

/**
 * Dialog's stage. With `form` on, the body is two fields and the actions end in
 * a `Button type="submit"`; submitting shows what the form carried.
 */
export const DialogDemo = ({ props, updateProp }: DemoProps) => {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const close = () => updateProp("visible", false);

  return (
    <View style={{ alignItems: "center", gap: 12 }}>
      <Button variant="tonal" onClick={() => updateProp("visible", true)}>
        Open Dialog
      </Button>
      {sent !== null && (
        <Typography
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Submitted: {sent}
        </Typography>
      )}
      <Dialog
        visible={!!props.visible}
        title={props.title}
        icon={props.icon || undefined}
        width={props.width}
        height={Number(props.height) || undefined}
        scrollable={props.scrollable}
        fullScreen={props.fullScreen}
        form={props.form}
        closeIcon={props.closeIcon}
        closeText={props.closeText}
        disableEscapeKeyDown={props.disableEscapeKeyDown}
        disableBackdropClick={props.disableBackdropClick}
        animationType={props.animationType}
        slotStyles={props.customSlots ? demoSlotStyles(theme) : undefined}
        onClose={close}
        onSubmit={() => {
          setSent(`${name || "no name"}, ${email || "no email"}`);
          close();
        }}
        actions={
          props.form ? (
            <>
              <Button variant="text" onClick={close}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </>
          ) : undefined
        }
      >
        {props.form ? (
          <View style={{ gap: 12, width: "100%" }}>
            <Typography
              variant="bodyMedium"
              style={{ color: theme.colors.onSurface, textAlign: "center" }}
            >
              {props.children}
            </Typography>
            <Input label="Name" value={name} onChange={setName} />
            <Input label="Email" value={email} onChange={setEmail} />
          </View>
        ) : (
          props.children
        )}
      </Dialog>
    </View>
  );
};

export const ConfirmDialogDemo = ({ props, updateProp }: DemoProps) => {
  const { theme } = useTheme();
  const close = () => updateProp("visible", false);
  return (
    <>
      <Button variant="tonal" onClick={() => updateProp("visible", true)}>
        Open Confirm Dialog
      </Button>
      <ConfirmDialog
        visible={!!props.visible}
        title={props.title}
        message={props.message}
        confirmText={props.confirmText}
        cancelText={props.cancelText}
        destructive={props.destructive}
        icon={props.icon || undefined}
        dismissable={props.dismissable}
        slotStyles={props.customSlots ? demoSlotStyles(theme) : undefined}
        onConfirm={close}
        onCancel={close}
      />
    </>
  );
};

/** Two fields and a submit button: what the form carried is shown below it. */
export const FormDemo = () => {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  return (
    <View style={{ width: "100%", maxWidth: 360, gap: 12 }}>
      <Form
        style={{ gap: 12 }}
        onSubmit={() =>
          setSubmitted(`${name || "no name"}, ${email || "no email"}`)
        }
      >
        <Input label="Name" value={name} onChange={setName} />
        <Input label="Email" value={email} onChange={setEmail} />
        <Button type="submit">Submit</Button>
      </Form>
      <Typography
        variant="bodySmall"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {submitted === null
          ? "Press Submit, or Enter in a field on the web."
          : `Submitted: ${submitted}`}
      </Typography>
    </View>
  );
};

const MENU_ITEMS: MenuItem[] = [
  { id: "edit", label: "Edit", icon: "pencil-outline", onClick: noop },
  {
    id: "duplicate",
    label: "Duplicate",
    icon: "content-copy",
    trailing: "Ctrl+D",
    onClick: noop,
  },
  {
    id: "delete",
    label: "Delete",
    icon: "delete-outline",
    destructive: true,
    dividerAbove: true,
    onClick: noop,
  },
];

/** Menu's stage: the menu's own `onClick` reports the item below the anchor. */
export const MenuDemo = ({ props, updateProp }: DemoProps) => {
  const { theme } = useTheme();
  const [clicked, setClicked] = useState<string | null>(null);
  return (
    <View style={{ alignItems: "center", gap: 12 }}>
      <Menu
        visible={!!props.visible}
        onClose={() => updateProp("visible", false)}
        closeOnSelect={props.closeOnSelect}
        anchorPosition={props.anchorPosition}
        dividers={props.dividers}
        selected={props.selected}
        onClick={(item) => setClicked(item.label)}
        items={MENU_ITEMS}
        anchor={
          <Button variant="tonal" onClick={() => updateProp("visible", true)}>
            Open Menu
          </Button>
        }
      />
      <Typography
        variant="bodySmall"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {clicked === null ? "Pick an item." : `Clicked: ${clicked}`}
      </Typography>
    </View>
  );
};

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "review", label: "In review" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived", disabled: true },
];

const CHANNELS = [
  { label: "Email", value: "email" },
  { label: "SMS", value: "sms" },
  { label: "Push (unavailable)", value: "push", disabled: true },
  { label: "Phone call", value: "call" },
];

/** The group owns an array, so the stage keeps it. */
export const CheckboxGroupDemo = ({ props }: DemoProps) => {
  const [channels, setChannels] = useState<string[]>(["email"]);
  return (
    <View style={{ width: "100%", maxWidth: 420 }}>
      <CheckboxGroup
        options={CHANNELS}
        value={channels}
        onChange={setChannels}
        label={props.label}
        direction={props.direction}
        required={props.required}
        disabled={props.disabled}
        error={props.error || undefined}
      />
    </View>
  );
};

/** Controlled, because hover and the half step only exist on an interactive rating. */
export const RatingDemo = ({ props, updateProp }: DemoProps) => (
  <Rating
    value={props.value}
    max={props.max}
    size={props.size}
    disabled={props.disabled}
    interval={props.interval}
    icon={props.icon}
    required={props.required}
    onChange={(value) => updateProp("value", value)}
  />
);

export const ChipGroupDemo = ({ props }: DemoProps) => {
  const [single, setSingle] = useState<string | null>("open");
  const [many, setMany] = useState<string[]>(["open", "review"]);
  return (
    <View style={{ width: "100%", maxWidth: 420 }}>
      <ChipGroup
        options={STATUSES}
        value={props.multiple ? many : single}
        onChange={props.multiple ? setMany : setSingle}
        multiple={props.multiple}
        required={props.required}
        wrap={props.wrap}
        variant={props.variant}
        accessibilityLabel="Status"
      />
    </View>
  );
};

const TABLE_COLUMNS: TableColumn[] = [
  { id: "id", label: "Order", width: 90 },
  // An empty cell draws its column's fallback.
  { id: "customer", label: "Customer", fallback: "Guest checkout" },
  { id: "status", label: "Status", width: 130 },
  { id: "total", label: "Total", alignment: "right", width: 100 },
];

const TABLE_STATUS = {
  Paid: "success",
  Pending: "warning",
  Refunded: "error",
} as const;

const TABLE_ORDERS = [
  { id: "#4821", customer: "Mara Quinn", status: "Paid", total: "€129.00" },
  { id: "#4820", customer: "Theo Alvarez", status: "Pending", total: "€54.90" },
  { id: "#4819", customer: "Priya Nair", status: "Paid", total: "€310.00" },
  // No customer: the column's fallback stands in.
  { id: "#4818", customer: "", status: "Paid", total: "€18.50" },
  { id: "#4817", customer: "Jonas Weber", status: "Refunded", total: "€76.00" },
  { id: "#4816", customer: "Lena Fischer", status: "Paid", total: "€42.00" },
  { id: "#4815", customer: "Omar Haddad", status: "Pending", total: "€208.40" },
  { id: "#4814", customer: "Sofia Rossi", status: "Paid", total: "€15.90" },
  { id: "#4813", customer: "Kenji Mori", status: "Paid", total: "€64.00" },
  { id: "#4812", customer: "Ines Duarte", status: "Refunded", total: "€99.00" },
  { id: "#4811", customer: "Noah Okafor", status: "Paid", total: "€27.50" },
  { id: "#4810", customer: "Elif Demir", status: "Pending", total: "€150.00" },
] as const;

// A cell is text, a number or any node: an avatar with a name, a status badge.
const TABLE_ROWS: TableRowData[] = TABLE_ORDERS.map((order) => ({
  id: order.id,
  customer: order.customer ? (
    <HStack spacing="s" align="center">
      <Avatar name={order.customer} size="small" />
      <Typography variant="bodyMedium">{order.customer}</Typography>
    </HStack>
  ) : null,
  status: (
    <StatusBadge label={order.status} type={TABLE_STATUS[order.status]} />
  ),
  total: order.total,
}));

/** Data driven: `columns` and `data` are fixed here, everything else is the panel's. */
export const TableDemo = ({ props }: DemoProps) => {
  const [clicked, setClicked] = useState<string | null>(null);
  return (
    <View style={{ width: "100%", maxWidth: 640, gap: 12 }}>
      <Table
        tableTitle={props.tableTitle || undefined}
        width={props.width || undefined}
        height={props.height || undefined}
        rowsPerPage={props.rowsPerPage || undefined}
        hover={props.hover}
        selected={props.selected}
        emptyMessage={props.emptyMessage}
        columns={TABLE_COLUMNS}
        data={props.empty ? [] : TABLE_ROWS}
        onClick={
          props.onClick
            ? (row, index) => setClicked(`${row.id} (row ${index + 1})`)
            : undefined
        }
      />
      {!!props.onClick && (
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {clicked ? `onClick: ${clicked}` : "Press a row."}
        </Typography>
      )}
    </View>
  );
};

/**
 * The panel's empty select or text means "unset", and width and height take dp
 * as text: what `Box` and `Stack` get is the cleaned-up version.
 */
const layoutProps = (props: Record<string, any>) => {
  const out = { ...props };
  for (const key of ["align", "justify", "width", "height"]) {
    if (out[key] === "") delete out[key];
    else if (/^d+(.d+)?$/.test(out[key])) out[key] = Number(out[key]);
  }
  return out;
};

const TEAM = [
  { name: "Mara Quinn", role: "Designer", status: "online" },
  { name: "Theo Alvarez", role: "Engineer", status: "busy" },
  { name: "Priya Nair", role: "Product", status: "online" },
  { name: "Jonas Weber", role: "Support", status: "away" },
  { name: "Lena Fischer", role: "Engineer", status: "online" },
  { name: "Omar Haddad", role: "Finance", status: "offline" },
  { name: "Sofia Rossi", role: "Marketing", status: "online" },
  { name: "Kenji Mori", role: "Data", status: "away" },
] as const;

/** What the Grid stage lays out: a person, so a size has something to size. */
const MemberTile = ({ member }: { member: (typeof TEAM)[number] }) => (
  <Box
    variant="centered-column-flex"
    gap={4}
    padding={12}
    radius="medium"
    background="surfaceContainerHigh"
    style={{ flex: 1 }}
  >
    <Avatar name={member.name} status={member.status} />
    <Typography variant="labelLarge" align="center">
      {member.name}
    </Typography>
    <Typography variant="bodySmall" color="onSurfaceVariant">
      {member.role}
    </Typography>
  </Box>
);

/** The panel drives the container; each tile is an item, and "Item Size" is theirs. */
export const GridDemo = ({ props }: DemoProps) => {
  const { size, columns, ...grid } = props;
  return (
    <View style={{ width: "100%", maxWidth: 560 }}>
      <Grid {...grid} columns={Math.max(1, Number(columns) || 1)}>
        {TEAM.map((member) => (
          <Grid key={member.name} size={size === "" ? undefined : size}>
            <MemberTile member={member} />
          </Grid>
        ))}
      </Grid>
    </View>
  );
};

/** A profile summary: children of different sizes show what a variant does to them. */
export const BoxDemo = ({ props }: DemoProps) => {
  const { theme } = useTheme();
  // A Box fills its parent in the `full-*` variants, so it gets a frame.
  return (
    <View
      style={{
        width: "100%",
        maxWidth: 420,
        height: 340,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: theme.colors.outlineVariant,
      }}
    >
      <Box {...layoutProps(props)}>
        <Avatar
          name="Mara Quinn"
          size="large"
          status="online"
          backgroundColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
        />
        <Typography variant="titleMedium">Mara Quinn</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          Product designer
        </Typography>
        <Chip label="Admin" variant="tonal" />
        <Button variant="tonal" iconName="email-outline" onClick={noop}>
          Message
        </Button>
      </Box>
    </View>
  );
};

const FACTS = [
  ["Plan", "Team"],
  ["Seats", "12 of 20"],
  ["Billing", "Annual"],
  ["Renews", "14 Nov"],
  ["Owner", "Mara Quinn"],
];

/** A subscription's details: a label over a value, five times. */
export const StackDemo = ({ props }: DemoProps) => (
  <View style={{ width: "100%", maxWidth: 420 }}>
    <Stack {...layoutProps(props)}>
      {FACTS.map(([label, value]) => (
        <VStack key={label} spacing="xs">
          <Typography variant="labelSmall" color="onSurfaceVariant">
            {label}
          </Typography>
          <Typography variant="titleMedium">{value}</Typography>
        </VStack>
      ))}
    </Stack>
  </View>
);

const GRID_STATUS = {
  Paid: "success",
  Due: "warning",
  Overdue: "error",
} as const;

const GRID_COLUMNS: ColumnDefinition[] = [
  { id: "id", label: "Invoice", width: 110 },
  { id: "client", label: "Client", width: 170, sortable: true },
  { id: "issued", label: "Issued", width: 120, sortable: true },
  {
    id: "status",
    label: "Status",
    width: 120,
    renderCell: (status: keyof typeof GRID_STATUS) => (
      <StatusBadge label={status} type={GRID_STATUS[status]} />
    ),
  },
  {
    id: "total",
    label: "Total",
    width: 110,
    align: "right",
    sortable: true,
    renderCell: (total: number) => `€${total.toFixed(2)}`,
  },
];

const GRID_ROWS = (
  [
    ["INV-2051", "Brightside Studio", "2026-11-30", "Due", 1240.5],
    ["INV-2050", "Hollis & Park", "2026-11-28", "Due", 380],
    ["INV-2049", "Lumen Logistics", "2026-11-12", "Overdue", 4905.2],
    ["INV-2048", "Kestrel Foods", "2026-11-09", "Paid", 72.9],
    ["INV-2047", "Fernhill Dental", "2026-11-05", "Overdue", 2110],
    ["INV-2046", "Oakline Joinery", "2026-11-01", "Paid", 960],
    ["INV-2045", "Tidewater Café", "2026-10-29", "Paid", 145.3],
    ["INV-2044", "Northgate Books", "2026-10-22", "Paid", 518.75],
    ["INV-2043", "Pinecrest Vets", "2026-10-18", "Paid", 2300],
    ["INV-2042", "Marlow Print Co.", "2026-10-15", "Paid", 89],
  ] as const
).map(([id, client, issued, status, total]) => ({
  id,
  client,
  issued,
  status,
  total,
}));

/** Data driven and sortable: the grid reports the sort, the stage orders the rows. */
export const DataGridDemo = ({ props }: DemoProps) => {
  const [sort, setSort] = useState<{
    column: string;
    direction: "asc" | "desc";
  }>({ column: "issued", direction: "desc" });
  const column = sort.column as keyof (typeof GRID_ROWS)[number];
  const rows = [...GRID_ROWS].sort(
    (a, b) =>
      String(a[column]).localeCompare(String(b[column]), "en", {
        numeric: true,
      }) * (sort.direction === "asc" ? 1 : -1),
  );
  return (
    // The columns add up to 630: a wider frame would leave an empty strip.
    <View style={{ width: "100%", maxWidth: 632, height: 360 }}>
      <DataGrid
        data={props.empty ? [] : rows}
        columns={GRID_COLUMNS}
        density={props.density}
        loading={props.loading}
        emptyMessage={props.emptyMessage}
        sortColumn={sort.column}
        sortDirection={sort.direction}
        onSort={(next, direction) => setSort({ column: next, direction })}
      />
    </View>
  );
};

/**
 * `action` is a node: the panel picks which one the stage draws. The item sits
 * in a short settings list, the way a row is used, between rows of its own kind.
 */
export const ListItemDemo = ({ props }: DemoProps) => {
  const { theme } = useTheme();
  const [on, setOn] = useState(true);
  const chevron = (
    <Icon
      source="chevron-right"
      size={20}
      color={theme.colors.onSurfaceVariant}
    />
  );
  const action = {
    chevron,
    text: <Typography variant="labelLarge">Owner</Typography>,
    switch: <Switch value={on} onChange={setOn} />,
    iconButton: (
      <IconButton
        icon="dots-vertical"
        accessibilityLabel="More"
        onClick={noop}
      />
    ),
    badge: <StatusBadge label="Active" />,
  }[props.action as string];
  return (
    <View style={{ width: "100%", maxWidth: 420 }}>
      <ListSection title="Workspace settings">
        <ListItem
          icon="account-outline"
          primaryText="Profile"
          secondaryText="Name, photo and email"
          action={chevron}
          onClick={noop}
        />
        <ListItem
          primaryText={props.primaryText}
          secondaryText={props.secondaryText || undefined}
          icon={props.icon || undefined}
          action={action}
          trailingWidth={props.trailingWidth || undefined}
          onClick={props.onClick ? noop : undefined}
          disabled={props.disabled}
          dimmed={props.dimmed}
          indicatorColor={props.indicatorColor || undefined}
        />
        <ListItem
          icon="credit-card-outline"
          primaryText="Billing"
          secondaryText="Plan, invoices and payment methods"
          action={chevron}
          onClick={noop}
        />
        <ListItem
          icon="shield-lock-outline"
          primaryText="Security"
          secondaryText="Password and two-step verification"
          action={chevron}
          onClick={noop}
        />
      </ListSection>
    </View>
  );
};

/** The panel drives the first section; a second one below shows what `divider` separates. */
export const ListSectionDemo = ({ props }: DemoProps) => (
  <View style={{ width: "100%", maxWidth: 420 }}>
    <ListSection title={props.title} divider={props.divider}>
      <ListItem
        icon="email-outline"
        primaryText="Email digest"
        secondaryText="A summary of what you missed"
        action={<Typography variant="labelLarge">Weekly</Typography>}
      />
      <ListItem
        icon="at"
        primaryText="Mentions"
        secondaryText="When someone tags you"
        action={<Typography variant="labelLarge">Instant</Typography>}
      />
      <ListItem
        icon="comment-text-outline"
        primaryText="Comments"
        secondaryText="Replies to your threads"
        action={<Typography variant="labelLarge">Off</Typography>}
      />
    </ListSection>
    <ListSection title="Privacy">
      <ListItem
        icon="eye-outline"
        primaryText="Profile visibility"
        action={<Typography variant="labelLarge">Team only</Typography>}
      />
      <ListItem
        icon="map-marker-outline"
        primaryText="Show my location"
        action={<Typography variant="labelLarge">Never</Typography>}
      />
    </ListSection>
  </View>
);

/** The panel's subheader opens the first group; a fixed one opens the second. */
export const ListSubheaderDemo = ({ props }: DemoProps) => (
  <View style={{ width: "100%", maxWidth: 420 }}>
    <ListSubheader>{props.children}</ListSubheader>
    <ListItem
      icon="translate"
      primaryText="Language"
      action={<Typography variant="labelLarge">English</Typography>}
    />
    <ListItem
      icon="theme-light-dark"
      primaryText="Theme"
      action={<Typography variant="labelLarge">System</Typography>}
    />
    <ListSubheader>Account</ListSubheader>
    <ListItem
      icon="email-outline"
      primaryText="Email"
      action={<Typography variant="labelLarge">ada@example.com</Typography>}
    />
    <ListItem icon="lock-outline" primaryText="Password" />
  </View>
);

/**
 * The panel drives the first question of a short FAQ. The others take its
 * `variant` so the stack reads as one list, and open independently.
 */
export const AccordionDemo = ({ props, updateProp }: DemoProps) => {
  return (
    <View style={{ width: "100%", maxWidth: 420, gap: 8 }}>
      <Accordion
        title={props.title}
        expanded={props.expanded}
        variant={props.variant}
        icon={props.icon || undefined}
        // The header toggles it, and the switch in the panel follows.
        onClick={(open: boolean) => updateProp("expanded", open)}
      >
        {props.children}
      </Accordion>
      <Accordion variant={props.variant} title="Where do I find my invoices?">
        Under Settings, then Billing. Every invoice is a PDF.
      </Accordion>
      <Accordion variant={props.variant} title="Can I export my data?">
        Any list can be exported as CSV from its menu.
      </Accordion>
    </View>
  );
};

/** The panel drives the first tile of a small KPI board; the others follow its `direction`. */
export const StatDemo = ({ props }: DemoProps) => {
  const { theme } = useTheme();
  const tile = (key: string, stat: ReactNode) => (
    <Box
      key={key}
      background="surfaceContainerLow"
      radius="medium"
      padding={theme.spacing.m}
    >
      {stat}
    </Box>
  );
  return (
    <View style={{ width: "100%", maxWidth: 640 }}>
      <Grid container spacing="m" autoSize={{ xs: 12, sm: 6 }}>
        {tile(
          "panel",
          <Stat
            label={props.label}
            value={props.value}
            trend={props.trend}
            trendColor={props.trendColor}
            direction={props.direction}
            delta={props.delta || undefined}
            helpText={props.helpText || undefined}
            icon={props.icon || undefined}
          />,
        )}
        {tile(
          "orders",
          <Stat
            label="Orders"
            value="1,284"
            delta="4.1%"
            trend="up"
            icon="cart-outline"
            helpText="vs. last month"
            direction={props.direction}
          />,
        )}
        {tile(
          "refunds",
          <Stat
            label="Refund rate"
            value="1.8%"
            delta="0.4%"
            trend="down"
            trendColor="success"
            icon="cash-refund"
            helpText="vs. last month"
            direction={props.direction}
          />,
        )}
        {tile(
          "tickets",
          <Stat
            label="Open tickets"
            value="37"
            delta="9"
            trend="up"
            trendColor="error"
            icon="lifebuoy"
            helpText="vs. last month"
            direction={props.direction}
          />,
        )}
      </Grid>
    </View>
  );
};

/**
 * A customer's details panel: the panel's pair sits beside another in a row, so
 * `flex` and `width` have a neighbour to share with, over two fixed pairs.
 */
export const CaptionValueDemo = ({ props }: DemoProps) => {
  const { theme } = useTheme();
  const own = { ...props };
  // 0 stands for "not set" on these four, which the panel cannot leave empty.
  for (const key of ["width", "height", "flex", "padding"]) {
    if (!own[key]) delete own[key];
  }
  return (
    <View
      style={{
        width: "100%",
        maxWidth: 420,
        gap: theme.spacing.m,
        padding: theme.spacing.m,
        borderRadius: theme.shape.medium,
        backgroundColor: theme.colors.surfaceContainerLow,
      }}
    >
      <Typography variant="titleSmall">Customer</Typography>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: theme.spacing.m,
        }}
      >
        {/* On native the copy button shows only with a handler that does the copying. */}
        <CaptionValue {...own} onCopy={noop} />
        <CaptionValue caption="Company" value="Northwind Traders" flex={1} />
      </View>
      <CaptionValue caption="Email" value="ada.lovelace@example.com" />
      <CaptionValue caption="Customer since" value="March 2019" />
    </View>
  );
};

export const IFrameDemo = ({ props }: DemoProps) => {
  const { theme } = useTheme();
  // The `src` the last `onLoad` was for: a new one loads, and reports, again.
  const [loaded, setLoaded] = useState<string | null>(null);
  return (
    <View style={{ width: "100%", maxWidth: 560, gap: 8 }}>
      <IFrame
        src={props.src}
        title={props.title}
        width={props.width || undefined}
        height={props.height}
        allow={props.allow || undefined}
        sandbox={props.sandbox}
        referrerPolicy={props.referrerPolicy}
        loading={props.loading}
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
        }}
        onLoad={() => setLoaded(props.src)}
      />
      {Platform.OS === "web" && (
        <Typography
          variant="labelSmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {loaded === props.src ? "onLoad: the page has loaded" : "Loading…"}
        </Typography>
      )}
    </View>
  );
};

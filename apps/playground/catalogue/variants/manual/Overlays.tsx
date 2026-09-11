import { useCallback, useState } from "react";
import { View } from "react-native";
import {
  Avatar,
  BottomSheet,
  Button,
  Chip,
  ConfirmDialog,
  Divider,
  Menu,
  Modal,
  Popover,
  Typography,
} from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo } from "./shared";

// Hand-written for the same reason as Tooltip and Autocomplete: the authored
// previews force a transient state open so the capture has something to
// photograph. These five portal into the document behind a fixed scrim, so on
// a live page an always-open one is not a demo inside a card — it is a dialog
// over the whole site, three deep on some pages, and the previews' no-op
// handlers mean none of them can be dismissed. The state is real here: each
// opens from its own trigger and closes the way it would in an app.
//
// Popover and Menu need no separate trigger. Their anchor is the trigger, and
// wiring it is the usage.

const useDisclosure = () => {
  const [open, setOpen] = useState(false);
  return {
    open,
    show: useCallback(() => setOpen(true), []),
    close: useCallback(() => setOpen(false), []),
  };
};

const column = { flexDirection: "column", gap: 8 } as const;

// ── Modal ───────────────────────────────────────────────────────────────────

const Dialog = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Button mode="tonal" onPress={show}>
        Publish 0.1.0
      </Button>
      <Modal
        visible={open}
        title="Publish 0.1.0"
        closeText="Close"
        onClose={close}
        onDismiss={close}
      >
        Publishing makes every component in this library available to the Glowup
        playground and to any workspace that depends on it.
      </Modal>
    </View>
  );
};

const RichContent = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Button mode="tonal" onPress={show}>
        Invite your team
      </Button>
      <Modal visible={open} title="Invite your team" onDismiss={close}>
        <View style={{ flexDirection: "column", gap: 4 }}>
          <Typography variant="bodyMedium">
            Everyone you invite gets read access to the shared component
            library. You can raise their role later from Settings.
          </Typography>
          <View style={{ height: 12 }} />
          <Typography variant="labelLarge">Invitees</Typography>
          <Typography variant="bodySmall">marta@itsol.it · Viewer</Typography>
          <Typography variant="bodySmall">luca@itsol.it · Viewer</Typography>
          <View style={{ height: 12 }} />
          <Divider contentSpacing={0} />
          <View style={{ height: 12 }} />
          <View
            style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}
          >
            <Button mode="text" onPress={close}>
              Not now
            </Button>
            <Button
              mode="filled"
              iconName="account-plus-outline"
              onPress={close}
            >
              Send invites
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Untitled = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Button mode="tonal" onPress={show}>
        Release notes
      </Button>
      <Modal
        visible={open}
        closeText="Got it"
        onClose={close}
        onDismiss={close}
      >
        Dark mode contrast was corrected across every tonal surface.
      </Modal>
    </View>
  );
};

// ── ConfirmDialog ───────────────────────────────────────────────────────────

const Destructive = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Button mode="tonal" iconName="delete-outline" onPress={show}>
        Delete Chip
      </Button>
      <ConfirmDialog
        visible={open}
        title="Delete Chip?"
        message="Chip is used by 6 screens. Deleting it removes those usages and cannot be undone."
        confirmText="Delete"
        cancelText="Keep"
        onConfirm={close}
        onCancel={close}
      />
    </View>
  );
};

const Confirm = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Button mode="tonal" onPress={show}>
        Publish
      </Button>
      <ConfirmDialog
        visible={open}
        title="Publish 0.1.0?"
        message="34 components will be pushed to the registry and every dependent workspace will see the update."
        confirmText="Publish"
        cancelText="Not yet"
        onConfirm={close}
        onCancel={close}
      />
    </View>
  );
};

const DefaultLabels = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Button mode="outlined" onPress={show}>
        Discard draft
      </Button>
      <ConfirmDialog
        visible={open}
        title="Discard draft?"
        message="Your unsaved changes to the login screen will be lost."
        onConfirm={close}
        onCancel={close}
      />
    </View>
  );
};

// ── BottomSheet ─────────────────────────────────────────────────────────────

const FilterSheet = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Button mode="tonal" iconName="filter-variant" onPress={show}>
        Filter components
      </Button>
      <BottomSheet visible={open} title="Filter components" onDismiss={close}>
        <View style={column}>
          <Typography variant="labelLarge">Group</Typography>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Chip
              label="Buttons & actions"
              size="small"
              mode="tonal"
              selected
              onPress={() => {}}
            />
            <Chip
              label="Inputs & forms"
              size="small"
              mode="outlined"
              onPress={() => {}}
            />
            <Chip
              label="Feedback"
              size="small"
              mode="outlined"
              onPress={() => {}}
            />
            <Chip
              label="Navigation"
              size="small"
              mode="outlined"
              onPress={() => {}}
            />
          </View>
          <View style={{ height: 4 }} />
          <Divider contentSpacing={0} />
          <View style={{ height: 4 }} />
          <Typography variant="labelLarge">Status</Typography>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Chip
              label="Stable"
              size="small"
              mode="tonal"
              selected
              onPress={() => {}}
            />
            <Chip
              label="Deprecated"
              size="small"
              mode="outlined"
              onPress={() => {}}
            />
          </View>
          <View style={{ height: 12 }} />
          <Button mode="filled" fullWidth onPress={close}>
            Show 12 components
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
};

const ActionSheet = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Button mode="tonal" iconName="dots-horizontal" onPress={show}>
        Chip actions
      </Button>
      <BottomSheet visible={open} title="Chip" onDismiss={close}>
        <View style={column}>
          <Button
            mode="text"
            fullWidth
            iconName="pencil-outline"
            onPress={close}
          >
            Edit props
          </Button>
          <Button mode="text" fullWidth iconName="content-copy" onPress={close}>
            Duplicate component
          </Button>
          <Button
            mode="text"
            fullWidth
            iconName="share-variant"
            onPress={close}
          >
            Share preview link
          </Button>
          <Divider contentSpacing={0} />
          <Button
            mode="text"
            fullWidth
            iconName="delete-outline"
            onPress={close}
          >
            Delete
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
};

const NoHandle = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Button mode="outlined" iconName="sort" onPress={show}>
        Sort by
      </Button>
      <BottomSheet
        visible={open}
        showHandle={false}
        title="Sort by"
        onDismiss={close}
      >
        <View style={column}>
          <Chip
            label="Recently updated"
            mode="tonal"
            selected
            onPress={() => {}}
          />
          <Chip label="Name A–Z" mode="outlined" onPress={() => {}} />
          <Chip label="Most used" mode="outlined" onPress={() => {}} />
          <View style={{ height: 8 }} />
          <Button mode="filled" fullWidth onPress={close}>
            Apply
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
};

const ReleaseNotes = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Button mode="outlined" onPress={show}>
        Release notes
      </Button>
      <BottomSheet
        visible={open}
        title="Release notes 0.1.0"
        maxHeightRatio={0.5}
        onDismiss={close}
      >
        <View style={column}>
          <Typography variant="bodyMedium">
            Dark mode contrast was corrected across every tonal surface, Chip
            gained a compact size, and DataGrid now keeps its header pinned
            while the body scrolls.
          </Typography>
          <View style={{ height: 8 }} />
          <Button mode="tonal" fullWidth onPress={close}>
            Read the full changelog
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
};

// ── Popover ─────────────────────────────────────────────────────────────────

const AccountCard = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Popover
        visible={open}
        onDismiss={close}
        anchor={
          <Button mode="tonal" iconName="account-outline" onPress={show}>
            Marta Rossi
          </Button>
        }
      >
        <View style={{ flexDirection: "column", padding: 12, gap: 6 }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Avatar name="Marta Rossi" size={36} status="online" />
            <View style={{ flexDirection: "column", gap: 2 }}>
              <Typography variant="titleSmall">Marta Rossi</Typography>
              <Typography variant="bodySmall">marta@itsol.it</Typography>
            </View>
          </View>
          <Divider contentSpacing={0} />
          <Button mode="text" fullWidth iconName="cog-outline" onPress={close}>
            Settings
          </Button>
          <Button mode="text" fullWidth iconName="logout" onPress={close}>
            Sign out
          </Button>
        </View>
      </Popover>
    </View>
  );
};

const MatchAnchorWidth = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={[demo.row, { width: 320 }]}>
      <Popover
        visible={open}
        matchAnchorWidth
        onDismiss={close}
        anchor={
          <Button
            mode="outlined"
            fullWidth
            iconName="chevron-down"
            iconPosition="right"
            onPress={show}
          >
            Buttons &amp; actions
          </Button>
        }
      >
        <View style={{ flexDirection: "column", padding: 8 }}>
          {[
            "Buttons & actions",
            "Inputs & forms",
            "Feedback & overlays",
            "Navigation",
          ].map((group) => (
            <Button key={group} mode="text" fullWidth onPress={close}>
              {group}
            </Button>
          ))}
        </View>
      </Popover>
    </View>
  );
};

const HelpBubble = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Popover
        visible={open}
        onDismiss={close}
        anchor={
          <Button mode="outlined" iconName="help-circle-outline" onPress={show}>
            Token sets
          </Button>
        }
      >
        <View style={{ flexDirection: "column", padding: 12, gap: 6 }}>
          <Typography variant="titleSmall">Token sets</Typography>
          <Typography variant="bodySmall">
            Swapping the set restyles every component at once.
          </Typography>
        </View>
      </Popover>
    </View>
  );
};

// ── Menu ────────────────────────────────────────────────────────────────────

const ContextMenu = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Menu
        visible={open}
        onDismiss={close}
        anchor={
          <Button mode="tonal" iconName="dots-vertical" onPress={show}>
            Chip
          </Button>
        }
        items={[
          {
            id: "edit",
            label: "Edit props",
            icon: "pencil-outline",
            onPress: close,
          },
          {
            id: "duplicate",
            label: "Duplicate",
            icon: "content-copy",
            trailing: "Ctrl+D",
            onPress: close,
          },
          {
            id: "share",
            label: "Copy link",
            icon: "link-variant",
            onPress: close,
          },
          {
            id: "delete",
            label: "Delete",
            icon: "delete-outline",
            destructive: true,
            onPress: close,
          },
        ]}
      />
    </View>
  );
};

const WithDisabledItems = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Menu
        visible={open}
        onDismiss={close}
        anchor={
          <Button mode="outlined" iconName="export-variant" onPress={show}>
            Export
          </Button>
        }
        items={[
          { id: "png", label: "PNG", icon: "image-outline", onPress: close },
          { id: "svg", label: "SVG", icon: "vector-square", onPress: close },
          {
            id: "figma",
            label: "Figma library",
            icon: "shape-outline",
            trailing: "Pro",
            disabled: true,
            onPress: close,
          },
          {
            id: "npm",
            label: "npm package",
            icon: "package-variant-closed",
            trailing: "Pro",
            disabled: true,
            onPress: close,
          },
        ]}
      />
    </View>
  );
};

const AccountMenu = () => {
  const { open, show, close } = useDisclosure();
  return (
    <View style={demo.row}>
      <Menu
        visible={open}
        closeOnSelect={false}
        onDismiss={close}
        anchor={
          <Avatar name="Marta Rossi" size={40} status="online" onPress={show} />
        }
        items={[
          {
            id: "profile",
            label: "Marta Rossi",
            icon: "account-outline",
            onPress: () => {},
          },
          {
            id: "theme",
            label: "Appearance",
            icon: "theme-light-dark",
            onPress: () => {},
          },
          {
            id: "lang",
            label: "Language",
            icon: "translate",
            trailing: "EN",
            onPress: () => {},
          },
          { id: "settings", label: "Settings", icon: "cog", onPress: () => {} },
          { id: "logout", label: "Sign out", icon: "logout", onPress: close },
        ]}
      />
    </View>
  );
};

export const modalVariants: Variant[] = [
  { name: "Dialog", title: "Dialog", render: Dialog },
  { name: "RichContent", title: "Rich content", render: RichContent },
  { name: "Untitled", title: "Untitled", render: Untitled },
];

export const confirmDialogVariants: Variant[] = [
  { name: "Destructive", title: "Destructive", render: Destructive },
  { name: "Confirm", title: "Confirm", render: Confirm },
  { name: "DefaultLabels", title: "Default labels", render: DefaultLabels },
];

export const bottomSheetVariants: Variant[] = [
  { name: "FilterSheet", title: "Filter sheet", render: FilterSheet },
  { name: "ActionSheet", title: "Action sheet", render: ActionSheet },
  { name: "NoHandle", title: "No handle", render: NoHandle },
  { name: "ReleaseNotes", title: "Release notes", render: ReleaseNotes },
];

export const popoverVariants: Variant[] = [
  { name: "AccountCard", title: "Account card", render: AccountCard },
  {
    name: "MatchAnchorWidth",
    title: "Match anchor width",
    render: MatchAnchorWidth,
  },
  { name: "HelpBubble", title: "Help bubble", render: HelpBubble },
];

export const menuVariants: Variant[] = [
  { name: "ContextMenu", title: "Context menu", render: ContextMenu },
  {
    name: "WithDisabledItems",
    title: "With disabled items",
    render: WithDisabledItems,
  },
  { name: "AccountMenu", title: "Account menu", render: AccountMenu },
];

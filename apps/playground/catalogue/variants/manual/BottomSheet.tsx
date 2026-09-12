import { View } from "react-native";
import { BottomSheet, Button, Chip, Divider, Typography } from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo, useOverlayDemo } from "./shared";

// Hand-written because the authored preview mounts the sheet already open, and
// an open sheet is a portal with a scrim over the whole page. See
// `useOverlayDemo`.

const FilterSheet = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Typography variant="headlineSmall">Components</Typography>
      <Typography variant="bodyMedium">34 results</Typography>
      <Button mode="tonal" iconName="filter-variant" onPress={show}>
        Filter components
      </Button>
      <BottomSheet visible={open} title="Filter components" onDismiss={hide}>
        <View style={demo.stack}>
          <Typography variant="labelLarge">Group</Typography>
          <View style={demo.row}>
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
          <Divider contentSpacing={0} />
          <Typography variant="labelLarge">Status</Typography>
          <View style={demo.row}>
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
          <Button mode="filled" fullWidth onPress={hide}>
            Show 12 components
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
};

const ActionSheet = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Typography variant="headlineSmall">Chip</Typography>
      <Typography variant="bodyMedium">Buttons & actions</Typography>
      <Button mode="outlined" iconName="dots-horizontal" onPress={show}>
        More actions
      </Button>
      <BottomSheet visible={open} title="Chip" onDismiss={hide}>
        <View style={demo.stack}>
          <Button
            mode="text"
            fullWidth
            iconName="pencil-outline"
            onPress={hide}
          >
            Edit props
          </Button>
          <Button mode="text" fullWidth iconName="content-copy" onPress={hide}>
            Duplicate component
          </Button>
          <Button mode="text" fullWidth iconName="share-variant" onPress={hide}>
            Share preview link
          </Button>
          <Divider contentSpacing={0} />
          <Button
            mode="text"
            fullWidth
            iconName="delete-outline"
            onPress={hide}
          >
            Delete
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
};

const NoHandle = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Button mode="outlined" iconName="sort" onPress={show}>
        Sort by
      </Button>
      <BottomSheet
        visible={open}
        showHandle={false}
        title="Sort by"
        onDismiss={hide}
      >
        <View style={demo.stack}>
          <Chip
            label="Recently updated"
            mode="tonal"
            selected
            onPress={() => {}}
          />
          <Chip label="Name A–Z" mode="outlined" onPress={() => {}} />
          <Chip label="Most used" mode="outlined" onPress={() => {}} />
          <Button mode="filled" fullWidth onPress={hide}>
            Apply
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
};

const ReleaseNotes = () => {
  const { open, show, hide } = useOverlayDemo();

  return (
    <View style={demo.panel}>
      <Button mode="tonal" iconName="text-box-outline" onPress={show}>
        Release notes 0.1.0
      </Button>
      <BottomSheet
        visible={open}
        title="Release notes 0.1.0"
        maxHeightRatio={0.5}
        onDismiss={hide}
      >
        <View style={demo.stack}>
          <Typography variant="bodyMedium">
            Dark mode contrast was corrected across every tonal surface, Chip
            gained a compact size, and DataGrid now keeps its header pinned
            while the body scrolls.
          </Typography>
          <Button mode="tonal" fullWidth onPress={hide}>
            Read the full changelog
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
};

export const variants: Variant[] = [
  { name: "FilterSheet", title: "Filter sheet", render: FilterSheet },
  { name: "ActionSheet", title: "Action sheet", render: ActionSheet },
  {
    name: "NoHandle",
    title: "No handle",
    description:
      "Without the drag handle the sheet is dismissed by its own actions.",
    render: NoHandle,
  },
  {
    name: "ReleaseNotes",
    title: "Release notes",
    description: "maxHeightRatio caps the sheet at half the window.",
    render: ReleaseNotes,
  },
];

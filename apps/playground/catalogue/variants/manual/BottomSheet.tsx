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
      <Button variant="tonal" iconName="filter-variant" onClick={show}>
        Filter components
      </Button>
      <BottomSheet visible={open} title="Filter components" onClose={hide}>
        <View style={demo.stack}>
          <Typography variant="labelLarge">Group</Typography>
          <View style={demo.row}>
            <Chip
              label="Buttons & actions"
              size="small"
              variant="tonal"
              selected
              onClick={() => {}}
            />
            <Chip
              label="Inputs & forms"
              size="small"
              variant="outlined"
              onClick={() => {}}
            />
            <Chip
              label="Feedback"
              size="small"
              variant="outlined"
              onClick={() => {}}
            />
            <Chip
              label="Navigation"
              size="small"
              variant="outlined"
              onClick={() => {}}
            />
          </View>
          <Divider contentSpacing={0} />
          <Typography variant="labelLarge">Status</Typography>
          <View style={demo.row}>
            <Chip
              label="Stable"
              size="small"
              variant="tonal"
              selected
              onClick={() => {}}
            />
            <Chip
              label="Deprecated"
              size="small"
              variant="outlined"
              onClick={() => {}}
            />
          </View>
          <Button variant="filled" fullWidth onClick={hide}>
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
      <Button variant="outlined" iconName="dots-horizontal" onClick={show}>
        More actions
      </Button>
      <BottomSheet visible={open} title="Chip" onClose={hide}>
        <View style={demo.stack}>
          <Button
            variant="text"
            fullWidth
            iconName="pencil-outline"
            onClick={hide}
          >
            Edit props
          </Button>
          <Button
            variant="text"
            fullWidth
            iconName="content-copy"
            onClick={hide}
          >
            Duplicate component
          </Button>
          <Button
            variant="text"
            fullWidth
            iconName="share-variant"
            onClick={hide}
          >
            Share preview link
          </Button>
          <Divider contentSpacing={0} />
          <Button
            variant="text"
            fullWidth
            iconName="delete-outline"
            onClick={hide}
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
      <Button variant="outlined" iconName="sort" onClick={show}>
        Sort by
      </Button>
      <BottomSheet
        visible={open}
        showHandle={false}
        title="Sort by"
        onClose={hide}
      >
        <View style={demo.stack}>
          <Chip
            label="Recently updated"
            variant="tonal"
            selected
            onClick={() => {}}
          />
          <Chip label="Name A–Z" variant="outlined" onClick={() => {}} />
          <Chip label="Most used" variant="outlined" onClick={() => {}} />
          <Button variant="filled" fullWidth onClick={hide}>
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
      <Button variant="tonal" iconName="text-box-outline" onClick={show}>
        Release notes 0.1.0
      </Button>
      <BottomSheet
        visible={open}
        title="Release notes 0.1.0"
        maxHeightRatio={0.5}
        onClose={hide}
      >
        <View style={demo.stack}>
          <Typography variant="bodyMedium">
            Dark mode contrast was corrected across every tonal surface, Chip
            gained a compact size, and DataGrid now keeps its header pinned
            while the body scrolls.
          </Typography>
          <Button variant="tonal" fullWidth onClick={hide}>
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

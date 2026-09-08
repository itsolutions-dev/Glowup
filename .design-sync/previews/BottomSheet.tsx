import React from "react";
import { BottomSheet, Typography, Button, Chip, Divider } from "@glowup/ui";

// BottomSheet renders through react-native-web's Modal — a real portal into
// document.body with a position: fixed scrim — so it fills the capture
// viewport, not the card. Needs cfg.overrides
// { cardMode: "single", viewport: "420x620" }.
const behind: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  width: 360,
};

const column: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

export const FilterSheet = () => (
  <div style={behind}>
    <Typography variant="headlineSmall">Components</Typography>
    <Typography variant="bodyMedium">34 results</Typography>
    <BottomSheet visible title="Filter components" onDismiss={() => {}}>
      <div style={column}>
        <Typography variant="labelLarge">Group</Typography>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Chip label="Buttons & actions" size="small" mode="tonal" selected onPress={() => {}} />
          <Chip label="Inputs & forms" size="small" mode="outlined" onPress={() => {}} />
          <Chip label="Feedback" size="small" mode="outlined" onPress={() => {}} />
          <Chip label="Navigation" size="small" mode="outlined" onPress={() => {}} />
        </div>
        <div style={{ height: 4 }} />
        <Divider contentSpacing={0} />
        <div style={{ height: 4 }} />
        <Typography variant="labelLarge">Status</Typography>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Chip label="Stable" size="small" mode="tonal" selected onPress={() => {}} />
          <Chip label="Deprecated" size="small" mode="outlined" onPress={() => {}} />
        </div>
        <div style={{ height: 12 }} />
        <Button mode="filled" fullWidth onPress={() => {}}>
          Show 12 components
        </Button>
      </div>
    </BottomSheet>
  </div>
);

export const ActionSheet = () => (
  <div style={behind}>
    <Typography variant="headlineSmall">Chip</Typography>
    <Typography variant="bodyMedium">Buttons &amp; actions</Typography>
    <BottomSheet visible title="Chip" onDismiss={() => {}}>
      <div style={column}>
        <Button mode="text" fullWidth iconName="pencil-outline" onPress={() => {}}>
          Edit props
        </Button>
        <Button mode="text" fullWidth iconName="content-copy" onPress={() => {}}>
          Duplicate component
        </Button>
        <Button mode="text" fullWidth iconName="share-variant" onPress={() => {}}>
          Share preview link
        </Button>
        <Divider contentSpacing={0} />
        <Button mode="text" fullWidth iconName="delete-outline" onPress={() => {}}>
          Delete
        </Button>
      </div>
    </BottomSheet>
  </div>
);

export const NoHandle = () => (
  <div style={behind}>
    <BottomSheet visible showHandle={false} title="Sort by" onDismiss={() => {}}>
      <div style={column}>
        <Chip label="Recently updated" mode="tonal" selected onPress={() => {}} />
        <Chip label="Name A–Z" mode="outlined" onPress={() => {}} />
        <Chip label="Most used" mode="outlined" onPress={() => {}} />
        <div style={{ height: 8 }} />
        <Button mode="filled" fullWidth onPress={() => {}}>
          Apply
        </Button>
      </div>
    </BottomSheet>
  </div>
);

export const ReleaseNotes = () => (
  <div style={behind}>
    <BottomSheet
      visible
      title="Release notes 0.1.0"
      maxHeightRatio={0.5}
      onDismiss={() => {}}
    >
      <div style={column}>
        <Typography variant="bodyMedium">
          Dark mode contrast was corrected across every tonal surface, Chip
          gained a compact size, and DataGrid now keeps its header pinned while
          the body scrolls.
        </Typography>
        <div style={{ height: 8 }} />
        <Button mode="tonal" fullWidth onPress={() => {}}>
          Read the full changelog
        </Button>
      </div>
    </BottomSheet>
  </div>
);

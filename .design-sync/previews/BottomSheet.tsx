import React from "react";
import { BottomSheet, Typography, Button, Chip, Divider } from "@its/glowup-ui";

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
        </div>
        <div style={{ height: 4 }} />
        <Divider contentSpacing={0} />
        <div style={{ height: 4 }} />
        <Typography variant="labelLarge">Status</Typography>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
        </div>
        <div style={{ height: 12 }} />
        <Button variant="filled" fullWidth onClick={() => {}}>
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
        <Button
          variant="text"
          fullWidth
          iconName="pencil-outline"
          onClick={() => {}}
        >
          Edit props
        </Button>
        <Button
          variant="text"
          fullWidth
          iconName="content-copy"
          onClick={() => {}}
        >
          Duplicate component
        </Button>
        <Button
          variant="text"
          fullWidth
          iconName="share-variant"
          onClick={() => {}}
        >
          Share preview link
        </Button>
        <Divider contentSpacing={0} />
        <Button
          variant="text"
          fullWidth
          iconName="delete-outline"
          onClick={() => {}}
        >
          Delete
        </Button>
      </div>
    </BottomSheet>
  </div>
);

export const NoHandle = () => (
  <div style={behind}>
    <BottomSheet
      visible
      showHandle={false}
      title="Sort by"
      onDismiss={() => {}}
    >
      <div style={column}>
        <Chip
          label="Recently updated"
          variant="tonal"
          selected
          onClick={() => {}}
        />
        <Chip label="Name A–Z" variant="outlined" onClick={() => {}} />
        <Chip label="Most used" variant="outlined" onClick={() => {}} />
        <div style={{ height: 8 }} />
        <Button variant="filled" fullWidth onClick={() => {}}>
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
        <Button variant="tonal" fullWidth onClick={() => {}}>
          Read the full changelog
        </Button>
      </div>
    </BottomSheet>
  </div>
);

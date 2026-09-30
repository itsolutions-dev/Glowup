import React from "react";
import { ChipGroup, Typography } from "@its/glowup-ui";

const field: React.CSSProperties = {
  width: 400,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "review", label: "In review" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived", disabled: true },
];

export const SingleSelect = () => (
  <div style={field}>
    <Typography variant="labelLarge">Status</Typography>
    <ChipGroup
      mode="filled"
      options={STATUSES}
      value="open"
      onValueChange={() => {}}
      accessibilityLabel="Status"
    />
  </div>
);

export const MultiSelect = () => (
  <div style={field}>
    <Typography variant="labelLarge">Status</Typography>
    <ChipGroup
      multiSelect
      options={STATUSES}
      value={["open", "review"]}
      onValueChange={() => {}}
      accessibilityLabel="Status"
    />
  </div>
);

export const WithIcons = () => (
  <div style={field}>
    <Typography variant="labelLarge">Amenities</Typography>
    <ChipGroup
      multiSelect
      mode="outlined"
      options={[
        { value: "wifi", label: "Wi-Fi", icon: "wifi" },
        { value: "parking", label: "Parking", icon: "parking" },
        { value: "pets", label: "Pet friendly", icon: "paw" },
        { value: "pool", label: "Pool", icon: "pool" },
      ]}
      value={["wifi", "pets"]}
      onValueChange={() => {}}
      accessibilityLabel="Amenities"
    />
  </div>
);

export const Scrolling = () => (
  <div style={field}>
    <Typography variant="labelLarge">Category</Typography>
    <ChipGroup
      wrap={false}
      mode="tonal"
      options={[
        { value: "all", label: "All" },
        { value: "design", label: "Design" },
        { value: "engineering", label: "Engineering" },
        { value: "marketing", label: "Marketing" },
        { value: "sales", label: "Sales" },
        { value: "support", label: "Support" },
      ]}
      value="design"
      onValueChange={() => {}}
      accessibilityLabel="Category"
    />
  </div>
);

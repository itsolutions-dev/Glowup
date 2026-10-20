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
      variant="filled"
      options={STATUSES}
      value="open"
      onChange={() => {}}
      accessibilityLabel="Status"
    />
  </div>
);

export const MultiSelect = () => (
  <div style={field}>
    <Typography variant="labelLarge">Status</Typography>
    <ChipGroup
      multiple
      options={STATUSES}
      value={["open", "review"]}
      onChange={() => {}}
      accessibilityLabel="Status"
    />
  </div>
);

export const WithIcons = () => (
  <div style={field}>
    <Typography variant="labelLarge">Amenities</Typography>
    <ChipGroup
      multiple
      variant="outlined"
      options={[
        { value: "wifi", label: "Wi-Fi", icon: "wifi" },
        { value: "parking", label: "Parking", icon: "parking" },
        { value: "pets", label: "Pet friendly", icon: "paw" },
        { value: "pool", label: "Pool", icon: "pool" },
      ]}
      value={["wifi", "pets"]}
      onChange={() => {}}
      accessibilityLabel="Amenities"
    />
  </div>
);

export const Scrolling = () => (
  <div style={field}>
    <Typography variant="labelLarge">Category</Typography>
    <ChipGroup
      wrap={false}
      variant="tonal"
      options={[
        { value: "all", label: "All" },
        { value: "design", label: "Design" },
        { value: "engineering", label: "Engineering" },
        { value: "marketing", label: "Marketing" },
        { value: "sales", label: "Sales" },
        { value: "support", label: "Support" },
      ]}
      value="design"
      onChange={() => {}}
      accessibilityLabel="Category"
    />
  </div>
);

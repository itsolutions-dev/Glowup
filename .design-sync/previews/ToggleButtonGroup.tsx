import React from "react";
import { ToggleButtonGroup, Typography } from "@glowup/ui";

const field: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  alignItems: "flex-start",
};

export const ViewMode = () => (
  <div style={field}>
    <Typography variant="labelLarge">Layout</Typography>
    <ToggleButtonGroup
      value="list"
      onValueChange={() => {}}
      options={[
        { label: "List", icon: "format-list-bulleted", value: "list" },
        { label: "Grid", icon: "view-grid-outline", value: "grid" },
        { label: "Cards", icon: "card-outline", value: "cards" },
      ]}
    />
  </div>
);

export const LabelsOnly = () => (
  <div style={field}>
    <Typography variant="labelLarge">Report period</Typography>
    <ToggleButtonGroup
      value="week"
      onValueChange={() => {}}
      options={[
        { label: "Day", value: "day" },
        { label: "Week", value: "week" },
        { label: "Month", value: "month" },
        { label: "Year", value: "year" },
      ]}
    />
  </div>
);

export const IconsOnly = () => (
  <div style={field}>
    <Typography variant="labelLarge">Alignment</Typography>
    <ToggleButtonGroup
      value="center"
      onValueChange={() => {}}
      options={[
        { icon: "format-align-left", value: "left" },
        { icon: "format-align-center", value: "center" },
        { icon: "format-align-right", value: "right" },
        { icon: "format-align-justify", value: "justify" },
      ]}
    />
  </div>
);

export const MultiSelect = () => (
  <div style={field}>
    <Typography variant="labelLarge">Text style</Typography>
    <ToggleButtonGroup
      multiSelect
      value={["bold", "underline"]}
      onValueChange={() => {}}
      options={[
        { icon: "format-bold", value: "bold" },
        { icon: "format-italic", value: "italic" },
        { icon: "format-underline", value: "underline" },
        { icon: "format-strikethrough", value: "strike" },
      ]}
    />
  </div>
);

// GENERATED — do not edit.
// Source: .design-sync/previews/Editable.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Editable, Typography } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 16,
  width: 360,
};

const roles = [
  { id: "admin", label: "Administrator", value: "admin" },
  { id: "editor", label: "Editor", value: "editor" },
  { id: "viewer", label: "Viewer", value: "viewer" },
];

// The display state: the value reads as text, the pencil shows on hover or
// focus (not captured here), and an empty value shows its placeholder.
export const Display = () => (
  <View style={stack}>
    <Editable label="Name" defaultValue="Ada Lovelace" />
    <Editable label="Nickname" defaultValue="" placeholder="Add a nickname" />
    <Editable
      label="Role"
      type="select"
      options={roles}
      defaultValue="editor"
    />
    <Editable label="Rate" type="number" defaultValue="42.50" />
    <Editable
      label="Name"
      defaultValue="Ada Lovelace"
      textVariant="headlineSmall"
    />
  </View>
);

export const Sizes = () => (
  <View style={stack}>
    <Editable label="Small" size="small" defaultValue="Small text" />
    <Editable label="Medium" size="medium" defaultValue="Medium text" />
    <Editable label="Large" size="large" defaultValue="Large text" />
  </View>
);

export const Disabled = () => (
  <View style={stack}>
    <Editable label="Name" defaultValue="Disabled" disabled />
    <Editable label="Name" defaultValue="Read only" readOnly />
  </View>
);

export const CustomDisplay = () => (
  <View style={stack}>
    <Editable
      label="Amount"
      type="number"
      defaultValue="1240.5"
      renderDisplay={(value) => (
        <Typography variant="titleMedium" color="primary">
          {`€ ${Number(value).toFixed(2)}`}
        </Typography>
      )}
    />
  </View>
);

// The open state: `startWithEditView` mounts with the field already open.
export const EditingText = () => (
  <View style={stack}>
    <Editable label="Name" defaultValue="Ada Lovelace" startWithEditView />
    <Editable
      label="Name"
      defaultValue="Ada Lovelace"
      variant="filled"
      startWithEditView
    />
  </View>
);

export const EditingNumberAndTextarea = () => (
  <View style={stack}>
    <Editable
      label="Rate"
      type="number"
      defaultValue="42.50"
      precision={2}
      startWithEditView
    />
    <Editable
      label="Bio"
      type="textarea"
      defaultValue="Wrote the first program."
      startWithEditView
    />
  </View>
);

export const WithButtons = () => (
  <View style={stack}>
    <Editable
      label="Name"
      defaultValue="Ada Lovelace"
      submitMode="none"
      startWithEditView
    />
    <Editable
      label="Name"
      defaultValue="Ada Lovelace"
      size="small"
      showControls
      startWithEditView
    />
  </View>
);

// The validation error is not previewed: `validate` shows its message only once
// the value has been changed, which a static capture cannot do.

export const variants: Variant[] = [
  {
    name: "Display",
    title: "Display",
    render: Display,
  },
  {
    name: "Sizes",
    title: "Sizes",
    render: Sizes,
  },
  {
    name: "Disabled",
    title: "Disabled",
    render: Disabled,
  },
  {
    name: "CustomDisplay",
    title: "Custom display",
    render: CustomDisplay,
  },
  {
    name: "EditingText",
    title: "Editing text",
    render: EditingText,
  },
  {
    name: "EditingNumberAndTextarea",
    title: "Editing number and textarea",
    render: EditingNumberAndTextarea,
  },
  {
    name: "WithButtons",
    title: "With buttons",
    render: WithButtons,
  },
];

import React from "react";
import { Editable, Typography } from "@its/glowup-ui";

const stack: React.CSSProperties = {
  display: "flex",
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
  <div style={stack}>
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
  </div>
);

export const Sizes = () => (
  <div style={stack}>
    <Editable label="Small" size="small" defaultValue="Small text" />
    <Editable label="Medium" size="medium" defaultValue="Medium text" />
    <Editable label="Large" size="large" defaultValue="Large text" />
  </div>
);

export const Disabled = () => (
  <div style={stack}>
    <Editable label="Name" defaultValue="Disabled" disabled />
    <Editable label="Name" defaultValue="Read only" readOnly />
  </div>
);

export const CustomDisplay = () => (
  <div style={stack}>
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
  </div>
);

// The open state: `startWithEditView` mounts with the field already open. The
// default submit mode confirms on blur, so two open fields would close each other
// as the second takes focus: these stay open with `submitMode="none"`.
export const EditingText = () => (
  <div style={stack}>
    <Editable
      label="Name"
      defaultValue="Ada Lovelace"
      submitMode="none"
      startWithEditView
    />
    <Editable
      label="Name"
      defaultValue="Ada Lovelace"
      variant="filled"
      submitMode="none"
      startWithEditView
    />
  </div>
);

export const EditingNumberAndTextarea = () => (
  <div style={stack}>
    <Editable
      label="Rate"
      type="number"
      defaultValue="42.50"
      precision={2}
      submitMode="none"
      startWithEditView
    />
    <Editable
      label="Bio"
      type="textarea"
      defaultValue="Wrote the first program."
      submitMode="none"
      startWithEditView
    />
  </div>
);

export const WithButtons = () => (
  <div style={stack}>
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
  </div>
);

// The validation error is not previewed: `validate` shows its message only once
// the value has been changed, which a static capture cannot do.

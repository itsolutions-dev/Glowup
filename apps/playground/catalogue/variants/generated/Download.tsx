// GENERATED — do not edit.
// Source: .design-sync/previews/Download.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Download, Typography } from "@its/glowup-ui";

const row: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const rows = [
  { id: 1, name: "Ada", plan: "Pro" },
  { id: 2, name: "Grace", plan: "Team" },
];

/** A button that saves a file: here the object is saved as JSON. */
export const Default = () => (
  <View style={row}>
    <Download data={rows} filename="members.json" />
  </View>
);

export const Variants = () => (
  <View style={row}>
    <Download data="x" variant="filled" />
    <Download data="x" variant="tonal" />
    <Download data="x" variant="outlined" />
    <Download data="x" variant="text" />
  </View>
);

export const Colors = () => (
  <View style={row}>
    <Download data="x" variant="tonal" color="primary" />
    <Download data="x" variant="tonal" color="secondary" />
    <Download data="x" variant="tonal" color="tertiary" />
    <Download data="x" variant="tonal" color="success" />
  </View>
);

/** The label is `children`; `icon` swaps the glyph. */
export const LabelAndIcon = () => (
  <View style={row}>
    <Download
      data={"id,name\n1,Ada"}
      filename="members.csv"
      icon="file-delimited-outline"
    >
      Export CSV
    </Download>
    <Download
      url="https://example.com/report.pdf"
      icon="file-pdf-box"
      variant="outlined"
    >
      Quarterly report
    </Download>
  </View>
);

export const Disabled = () => (
  <View style={row}>
    <Download data="x" disabled>
      Nothing to export
    </Download>
  </View>
);

/** A function as `children` draws your own trigger, from `{ download, downloading }`. */
export const RenderProp = () => (
  <View style={row}>
    <Download data="Hello" filename="hello.txt">
      {({ download, downloading }) => (
        <Typography
          variant="labelLarge"
          color="primary"
          onClick={() => void download()}
        >
          {downloading ? "Saving…" : "Save as text"}
        </Typography>
      )}
    </Download>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Default",
    title: "Default",
    description:
      "A button that saves a file: here the object is saved as JSON.",
    render: Default,
  },
  {
    name: "Variants",
    title: "Variants",
    render: Variants,
  },
  {
    name: "Colors",
    title: "Colors",
    render: Colors,
  },
  {
    name: "LabelAndIcon",
    title: "Label and icon",
    description: "The label is `children`; `icon` swaps the glyph.",
    render: LabelAndIcon,
  },
  {
    name: "Disabled",
    title: "Disabled",
    render: Disabled,
  },
  {
    name: "RenderProp",
    title: "Render prop",
    description:
      "A function as `children` draws your own trigger, from `{ download, downloading }`.",
    render: RenderProp,
  },
];

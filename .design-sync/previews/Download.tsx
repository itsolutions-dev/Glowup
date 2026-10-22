import React from "react";
import { Download, Typography } from "@its/glowup-ui";

const row: React.CSSProperties = {
  display: "flex",
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
  <div style={row}>
    <Download data={rows} filename="members.json" />
  </div>
);

export const Variants = () => (
  <div style={row}>
    <Download data="x" variant="filled" />
    <Download data="x" variant="tonal" />
    <Download data="x" variant="outlined" />
    <Download data="x" variant="text" />
  </div>
);

export const Colors = () => (
  <div style={row}>
    <Download data="x" variant="tonal" color="primary" />
    <Download data="x" variant="tonal" color="secondary" />
    <Download data="x" variant="tonal" color="tertiary" />
    <Download data="x" variant="tonal" color="success" />
  </div>
);

/** The label is `children`; `icon` swaps the glyph. */
export const LabelAndIcon = () => (
  <div style={row}>
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
  </div>
);

export const Disabled = () => (
  <div style={row}>
    <Download data="x" disabled>
      Nothing to export
    </Download>
  </div>
);

/** A function as `children` draws your own trigger, from `{ download, downloading }`. */
export const RenderProp = () => (
  <div style={row}>
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
  </div>
);

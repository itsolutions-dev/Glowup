import React from "react";
import { CaptionValue, StatusBadge, useTheme } from "@its/glowup-ui";

const box: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  width: 320,
};

export const Stacked = () => (
  <div style={box}>
    <CaptionValue caption="Phone" value="+39 06 1234 5678" />
    <CaptionValue caption="Email" value="ada@example.com" />
    <CaptionValue caption="Address" value="Via Roma 1, 00100 Roma" />
  </div>
);

export const InARow = () => (
  <div style={box}>
    <CaptionValue caption="Due date" value="12 Oct" direction="row" />
    <CaptionValue caption="Total" value="€1,240.50" direction="row" />
    <CaptionValue
      caption="Status"
      value={<StatusBadge label="Paid" />}
      direction="row"
    />
  </div>
);

/** An empty value (`""`, `null`, `undefined`, `false`) draws `fallback`, "N/A" unless you say otherwise. `0` is a value. */
export const EmptyValueFallback = () => (
  <div style={box}>
    <CaptionValue caption="Mobile" value="" />
    <CaptionValue caption="Fax" value={null} fallback="Not given" />
    <CaptionValue caption="Zero is a value" value={0} />
  </div>
);

/** `captionColor` and `valueColor` take a theme token or any colour string; `reverse` puts the value first. */
export const Colours = () => (
  <div style={box}>
    <CaptionValue
      caption="Overdue"
      value="3 days"
      captionColor="error"
      valueColor="error"
    />
    <CaptionValue caption="Plan" value="Pro" captionColor="primary" />
    <CaptionValue
      caption="Brand"
      value="#6750A4"
      valueColor="#6750A4"
      captionColor="#6750A4"
    />
    <CaptionValue caption="Value first" value="Acme Inc." reverse />
  </div>
);

/** `enableCopy` adds a copy button after a text or number value; `onCopy` is where native writes to the clipboard. */
export const Copy = () => (
  <div style={box}>
    <CaptionValue
      caption="IBAN"
      value="IT60 X054 2811 1010 0000 0123 456"
      enableCopy
      onCopy={() => {}}
    />
    <CaptionValue
      caption="Order"
      value="#10428"
      direction="row"
      enableCopy
      onCopy={() => {}}
    />
  </div>
);

/** A value is cut at `numberOfLines` (1 by default, 0 for no limit); `showTooltip` gives the full text on hover or long press. */
export const CutValue = () => (
  <div style={box}>
    <CaptionValue
      caption="Address"
      value="Via Giuseppe Garibaldi 128, interno 4, 00185 Roma RM"
      width={200}
      showTooltip
    />
    <CaptionValue
      caption="Notes"
      value="Ring twice and leave the parcel with the neighbour at number 6 if nobody answers."
      width={200}
      numberOfLines={2}
    />
    <CaptionValue
      caption="Notes, in full"
      value="Ring twice and leave the parcel with the neighbour at number 6 if nobody answers."
      width={200}
      numberOfLines={0}
    />
  </div>
);

/** `width`, `height`, `flex` and `padding` size the pair; `gap` spaces the caption from the value and `textAlign` aligns the text. */
export const Sizing = () => {
  const { theme } = useTheme();
  const tile = {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.shape.medium,
    justifyContent: "center" as const,
  };
  return (
    <div style={{ ...box, width: 360 }}>
      <CaptionValue
        caption="Balance"
        value="€4,812.20"
        padding={12}
        style={{
          backgroundColor: theme.colors.secondaryContainer,
          borderRadius: theme.shape.medium,
        }}
      />
      <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
        {[
          ["Orders", "128"],
          ["Returns", "6"],
          ["Rating", "4.7"],
        ].map(([caption, value]) => (
          <CaptionValue
            key={caption}
            caption={caption}
            value={value}
            width={112}
            height={72}
            textAlign="center"
            style={tile}
          />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
        <CaptionValue caption="Customer" value="Northwind Ltd" flex={2} />
        <CaptionValue caption="Country" value="Italy" flex={1} />
      </div>
      <CaptionValue
        caption="Delivery window"
        value="Mon–Fri, 9:00–18:00"
        gap={8}
      />
    </div>
  );
};

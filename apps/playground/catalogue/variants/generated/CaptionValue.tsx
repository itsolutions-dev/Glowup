// GENERATED — do not edit.
// Source: .design-sync/previews/CaptionValue.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { CaptionValue, StatusBadge, useTheme } from "@its/glowup-ui";

const box: ViewStyle = {
  flexDirection: "column",
  gap: 16,
  width: "100%",
  maxWidth: 320,
};

export const Stacked = () => (
  <View style={box}>
    <CaptionValue caption="Phone" value="+39 06 1234 5678" />
    <CaptionValue caption="Email" value="ada@example.com" />
    <CaptionValue caption="Address" value="Via Roma 1, 00100 Roma" />
  </View>
);

export const InARow = () => (
  <View style={box}>
    <CaptionValue caption="Due date" value="12 Oct" direction="row" />
    <CaptionValue caption="Total" value="€1,240.50" direction="row" />
    <CaptionValue
      caption="Status"
      value={<StatusBadge label="Paid" />}
      direction="row"
    />
  </View>
);

/** An empty value (`""`, `null`, `undefined`, `false`) draws `fallback`, "N/A" unless you say otherwise. `0` is a value. */
export const EmptyValueFallback = () => (
  <View style={box}>
    <CaptionValue caption="Mobile" value="" />
    <CaptionValue caption="Fax" value={null} fallback="Not given" />
    <CaptionValue caption="Zero is a value" value={0} />
  </View>
);

/** `captionColor` and `valueColor` take a theme token or any colour string; `reverse` puts the value first. */
export const Colours = () => (
  <View style={box}>
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
  </View>
);

/** `enableCopy` adds a copy button after a text or number value; `onCopy` is where native writes to the clipboard. */
export const Copy = () => (
  <View style={box}>
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
  </View>
);

/** A value is cut at `numberOfLines` (1 by default, 0 for no limit); `showTooltip` gives the full text on hover or long press. */
export const CutValue = () => (
  <View style={box}>
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
  </View>
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
    <View style={{ ...box, width: 360 }}>
      <CaptionValue
        caption="Balance"
        value="€4,812.20"
        padding={12}
        style={{
          backgroundColor: theme.colors.secondaryContainer,
          borderRadius: theme.shape.medium,
        }}
      />
      <View style={{ flexDirection: "row", gap: 12 }}>
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
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <CaptionValue caption="Customer" value="Northwind Ltd" flex={2} />
        <CaptionValue caption="Country" value="Italy" flex={1} />
      </View>
      <CaptionValue
        caption="Delivery window"
        value="Mon–Fri, 9:00–18:00"
        gap={8}
      />
    </View>
  );
};

export const variants: Variant[] = [
  {
    name: "Stacked",
    title: "Stacked",
    render: Stacked,
  },
  {
    name: "InARow",
    title: "In a row",
    render: InARow,
  },
  {
    name: "EmptyValueFallback",
    title: "Empty value fallback",
    description:
      'An empty value (`""`, `null`, `undefined`, `false`) draws `fallback`, "N/A" unless you say otherwise. `0` is a value.',
    render: EmptyValueFallback,
  },
  {
    name: "Colours",
    title: "Colours",
    description:
      "`captionColor` and `valueColor` take a theme token or any colour string; `reverse` puts the value first.",
    render: Colours,
  },
  {
    name: "Copy",
    title: "Copy",
    description:
      "`enableCopy` adds a copy button after a text or number value; `onCopy` is where native writes to the clipboard.",
    render: Copy,
  },
  {
    name: "CutValue",
    title: "Cut value",
    description:
      "A value is cut at `numberOfLines` (1 by default, 0 for no limit); `showTooltip` gives the full text on hover or long press.",
    render: CutValue,
  },
  {
    name: "Sizing",
    title: "Sizing",
    description:
      "`width`, `height`, `flex` and `padding` size the pair; `gap` spaces the caption from the value and `textAlign` aligns the text.",
    render: Sizing,
  },
];

// GENERATED — do not edit.
// Source: .design-sync/previews/CaptionValue.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { CaptionValue, StatusBadge } from "@its/glowup-ui";

const box: ViewStyle = {
  flexDirection: "column",
  gap: 16,
  width: 320,
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

export const EmptyValueAndColours = () => (
  <View style={box}>
    <CaptionValue caption="Mobile" value="" />
    <CaptionValue caption="Zero is a value" value={0} />
    <CaptionValue
      caption="Overdue"
      value="3 days"
      valueColor="#B00020"
      captionColor="#B00020"
    />
    <CaptionValue caption="Value first" value="Acme Inc." reverse />
  </View>
);

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
    name: "EmptyValueAndColours",
    title: "Empty value and colours",
    render: EmptyValueAndColours,
  },
];

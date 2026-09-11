// GENERATED — do not edit.
// Source: .design-sync/previews/Typography.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Typography } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 8,
  maxWidth: 560,
};

export const DisplayAndHeadline = () => (
  <View style={stack}>
    <Typography variant="displaySmall">Material You</Typography>
    <Typography variant="headlineMedium">
      Type that scales with intent
    </Typography>
    <Typography variant="headlineSmall">Six roles, three sizes each</Typography>
  </View>
);

export const TitlesAndBody = () => (
  <View style={stack}>
    <Typography variant="titleLarge">Billing preferences</Typography>
    <Typography variant="titleMedium">Payment method</Typography>
    <Typography variant="bodyLarge">
      Invoices are issued on the first working day of each month and charged to
      the card on file.
    </Typography>
    <Typography variant="bodyMedium">
      Changing the card mid-cycle applies from the next invoice; the current one
      is already committed.
    </Typography>
    <Typography variant="bodySmall">
      VAT is calculated from the billing address, not the shipping address.
    </Typography>
  </View>
);

export const Labels = () => (
  <View style={stack}>
    <Typography variant="labelLarge">Continue to payment</Typography>
    <Typography variant="labelMedium">Updated 3 minutes ago</Typography>
    <Typography variant="labelSmall">Required field</Typography>
  </View>
);

export const variants: Variant[] = [
  {
    name: "DisplayAndHeadline",
    title: "Display and headline",
    render: DisplayAndHeadline,
  },
  {
    name: "TitlesAndBody",
    title: "Titles and body",
    render: TitlesAndBody,
  },
  {
    name: "Labels",
    title: "Labels",
    render: Labels,
  },
];

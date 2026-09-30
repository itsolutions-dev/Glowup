// GENERATED — do not edit.
// Source: .design-sync/previews/ButtonGroup.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { ButtonGroup, Typography } from "@its/glowup-ui";

const field: ViewStyle = {
  flexDirection: "column",
  gap: 8,
  alignItems: "flex-start",
};

const VIEWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export const Standard = () => (
  <View style={field}>
    <Typography variant="labelLarge">Calendar view</Typography>
    <ButtonGroup
      options={VIEWS}
      value="week"
      onValueChange={() => {}}
      accessibilityLabel="Calendar view"
    />
  </View>
);

export const Connected = () => (
  <View style={field}>
    <Typography variant="labelLarge">Calendar view</Typography>
    <ButtonGroup
      type="connected"
      options={VIEWS}
      value="week"
      onValueChange={() => {}}
      accessibilityLabel="Calendar view"
    />
  </View>
);

export const MultiSelect = () => (
  <View style={field}>
    <Typography variant="labelLarge">Notify me by</Typography>
    <ButtonGroup
      multiSelect
      type="connected"
      options={[
        { value: "email", label: "Email" },
        { value: "sms", label: "SMS" },
        { value: "push", label: "Push" },
      ]}
      value={["email", "push"]}
      onValueChange={() => {}}
      accessibilityLabel="Notification channels"
    />
  </View>
);

export const Outlined = () => (
  <View style={field}>
    <Typography variant="labelLarge">Calendar view</Typography>
    <ButtonGroup
      mode="outlined"
      type="connected"
      options={VIEWS}
      value="month"
      onValueChange={() => {}}
      accessibilityLabel="Calendar view"
    />
  </View>
);

export const Sizes = () => (
  <View style={field}>
    {(["xs", "s", "m"] as const).map((size) => (
      <ButtonGroup
        key={size}
        size={size}
        type="connected"
        options={VIEWS}
        value="day"
        onValueChange={() => {}}
        accessibilityLabel={`Calendar view, size ${size}`}
      />
    ))}
  </View>
);

export const variants: Variant[] = [
  {
    name: "Standard",
    title: "Standard",
    render: Standard,
  },
  {
    name: "Connected",
    title: "Connected",
    render: Connected,
  },
  {
    name: "MultiSelect",
    title: "Multi select",
    render: MultiSelect,
  },
  {
    name: "Outlined",
    title: "Outlined",
    render: Outlined,
  },
  {
    name: "Sizes",
    title: "Sizes",
    render: Sizes,
  },
];

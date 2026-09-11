// GENERATED — do not edit.
// Source: .design-sync/previews/SearchBar.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { SearchBar } from "@its/glowup-ui";

const stack: ViewStyle = {
  flexDirection: "column",
  gap: 16,
  width: 340,
};

const noop = () => {};

export const Default = () => (
  <View style={stack}>
    <SearchBar
      value="invoice 2024-118"
      placeholder="Search invoices"
      onChangeText={noop}
      onSubmit={noop}
      onClear={noop}
    />
  </View>
);

export const Empty = () => (
  <View style={stack}>
    <SearchBar value="" placeholder="Search invoices" onChangeText={noop} />
  </View>
);

export const LeadingIcons = () => (
  <View style={stack}>
    <SearchBar
      value="Ada Lovelace"
      placeholder="Search team members"
      leadingIcon="account-multiple-outline"
      onChangeText={noop}
    />
    <SearchBar
      value=""
      placeholder="Filter by tag"
      leadingIcon="tag-outline"
      onChangeText={noop}
    />
    <SearchBar
      value=""
      placeholder="Search the docs"
      leadingIcon="bookshelf"
      onChangeText={noop}
    />
  </View>
);

export const Disabled = () => (
  <View style={stack}>
    <SearchBar
      value="archived orders"
      placeholder="Search orders"
      disabled
      onChangeText={noop}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Default",
    title: "Default",
    render: Default,
  },
  {
    name: "Empty",
    title: "Empty",
    render: Empty,
  },
  {
    name: "LeadingIcons",
    title: "Leading icons",
    render: LeadingIcons,
  },
  {
    name: "Disabled",
    title: "Disabled",
    render: Disabled,
  },
];

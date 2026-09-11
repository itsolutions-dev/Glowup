// GENERATED — do not edit.
// Source: .design-sync/previews/Breadcrumbs.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Breadcrumbs } from "@its/glowup-ui";
import type { BreadcrumbItem } from "@its/glowup-ui";

const wrap: ViewStyle = { width: 400, flexDirection: "row" };

const trail: BreadcrumbItem[] = [
  { id: "home", label: "Home", icon: "home-outline", onPress: () => {} },
  { id: "projects", label: "Projects", onPress: () => {} },
  { id: "glowup", label: "Glowup", onPress: () => {} },
  { id: "components", label: "Components", onPress: () => {} },
  { id: "breadcrumbs", label: "Breadcrumbs" },
];

export const Trail = () => (
  <View style={wrap}>
    <Breadcrumbs items={trail} />
  </View>
);

export const Collapsed = () => (
  <View style={wrap}>
    <Breadcrumbs items={trail} maxItems={3} />
  </View>
);

export const WithIcons = () => (
  <View style={wrap}>
    <Breadcrumbs
      items={[
        {
          id: "workspace",
          label: "Workspace",
          icon: "briefcase-outline",
          onPress: () => {},
        },
        {
          id: "billing",
          label: "Billing",
          icon: "credit-card-outline",
          onPress: () => {},
        },
        { id: "invoices", label: "Invoices", icon: "file-document-outline" },
      ]}
    />
  </View>
);

export const CustomSeparator = () => (
  <View style={wrap}>
    <Breadcrumbs
      separator="slash-forward"
      items={[
        { id: "repo", label: "glowup", onPress: () => {} },
        { id: "pkg", label: "packages", onPress: () => {} },
        { id: "ui", label: "ui", onPress: () => {} },
        { id: "file", label: "Breadcrumbs.tsx" },
      ]}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Trail",
    title: "Trail",
    render: Trail,
  },
  {
    name: "Collapsed",
    title: "Collapsed",
    render: Collapsed,
  },
  {
    name: "WithIcons",
    title: "With icons",
    render: WithIcons,
  },
  {
    name: "CustomSeparator",
    title: "Custom separator",
    render: CustomSeparator,
  },
];

import React from "react";
import { Breadcrumbs } from "@its/glowup-ui";
import type { BreadcrumbItem } from "@its/glowup-ui";

const wrap: React.CSSProperties = { width: 400, display: "flex" };

const trail: BreadcrumbItem[] = [
  { id: "home", label: "Home", icon: "home-outline", onPress: () => {} },
  { id: "projects", label: "Projects", onPress: () => {} },
  { id: "glowup", label: "Glowup", onPress: () => {} },
  { id: "components", label: "Components", onPress: () => {} },
  { id: "breadcrumbs", label: "Breadcrumbs" },
];

export const Trail = () => (
  <div style={wrap}>
    <Breadcrumbs items={trail} />
  </div>
);

export const Collapsed = () => (
  <div style={wrap}>
    <Breadcrumbs items={trail} maxItems={3} />
  </div>
);

export const WithIcons = () => (
  <div style={wrap}>
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
  </div>
);

export const CustomSeparator = () => (
  <div style={wrap}>
    <Breadcrumbs
      separator="slash-forward"
      items={[
        { id: "repo", label: "glowup", onPress: () => {} },
        { id: "pkg", label: "packages", onPress: () => {} },
        { id: "ui", label: "ui", onPress: () => {} },
        { id: "file", label: "Breadcrumbs.tsx" },
      ]}
    />
  </div>
);

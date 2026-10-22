// GENERATED — do not edit.
// Source: .design-sync/previews/Pagination.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Pagination } from "@its/glowup-ui";

const wrap: ViewStyle = { width: 400, flexDirection: "row" };

export const Default = () => (
  <View style={wrap}>
    <Pagination activePage={3} totalPages={12} onChange={() => {}} />
  </View>
);

export const WithFirstLast = () => (
  <View style={wrap}>
    <Pagination
      activePage={1}
      totalPages={8}
      showFirstLast
      onChange={() => {}}
    />
  </View>
);

export const Compact = () => (
  <View style={wrap}>
    <Pagination
      activePage={8}
      totalPages={20}
      siblingCount={0}
      onChange={() => {}}
    />
  </View>
);

export const Disabled = () => (
  <View style={wrap}>
    <Pagination activePage={4} totalPages={6} disabled onChange={() => {}} />
  </View>
);

/** `variant="circular"` draws the buttons as circles instead of rounded squares. */
export const Circular = () => (
  <View style={wrap}>
    <Pagination
      activePage={3}
      totalPages={12}
      variant="circular"
      onChange={() => {}}
    />
  </View>
);

/** `size` is 32, 40 (default) or 48 px: `"sm"`, `"md"`, `"lg"`. */
export const Sizes = () => (
  <View style={{ ...wrap, flexDirection: "column", gap: 12 }}>
    {(["sm", "md", "lg"] as const).map((size) => (
      <Pagination
        key={size}
        activePage={2}
        totalPages={6}
        size={size}
        onChange={() => {}}
      />
    ))}
  </View>
);

/** `color` is the role of the selected page. */
export const Colours = () => (
  <View style={{ ...wrap, flexDirection: "column", gap: 12 }}>
    {(["secondary", "tertiary", "error", "success"] as const).map((color) => (
      <Pagination
        key={color}
        activePage={2}
        totalPages={6}
        color={color}
        onChange={() => {}}
      />
    ))}
  </View>
);

/** `pageSelect` adds a "page / total" button that opens a searchable list of pages: typing digits narrows it, which keeps thousands of pages usable. */
export const PageSelect = () => {
  const [page, setPage] = React.useState(42);
  return (
    <View style={wrap}>
      <Pagination
        activePage={page}
        totalPages={1200}
        pageSelect
        onChange={setPage}
      />
    </View>
  );
};

export const Controlled = () => {
  const [page, setPage] = React.useState(1);
  return (
    <View style={wrap}>
      <Pagination
        activePage={page}
        totalPages={9}
        showFirstLast
        onChange={setPage}
      />
    </View>
  );
};

export const variants: Variant[] = [
  {
    name: "Default",
    title: "Default",
    render: Default,
  },
  {
    name: "WithFirstLast",
    title: "With first last",
    render: WithFirstLast,
  },
  {
    name: "Compact",
    title: "Compact",
    render: Compact,
  },
  {
    name: "Disabled",
    title: "Disabled",
    render: Disabled,
  },
  {
    name: "Circular",
    title: "Circular",
    description:
      '`variant="circular"` draws the buttons as circles instead of rounded squares.',
    render: Circular,
  },
  {
    name: "Sizes",
    title: "Sizes",
    description: '`size` is 32, 40 (default) or 48 px: `"sm"`, `"md"`, `"lg"`.',
    render: Sizes,
  },
  {
    name: "Colours",
    title: "Colours",
    description: "`color` is the role of the selected page.",
    render: Colours,
  },
  {
    name: "PageSelect",
    title: "Page select",
    description:
      '`pageSelect` adds a "page / total" button that opens a searchable list of pages: typing digits narrows it, which keeps thousands of pages usable.',
    render: PageSelect,
  },
  {
    name: "Controlled",
    title: "Controlled",
    render: Controlled,
  },
];

import React from "react";
import { SearchBar } from "@its/glowup-ui";

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  width: 340,
};

const noop = () => {};

export const Default = () => (
  <div style={stack}>
    <SearchBar
      value="invoice 2024-118"
      placeholder="Search invoices"
      onChange={noop}
      onSubmit={noop}
      onClear={noop}
    />
  </div>
);

export const Empty = () => (
  <div style={stack}>
    <SearchBar value="" placeholder="Search invoices" onChange={noop} />
  </div>
);

export const LeadingIcons = () => (
  <div style={stack}>
    <SearchBar
      value="Ada Lovelace"
      placeholder="Search team members"
      icon="account-multiple-outline"
      onChange={noop}
    />
    <SearchBar
      value=""
      placeholder="Filter by tag"
      icon="tag-outline"
      onChange={noop}
    />
    <SearchBar
      value=""
      placeholder="Search the docs"
      icon="bookshelf"
      onChange={noop}
    />
  </div>
);

export const Disabled = () => (
  <div style={stack}>
    <SearchBar
      value="archived orders"
      placeholder="Search orders"
      disabled
      onChange={noop}
    />
  </div>
);

import React from "react";
import { Pagination } from "@its/glowup-ui";

const wrap: React.CSSProperties = { width: 400, display: "flex" };

export const Default = () => (
  <div style={wrap}>
    <Pagination activePage={3} totalPages={12} onChange={() => {}} />
  </div>
);

export const WithFirstLast = () => (
  <div style={wrap}>
    <Pagination
      activePage={1}
      totalPages={8}
      showFirstLast
      onChange={() => {}}
    />
  </div>
);

export const Compact = () => (
  <div style={wrap}>
    <Pagination
      activePage={8}
      totalPages={20}
      siblingCount={0}
      onChange={() => {}}
    />
  </div>
);

export const Disabled = () => (
  <div style={wrap}>
    <Pagination activePage={4} totalPages={6} disabled onChange={() => {}} />
  </div>
);

/** `variant="circular"` draws the buttons as circles instead of rounded squares. */
export const Circular = () => (
  <div style={wrap}>
    <Pagination
      activePage={3}
      totalPages={12}
      variant="circular"
      onChange={() => {}}
    />
  </div>
);

/** `size` is 32, 40 (default) or 48 px: `"sm"`, `"md"`, `"lg"`. */
export const Sizes = () => (
  <div style={{ ...wrap, width: 520, flexDirection: "column", gap: 12 }}>
    {(["sm", "md", "lg"] as const).map((size) => (
      <Pagination
        key={size}
        activePage={2}
        totalPages={6}
        size={size}
        onChange={() => {}}
      />
    ))}
  </div>
);

/** `color` is the role of the selected page. */
export const Colours = () => (
  <div style={{ ...wrap, flexDirection: "column", gap: 12 }}>
    {(["secondary", "tertiary", "error", "success"] as const).map((color) => (
      <Pagination
        key={color}
        activePage={2}
        totalPages={6}
        color={color}
        onChange={() => {}}
      />
    ))}
  </div>
);

/** `pageSelect` adds a "page / total" button that opens a searchable list of pages: typing digits narrows it, which keeps thousands of pages usable. */
export const PageSelect = () => {
  const [page, setPage] = React.useState(42);
  return (
    <div style={wrap}>
      <Pagination
        activePage={page}
        totalPages={1200}
        pageSelect
        onChange={setPage}
      />
    </div>
  );
};

export const Controlled = () => {
  const [page, setPage] = React.useState(5);
  return (
    <div style={wrap}>
      <Pagination
        activePage={page}
        totalPages={9}
        showFirstLast
        onChange={setPage}
      />
    </div>
  );
};

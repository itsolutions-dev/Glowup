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

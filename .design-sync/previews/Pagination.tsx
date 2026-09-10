import React from "react";
import { Pagination } from "@its/glowup-ui";

const wrap: React.CSSProperties = { width: 400, display: "flex" };

export const Default = () => (
  <div style={wrap}>
    <Pagination page={3} totalPages={12} onPageChange={() => {}} />
  </div>
);

export const WithFirstLast = () => (
  <div style={wrap}>
    <Pagination page={1} totalPages={8} showFirstLast onPageChange={() => {}} />
  </div>
);

export const Compact = () => (
  <div style={wrap}>
    <Pagination
      page={8}
      totalPages={20}
      siblingCount={0}
      onPageChange={() => {}}
    />
  </div>
);

export const Disabled = () => (
  <div style={wrap}>
    <Pagination page={4} totalPages={6} disabled onPageChange={() => {}} />
  </div>
);

import React from "react";
import { Skeleton, Paper, Typography, Divider } from "@its/glowup-ui";

const col: React.CSSProperties = { display: "flex", flexDirection: "column" };

export const Variants = () => (
  <div style={{ ...col, gap: 20, width: 340 }}>
    <div style={col}>
      <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
        circle — avatar placeholder
      </Typography>
      <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
        <Skeleton variant="circle" width={56} />
        <Skeleton variant="circle" width={40} />
        <Skeleton variant="circle" width={24} />
      </div>
    </div>
    <div style={col}>
      <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
        text — copy placeholder
      </Typography>
      <div style={{ ...col, gap: 8 }}>
        <Skeleton variant="text" width={320} />
        <Skeleton variant="text" width={280} />
        <Skeleton variant="text" width={180} />
      </div>
    </div>
    <div style={col}>
      <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
        rect — media placeholder
      </Typography>
      <Skeleton variant="rect" width={320} height={96} />
    </div>
  </div>
);

export const CardPlaceholder = () => (
  <div style={{ display: "flex", width: 360 }}>
    <Paper
      elevation={0}
      outline
      style={{ width: "100%", paddingVertical: 16, paddingHorizontal: 16 }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 12,
          alignItems: "center",
        }}
      >
        <Skeleton variant="circle" width={48} />
        <div style={{ ...col, gap: 8, flex: 1 }}>
          <Skeleton variant="text" width={150} />
          <Skeleton variant="text" width={90} height={12} />
        </div>
      </div>
      <div style={{ marginTop: 16, display: "flex" }}>
        <Skeleton variant="rect" width={328} height={140} />
      </div>
      <div style={{ ...col, gap: 8, marginTop: 16 }}>
        <Skeleton variant="text" width={328} />
        <Skeleton variant="text" width={280} />
        <Skeleton variant="text" width={200} />
      </div>
    </Paper>
  </div>
);

export const ListPlaceholder = () => (
  <div style={{ ...col, width: 340 }}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={col}>
        {i > 0 && <Divider contentSpacing={0} />}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          <Skeleton variant="circle" width={40} />
          <div style={{ ...col, gap: 8, flex: 1 }}>
            <Skeleton variant="text" width={200} />
            <Skeleton variant="text" width={130} height={12} />
          </div>
          <Skeleton variant="rect" width={56} height={28} borderRadius={14} />
        </div>
      </div>
    ))}
  </div>
);

export const Shapes = () => (
  <div style={{ ...col, gap: 20, width: 340 }}>
    <div style={col}>
      <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
        borderRadius 0 — table cell
      </Typography>
      <Skeleton variant="rect" width={320} height={40} borderRadius={0} />
    </div>
    <div style={col}>
      <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
        borderRadius 8 — default
      </Typography>
      <Skeleton variant="rect" width={320} height={40} />
    </div>
    <div style={col}>
      <Typography variant="labelSmall" style={{ marginBottom: 8 }}>
        borderRadius 20 — pill, standing in for a chip row
      </Typography>
      <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
        <Skeleton variant="rect" width={96} height={40} borderRadius={20} />
        <Skeleton variant="rect" width={120} height={40} borderRadius={20} />
        <Skeleton variant="rect" width={80} height={40} borderRadius={20} />
      </div>
    </div>
  </div>
);

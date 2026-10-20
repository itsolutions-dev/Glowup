import React from "react";
import { FAB, Paper, Typography, Divider, ListItem } from "@its/glowup-ui";

// FAB is always `position: absolute` inside its nearest positioned ancestor.
// A Paper acts as the "screen" surface it floats over.
const screen: React.CSSProperties = {
  width: 380,
  height: 220,
  display: "flex",
};

// The DS itself un-anchors a FAB by re-declaring position (see SpeedDial's
// internal `fab` style), which is how a FAB is laid out inline in a row.
const inline = {
  position: "relative" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 16,
  alignItems: "center",
  flexWrap: "wrap",
};

export const OnASurface = () => (
  <div style={screen}>
    <Paper elevation={1} style={{ flex: 1 }}>
      <Typography variant="titleMedium">Invoices</Typography>
      <Typography variant="bodySmall">14 open · 3 overdue</Typography>
      <div style={{ height: 12 }} />
      <Divider contentSpacing={0} />
      <div style={{ height: 12 }} />
      <Typography variant="bodyMedium">
        INV-2043 · Acme Inc. · €1,280.00
      </Typography>
      <div style={{ height: 8 }} />
      <Typography variant="bodyMedium">
        INV-2042 · Vento Lab · €640.00
      </Typography>
      <FAB icon="plus" onClick={() => {}} />
    </Paper>
  </div>
);

export const Sizes = () => (
  <div style={row}>
    <FAB icon="pencil-outline" size="small" onClick={() => {}} style={inline} />
    <FAB icon="plus" size="medium" onClick={() => {}} style={inline} />
    <FAB icon="plus" size="large" onClick={() => {}} style={inline} />
  </div>
);

export const Extended = () => (
  <div style={row}>
    <FAB
      icon="plus"
      label="New invoice"
      variant="extended"
      onClick={() => {}}
      style={inline}
    />
    <FAB
      icon="upload-outline"
      label="Upload"
      variant="extended"
      onClick={() => {}}
      style={inline}
    />
  </div>
);

export const Positions = () => (
  <div style={screen}>
    <Paper
      elevation={1}
      outline
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Typography variant="labelMedium">
        All four corners are anchored
      </Typography>
      <div style={{ height: 4 }} />
      <Typography variant="bodySmall">
        top-left · top-right · bottom-left · bottom-right
      </Typography>
      <FAB
        icon="arrow-left"
        size="small"
        position="top-left"
        onClick={() => {}}
      />
      <FAB
        icon="magnify"
        size="small"
        position="top-right"
        onClick={() => {}}
      />
      <FAB
        icon="filter-variant"
        size="small"
        position="bottom-left"
        onClick={() => {}}
      />
      <FAB icon="plus" position="bottom-right" onClick={() => {}} />
    </Paper>
  </div>
);

// The animated variant: the label folds into the icon and back.
const animatedStage: React.CSSProperties = {
  width: 420,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

export const AnimatedExtendedAndCollapsed = () => (
  <div style={animatedStage}>
    <Typography variant="labelMedium">
      extended toggles between the pill and the icon
    </Typography>
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <FAB
        variant="animated"
        icon="plus"
        label="New ticket"
        placement="inline"
        onClick={() => {}}
      />
      <FAB
        variant="animated"
        icon="plus"
        label="New ticket"
        placement="inline"
        extended={false}
        onClick={() => {}}
      />
    </div>
  </div>
);

export const AnimatedFrom = () => (
  <div style={animatedStage}>
    {(["right", "left"] as const).map((from) => (
      <div
        key={from}
        style={{ display: "flex", flexDirection: "column", gap: 6 }}
      >
        <Typography variant="labelSmall">{`animateFrom="${from}"`}</Typography>
        <div style={{ display: "flex" }}>
          <FAB
            variant="animated"
            icon="pencil-outline"
            label="Edit"
            animateFrom={from}
            placement="inline"
            onClick={() => {}}
          />
        </div>
      </div>
    ))}
  </div>
);

// The behaviour it exists for: collapse while the list scrolls.
export const AnimatedShrinkOnScroll = () => {
  const [extended, setExtended] = React.useState(true);

  return (
    <div style={{ ...animatedStage, height: 300 }}>
      <Typography variant="labelMedium">Scroll the list</Typography>
      <div style={{ position: "relative", flex: 1, display: "flex" }}>
        <Paper elevation={1} outline style={{ flex: 1 }}>
          <div
            style={{ maxHeight: 200, overflowY: "auto" }}
            onScroll={(event) =>
              setExtended(event.currentTarget.scrollTop <= 0)
            }
          >
            {Array.from({ length: 12 }, (_, index) => (
              <ListItem key={index}>{`Ticket ${index + 1}`}</ListItem>
            ))}
          </div>
        </Paper>
        <div style={{ position: "absolute", right: 12, bottom: 12 }}>
          <FAB
            variant="animated"
            icon="plus"
            label="New ticket"
            extended={extended}
            placement="inline"
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export const AnimatedDisabled = () => (
  <div style={{ display: "flex" }}>
    <FAB
      variant="animated"
      icon="plus"
      label="Unavailable"
      placement="inline"
      disabled
      onClick={() => {}}
    />
  </div>
);

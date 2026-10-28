import React from "react";
import { GridLayout, ListItem, Paper, Stat, Typography } from "@its/glowup-ui";
import type { GridLayoutItem } from "@its/glowup-ui";

// GridLayout stacks its children below `stackBelow` (a window size class, read
// from the window). A card's iframe can be narrower than a desktop window, so
// the grid stories pass stackBelow="compact": nothing is below compact, so they
// always lay out on the grid. `Stacked` passes "extraLarge" to show the stack.
const frame: React.CSSProperties = { width: 720 };

const Tile = ({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) => (
  <Paper outline elevation={0} style={{ flex: 1, padding: 16, gap: 8 }}>
    <Typography variant="titleSmall">{title}</Typography>
    {children}
  </Paper>
);

const DASHBOARD: GridLayoutItem[] = [
  { id: "revenue", x: 0, y: 0, w: 4, h: 2 },
  { id: "orders", x: 4, y: 0, w: 4, h: 2 },
  { id: "refunds", x: 8, y: 0, w: 4, h: 2 },
  { id: "recent", x: 0, y: 2, w: 8, h: 5 },
  { id: "team", x: 8, y: 2, w: 4, h: 5 },
];

export const Dashboard = () => (
  <div style={frame}>
    <GridLayout layout={DASHBOARD} stackBelow="compact">
      <Paper
        key="revenue"
        outline
        elevation={0}
        style={{ flex: 1, padding: 16 }}
      >
        <Stat label="Revenue" value="€48,210" delta="12.4%" trend="up" />
      </Paper>
      <Paper
        key="orders"
        outline
        elevation={0}
        style={{ flex: 1, padding: 16 }}
      >
        <Stat label="Orders" value="1,284" delta="3.1%" trend="up" />
      </Paper>
      <Paper
        key="refunds"
        outline
        elevation={0}
        style={{ flex: 1, padding: 16 }}
      >
        <Stat label="Refunds" value="23" delta="8.0%" trend="down" />
      </Paper>
      <Tile key="recent" title="Recent orders">
        <ListItem
          primaryText="#4821 · Marta Rossi"
          secondaryText="€320 · Paid"
        />
        <ListItem
          primaryText="#4820 · Luca Bianchi"
          secondaryText="€84 · Shipped"
        />
        <ListItem
          primaryText="#4819 · Sara Conti"
          secondaryText="€1,150 · Paid"
        />
      </Tile>
      <Tile key="team" title="On call">
        <ListItem icon="account-outline" primaryText="Marta" />
        <ListItem icon="account-outline" primaryText="Luca" />
      </Tile>
    </GridLayout>
  </div>
);

// Cells left empty stay empty: nothing moves up to fill a hole.
const GAPS: GridLayoutItem[] = [
  { id: "a", x: 0, y: 0, w: 6, h: 2 },
  { id: "b", x: 8, y: 0, w: 4, h: 3 },
  { id: "c", x: 2, y: 3, w: 6, h: 2 },
];

export const GapsStayEmpty = () => (
  <div style={frame}>
    <GridLayout layout={GAPS} stackBelow="compact">
      <Tile key="a" title="Columns 1–6, rows 1–2" />
      <Tile key="b" title="Columns 9–12, rows 1–3" />
      <Tile key="c" title="Columns 3–8, rows 4–5" />
    </GridLayout>
  </div>
);

const DETAIL: GridLayoutItem[] = [
  { id: "customer", x: 0, y: 0, w: 6, h: 3 },
  { id: "billing", x: 6, y: 0, w: 6, h: 3 },
];

const FIELDS: GridLayoutItem[] = [
  { id: "name", x: 0, y: 0, w: 3, h: 1 },
  { id: "since", x: 3, y: 0, w: 3, h: 1 },
  { id: "email", x: 0, y: 1, w: 6, h: 1 },
];

// An item can hold a grid of its own: with as many columns as the item spans,
// its cells line up with the outer grid's.
export const Nested = () => (
  <div style={frame}>
    <GridLayout layout={DETAIL} stackBelow="compact">
      <Tile key="customer" title="Customer">
        <GridLayout
          layout={FIELDS}
          columns={6}
          gap={8}
          rowHeight={40}
          stackBelow="compact"
        >
          <Typography key="name" variant="bodyMedium">
            Marta Rossi
          </Typography>
          <Typography key="since" variant="bodyMedium" color="onSurfaceVariant">
            Since 2021
          </Typography>
          <Typography key="email" variant="bodyMedium">
            marta@itsol.it
          </Typography>
        </GridLayout>
      </Tile>
      <Tile key="billing" title="Billing">
        <Typography variant="bodyMedium">Visa ending 4242</Typography>
        <Typography variant="bodyMedium" color="onSurfaceVariant">
          Next invoice on 1 June
        </Typography>
      </Tile>
    </GridLayout>
  </div>
);

// Below stackBelow the items stack full width in reading order (rows top to
// bottom, then left to right), each at its content's height.
export const Stacked = () => (
  <div style={{ width: 360 }}>
    <GridLayout layout={DASHBOARD} stackBelow="extraLarge">
      <Paper key="revenue" outline elevation={0} style={{ padding: 16 }}>
        <Stat label="Revenue" value="€48,210" delta="12.4%" trend="up" />
      </Paper>
      <Paper key="orders" outline elevation={0} style={{ padding: 16 }}>
        <Stat label="Orders" value="1,284" delta="3.1%" trend="up" />
      </Paper>
      <Paper key="refunds" outline elevation={0} style={{ padding: 16 }}>
        <Stat label="Refunds" value="23" delta="8.0%" trend="down" />
      </Paper>
      <Tile key="recent" title="Recent orders">
        <ListItem
          primaryText="#4821 · Marta Rossi"
          secondaryText="€320 · Paid"
        />
      </Tile>
      <Tile key="team" title="On call">
        <ListItem icon="account-outline" primaryText="Marta" />
      </Tile>
    </GridLayout>
  </div>
);

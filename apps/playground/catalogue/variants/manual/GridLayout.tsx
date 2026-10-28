import { GridLayout, Paper, Typography } from "@its/glowup-ui";
import type { Variant } from "../types";

// Hand-written: GridLayout has no authored preview, and its states are
// arrangements of cells rather than props of one control.

const Card = ({ title }: { title: string }) => (
  <Paper style={{ flexGrow: 1 }}>
    <Typography variant="titleSmall">{title}</Typography>
  </Paper>
);

const Gaps = () => (
  <GridLayout
    layout={[
      { id: "a", x: 0, y: 0, w: 4, h: 2 },
      { id: "b", x: 8, y: 0, w: 4, h: 2 },
      { id: "c", x: 2, y: 3, w: 8, h: 1 },
    ]}
  >
    <Card key="a" title="Columns 1–4" />
    <Card key="b" title="Columns 9–12" />
    <Card key="c" title="Row 4, after an empty row" />
  </GridLayout>
);

const Nested = () => (
  <GridLayout layout={[{ id: "card", x: 0, y: 0, w: 6, h: 4 }]}>
    <Paper key="card" style={{ flexGrow: 1 }}>
      <GridLayout
        columns={6}
        layout={[
          { id: "title", x: 0, y: 0, w: 6, h: 1 },
          { id: "left", x: 0, y: 1, w: 3, h: 2 },
          { id: "right", x: 3, y: 1, w: 3, h: 2 },
        ]}
      >
        <Typography key="title" variant="titleSmall">
          A card six columns wide
        </Typography>
        <Card key="left" title="Its own columns 1–3" />
        <Card key="right" title="Its own columns 4–6" />
      </GridLayout>
    </Paper>
  </GridLayout>
);

export const variants: Variant[] = [
  {
    name: "Gaps",
    title: "Gaps",
    description:
      "Items stay where they are placed: empty columns and rows stay empty.",
    render: Gaps,
  },
  {
    name: "Nested",
    title: "Nested",
    description:
      "A grid inside a card, with as many columns as the card spans: its cells are about as wide as the page's, a little narrower for the card's padding.",
    render: Nested,
  },
];

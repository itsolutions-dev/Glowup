import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Divider, FAB, ListItem, Paper, Typography } from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo } from "./shared";

// Hand-written rather than generated: the animated variant's authored preview
// scrolls a `<div>` with an onScroll handler. In React Native that is a
// ScrollView, which is a different component with a different event — not
// something a rewrite of the layout primitives can produce. A manual gallery
// replaces the generated one for the component, so the static demos of
// .design-sync/previews/FAB.tsx are written out here too.

// FAB is always `position: absolute` inside its nearest positioned ancestor.
// A Paper acts as the "screen" surface it floats over.
const screen = { width: 380, height: 220, flexDirection: "row" } as const;

// The DS itself un-anchors a FAB by re-declaring position (see SpeedDial's
// internal `fab` style), which is how a FAB is laid out inline in a row.
const inline = {
  position: "relative" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const OnASurface = () => (
  <View style={screen}>
    <Paper elevation={1} style={{ flex: 1 }}>
      <Typography variant="titleMedium">Invoices</Typography>
      <Typography variant="bodySmall">14 open · 3 overdue</Typography>
      <View style={{ height: 12 }} />
      <Divider contentSpacing={0} />
      <View style={{ height: 12 }} />
      <Typography variant="bodyMedium">
        INV-2043 · Acme Inc. · €1,280.00
      </Typography>
      <View style={{ height: 8 }} />
      <Typography variant="bodyMedium">
        INV-2042 · Vento Lab · €640.00
      </Typography>
      <FAB icon="plus" onClick={() => {}} />
    </Paper>
  </View>
);

const Sizes = () => (
  <View style={demo.row}>
    <FAB icon="pencil-outline" size="small" onClick={() => {}} style={inline} />
    <FAB icon="plus" size="medium" onClick={() => {}} style={inline} />
    <FAB icon="plus" size="large" onClick={() => {}} style={inline} />
  </View>
);

const ExtendedStatic = () => (
  <View style={demo.row}>
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
  </View>
);

const Positions = () => (
  <View style={screen}>
    <Paper
      elevation={1}
      outline
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Typography variant="labelMedium">
        All four corners are anchored
      </Typography>
      <View style={{ height: 4 }} />
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
  </View>
);

const Extended = () => (
  <View style={demo.row}>
    <FAB
      variant="animated"
      icon="plus"
      label="New work order"
      placement="inline"
      extended
      onClick={() => {}}
    />
  </View>
);

const Collapsed = () => (
  <View style={demo.row}>
    <FAB
      variant="animated"
      icon="plus"
      label="New work order"
      placement="inline"
      extended={false}
      onClick={() => {}}
    />
    <Typography variant="bodySmall">
      Collapsed to the icon; the label animates back in when `extended` flips.
    </Typography>
  </View>
);

const ShrinkOnScroll = () => {
  const [extended, setExtended] = useState(true);

  return (
    <View style={[demo.panel, styles.scrollDemo]}>
      <Typography variant="labelMedium">Scroll the list</Typography>
      <Paper elevation={1} outline style={styles.paper}>
        <ScrollView
          style={styles.list}
          onScroll={(event) =>
            setExtended(event.nativeEvent.contentOffset.y <= 0)
          }
          scrollEventThrottle={16}
        >
          {Array.from({ length: 12 }, (_, index) => (
            <ListItem key={index} primaryText={`Work order ${index + 1}`} />
          ))}
        </ScrollView>
      </Paper>
      <View style={styles.fab}>
        <FAB
          variant="animated"
          icon="plus"
          label="New work order"
          extended={extended}
          placement="inline"
          onClick={() => {}}
        />
      </View>
    </View>
  );
};

const Disabled = () => (
  <View style={demo.row}>
    <FAB
      variant="animated"
      icon="plus"
      label="Unavailable"
      placement="inline"
      disabled
      onClick={() => {}}
    />
  </View>
);

const styles = StyleSheet.create({
  scrollDemo: { height: 300 },
  paper: { flex: 1, overflow: "hidden" },
  list: { maxHeight: 200 },
  fab: { position: "absolute", right: 12, bottom: 12 },
});

export const variants: Variant[] = [
  { name: "OnASurface", title: "On a surface", render: OnASurface },
  { name: "Sizes", title: "Sizes", render: Sizes },
  { name: "Extended", title: "Extended", render: ExtendedStatic },
  { name: "Positions", title: "Positions", render: Positions },
  {
    name: "AnimatedExtendedAndCollapsed",
    title: "Animated, extended",
    render: Extended,
  },
  {
    name: "AnimatedCollapsed",
    title: "Animated, collapsed",
    render: Collapsed,
  },
  {
    name: "AnimatedShrinkOnScroll",
    title: "Animated, shrink on scroll",
    description:
      "The behaviour it exists for: the label collapses as soon as the list underneath moves, and comes back at the top.",
    render: ShrinkOnScroll,
  },
  { name: "AnimatedDisabled", title: "Animated, disabled", render: Disabled },
];

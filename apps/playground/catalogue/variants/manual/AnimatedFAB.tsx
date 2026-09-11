import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { AnimatedFAB, ListItem, Paper, Typography } from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo } from "./shared";

// Hand-written rather than generated: the authored preview scrolls a `<div>`
// with an onScroll handler. In React Native that is a ScrollView, which is a
// different component with a different event — not something a rewrite of the
// layout primitives can produce.

const Extended = () => (
  <View style={demo.row}>
    <AnimatedFAB
      icon="plus"
      label="New work order"
      placement="inline"
      extended
      onPress={() => {}}
    />
  </View>
);

const Collapsed = () => (
  <View style={demo.row}>
    <AnimatedFAB
      icon="plus"
      label="New work order"
      placement="inline"
      extended={false}
      onPress={() => {}}
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
            <ListItem key={index}>{`Work order ${index + 1}`}</ListItem>
          ))}
        </ScrollView>
      </Paper>
      <View style={styles.fab}>
        <AnimatedFAB
          icon="plus"
          label="New work order"
          extended={extended}
          placement="inline"
          onPress={() => {}}
        />
      </View>
    </View>
  );
};

const Disabled = () => (
  <View style={demo.row}>
    <AnimatedFAB
      icon="plus"
      label="Unavailable"
      placement="inline"
      disabled
      onPress={() => {}}
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
  { name: "Extended", title: "Extended", render: Extended },
  { name: "Collapsed", title: "Collapsed", render: Collapsed },
  {
    name: "ShrinkOnScroll",
    title: "Shrink on scroll",
    description:
      "The behaviour it exists for: the label collapses as soon as the list underneath moves, and comes back at the top.",
    render: ShrinkOnScroll,
  },
  { name: "Disabled", title: "Disabled", render: Disabled },
];

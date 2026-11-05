import React from "react";
import { ScrollView } from "react-native";

// The context a ScrollView gives its children; react-native-web's ScrollView
// has none, so there is nothing to clear on the web.
const ScrollContext = (
  ScrollView as unknown as { Context?: React.Context<unknown> }
).Context;

/**
 * Around a list that scrolls in a box of its own (a fixed or capped height):
 * the endless calendar, an open Select or Menu. They sit inside pages that
 * scroll too, a form nearly always, and React Native warned "VirtualizedLists
 * should never be nested inside plain ScrollViews" on every such screen. A list
 * in its own box windows correctly, so the page's ScrollView context is cleared
 * for it. The list itself takes `nestedScrollEnabled`, so on Android the finger
 * stays with it.
 */
const OwnScroller = ({ children }: { children: React.ReactNode }) =>
  ScrollContext ? (
    <ScrollContext.Provider value={null}>{children}</ScrollContext.Provider>
  ) : (
    <>{children}</>
  );

export default OwnScroller;

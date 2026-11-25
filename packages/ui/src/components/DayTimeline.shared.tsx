import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import type { Theme } from "../providers/ThemeProvider";
import { Draggable } from "./DragDrop";
import { toneFromColor } from "../providers/toneFrom";
import type { DayTimelineEvent, DayTimelineProps } from "./DayTimeline";

// The tint is computed from the hex digits; anything else (a colour name,
// "#f00") would give no colour at all, so it falls back to the theme's.
const HEX = /^#[0-9a-f]{6}$/i;

// Hours and minutes by hand, as the CRM does: no Intl formatter per row,
// which costs milliseconds each on Hermes for Android.
export const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export const timesOf = (event: DayTimelineEvent) =>
  `${hhmm(event.start)} – ${hhmm(event.end)}`;

/** The card's surface, its text and the bar on its start edge. */
export const eventLook = (event: DayTimelineEvent, theme: Theme) => {
  const color =
    event.color && HEX.test(event.color) ? event.color : theme.colors.primary;
  if (event.canceled)
    return {
      background: theme.colors.surfaceContainerHighest,
      foreground: theme.colors.onSurfaceVariant,
      bar: theme.colors.outline,
    };
  return {
    ...toneFromColor(color, theme.isDark ? "dark" : "light"),
    bar: color,
  };
};

/** What a screen reader hears for an event. */
export const eventName = (event: DayTimelineEvent, canceledWord: string) =>
  [
    event.overline,
    event.title,
    timesOf(event),
    event.note,
    event.canceled ? canceledWord : undefined,
  ]
    .filter(Boolean)
    .join(", ");

/**
 * An event's card in the grid and the month: draggable when the events can be
 * moved (its tap still opens it), else a button with `onPress`, else a label.
 */
export const EventSurface = ({
  event,
  editable,
  onPress,
  name,
  style,
  testID,
  children,
}: {
  event: DayTimelineEvent;
  editable: boolean;
  onPress?: (event: DayTimelineEvent) => void;
  name: string;
  style: StyleProp<ViewStyle>;
  testID?: string;
  children: React.ReactNode;
}) => {
  const press = onPress && (() => onPress(event));
  if (editable)
    return (
      <Draggable
        id={String(event.id)}
        data={event}
        onPress={press}
        accessibilityLabel={name}
        style={style}
        // The preview is drawn at the card's size: it needs the card's own surface.
        preview={<View style={[style, styles.fill]}>{children}</View>}
        testID={testID}
      >
        {children}
      </Draggable>
    );
  if (press)
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={name}
        onPress={press}
        style={style}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  return (
    <View accessible accessibilityLabel={name} style={style} testID={testID}>
      {children}
    </View>
  );
};

/** What a layout gets: the props with their defaults filled in. */
export type LayoutProps = Omit<DayTimelineProps, "layout"> &
  Required<
    Pick<
      DayTimelineProps,
      | "weekDays"
      | "startHour"
      | "endHour"
      | "hourHeight"
      | "step"
      | "maxPerDay"
      | "resizable"
      | "loading"
      | "emptyState"
    >
  >;

const styles = StyleSheet.create({ fill: { flex: 1 } });

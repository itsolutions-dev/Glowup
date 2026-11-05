import React, { useMemo } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";
import { toneFromColor } from "../providers/toneFrom";
import EmptyState, { EmptyStateProps } from "./EmptyState";
import Skeleton from "./Skeleton";

export interface DayTimelineEvent {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  /** A small line above the title: the kind of event ("Appointment", "Call back"). */
  overline?: string;
  /** Shown after the times: "09:00 – 09:30 · note". */
  note?: string;
  /**
   * A `#RRGGBB` colour: it tints the card, readable in both schemes, and draws
   * a bar on its start edge. Defaults to the theme's `primary`, which also
   * stands in for a colour in any other form.
   */
  color?: string;
  /** Greyed out and struck through. */
  canceled?: boolean;
}

export interface DayTimelineLabels {
  /** Appended to a canceled event's name for screen readers. Defaults to "canceled". */
  canceled?: string;
}

export interface DayTimelineProps {
  /** The day's events, in any order: they are shown by start time. */
  events: DayTimelineEvent[];
  /** Called with the pressed event. Makes each card a button. */
  onEventPress?: (event: DayTimelineEvent) => void;
  /** Shows a list skeleton in place of the events. */
  loading?: boolean;
  /** Shown when there are no events. Defaults to "Nothing scheduled". */
  emptyState?: EmptyStateProps;
  /** Words read by screen readers, for another language. */
  labels?: DayTimelineLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Hours and minutes by hand, as the CRM does: no Intl formatter per row,
// which costs milliseconds each on Hermes for Android.
// The tint is computed from the hex digits; anything else (a colour name,
// "#f00") would give no colour at all, so it falls back to the theme's.
const HEX = /^#[0-9a-f]{6}$/i;

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const DayTimeline = ({
  events,
  onEventPress,
  loading = false,
  emptyState = { icon: "calendar-blank-outline", title: "Nothing scheduled" },
  labels,
  style,
  testID,
}: DayTimelineProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const sorted = useMemo(
    () => [...events].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events],
  );

  if (loading) {
    return (
      <View style={style} testID={testID}>
        <Skeleton preset="list" count={4} itemHeight={72} />
      </View>
    );
  }
  if (!sorted.length) {
    return (
      <View style={style} testID={testID}>
        <EmptyState {...emptyState} />
      </View>
    );
  }

  const mode = theme.isDark ? "dark" : "light";
  const canceledWord = labels?.canceled ?? "canceled";

  return (
    <View style={[styles.list, style]} testID={testID}>
      {sorted.map((event) => {
        const times = `${hhmm(event.start)} – ${hhmm(event.end)}`;
        const color =
          event.color && HEX.test(event.color)
            ? event.color
            : theme.colors.primary;
        const name = [
          event.overline,
          event.title,
          times,
          event.note,
          event.canceled ? canceledWord : undefined,
        ]
          .filter(Boolean)
          .join(", ");
        const tone = event.canceled
          ? {
              background: theme.colors.surfaceContainerHighest,
              foreground: theme.colors.onSurfaceVariant,
            }
          : toneFromColor(color, mode);
        const bar = event.canceled ? theme.colors.outline : color;
        const text = [
          { color: tone.foreground },
          event.canceled && styles.struck,
        ];
        const card = [
          styles.card,
          { backgroundColor: tone.background, borderStartColor: bar },
        ];
        const body = (
          <>
            {!!event.overline && (
              <Text style={[styles.overline, text]} numberOfLines={1}>
                {event.overline}
              </Text>
            )}
            <Text style={[styles.title, text]} numberOfLines={1}>
              {event.title}
            </Text>
            <Text style={[styles.times, text]} numberOfLines={1}>
              {event.note ? `${times} · ${event.note}` : times}
            </Text>
          </>
        );

        return (
          <View key={event.id} style={styles.row}>
            <Text style={styles.time}>{hhmm(event.start)}</Text>
            {onEventPress ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={name}
                onPress={() => onEventPress(event)}
                style={card}
              >
                {body}
              </Pressable>
            ) : (
              <View accessible accessibilityLabel={name} style={card}>
                {body}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    list: { gap: theme.spacing.s },
    row: { flexDirection: "row", alignItems: "center", gap: theme.spacing.s },
    time: {
      ...theme.typography.labelMedium,
      width: 46,
      color: theme.colors.onSurfaceVariant,
    },
    card: {
      flex: 1,
      minWidth: 0,
      borderRadius: theme.shape.medium,
      borderStartWidth: 4,
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
    },
    overline: { ...theme.typography.labelSmall, fontWeight: "700" },
    title: theme.typography.titleSmall,
    times: theme.typography.bodySmall,
    struck: { textDecorationLine: "line-through" },
  });

export default DayTimeline;

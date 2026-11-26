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
import EmptyState, { EmptyStateProps } from "./EmptyState";
import Skeleton from "./Skeleton";
import {
  LayoutProps,
  eventLook,
  eventName,
  eventWords,
  titleOf,
  hhmm,
  timesOf,
} from "./DayTimeline.shared";
import DayTimelineGrid from "./DayTimeline.grid";
import DayTimelineMonth from "./DayTimeline.month";

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
  /** Done: a dot before the title, and `labels.completed` for screen readers. */
  completed?: boolean;
  /**
   * `false` keeps this event where it is when the events can be moved
   * (`onEventChange`): it cannot be dragged or resized, and a tap still opens
   * it. Defaults to `true`.
   */
  editable?: boolean;
}

export interface DayTimelineLabels {
  /** Appended to a canceled event's name for screen readers. Defaults to "canceled". */
  canceled?: string;
  /** Appended to a completed event's name for screen readers. Defaults to "completed". */
  completed?: string;
  /** The month layout's link to a day's hidden events. Defaults to `+3 more`. */
  more?: (count: number) => string;
  /** The name of the handle that resizes an event in the grid. Defaults to "Change the end". */
  resize?: string;
}

/** Where a moved or resized event now starts and ends. */
export interface DayTimelineChange {
  start: Date;
  end: Date;
}

/**
 * - `list`: one day's events as rows, as in a phone agenda.
 * - `grid`: one column per day of `days`, on a grid of hours, overlapping
 *   events side by side, as in a desktop calendar's day and week views.
 * - `month`: the weeks of `month`, a few events per day and "+N" for the rest.
 */
export type DayTimelineLayout = "list" | "grid" | "month";

export interface DayTimelineProps {
  /**
   * The events, in any order: they are shown by start time. The grid and the
   * month place each one on the day it starts and leave out the others.
   */
  events: DayTimelineEvent[];
  /** How the events are laid out. Defaults to `"list"`. */
  layout?: DayTimelineLayout;
  /** The grid's columns, one per day, in the order given. Defaults to today. */
  days?: Date[];
  /** Any day of the month the month layout shows. Defaults to today. */
  month?: Date;
  /**
   * The month layout's weekdays, as `Date#getDay()` numbers (0 = Sunday … 6 =
   * Saturday), shown from the first day of the week. Defaults to all seven.
   */
  weekDays?: number[];
  /** The grid's first hour, 0–23. Defaults to 8. */
  startHour?: number;
  /** The hour the grid ends at, 1–24. Defaults to 20. */
  endHour?: number;
  /** The height of an hour in the grid, in dp. Defaults to 48. */
  hourHeight?: number;
  /** The minutes a press, a move or a resize in the grid snaps to. Defaults to 30. */
  step?: number;
  /** The month layout's events per day before "+N". Defaults to 3. */
  maxPerDay?: number;
  /** The weekday names and the first day of the week. Defaults to the device's. */
  locale?: string;
  /** The first day of the week, 0 = Sunday … 6 = Saturday. Defaults to the locale's. */
  firstDayOfWeek?: number;
  /** Called with the pressed event. Makes each card a button. */
  onEventPress?: (event: DayTimelineEvent) => void;
  /**
   * Makes the grid's and the month's events draggable: drop one on another
   * time or day (in the month, another day at the same time) to move it,
   * keeping its length. Called with the event and where it now is; update
   * `events` here.
   */
  onEventChange?: (event: DayTimelineEvent, change: DayTimelineChange) => void;
  /** With `onEventChange`, a handle at the foot of each grid event drags its end. */
  resizable?: boolean;
  /**
   * A press on an empty part of the grid, with its time snapped to `step`, or
   * on an empty part of a month's day, with that day at `startHour`.
   */
  onSlotPress?: (start: Date) => void;
  /** A press on a day's heading in the grid or its number in the month. */
  onDayPress?: (day: Date) => void;
  /** Shows a list skeleton in place of the events. */
  loading?: boolean;
  /** Shown when there are no events. Defaults to "Nothing scheduled". */
  emptyState?: EmptyStateProps;
  /** Words read by screen readers, for another language. */
  labels?: DayTimelineLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * A day's events as a list (a phone agenda), or several days' on a grid of
 * hours, or a month: see `layout`.
 */
const DayTimeline = ({
  layout = "list",
  weekDays = ALL_DAYS,
  startHour = 8,
  endHour = 20,
  hourHeight = 48,
  step = 30,
  maxPerDay = 3,
  resizable = false,
  loading = false,
  emptyState = { icon: "calendar-blank-outline", title: "Nothing scheduled" },
  ...rest
}: DayTimelineProps) => {
  const props: LayoutProps = {
    ...rest,
    weekDays,
    startHour,
    endHour,
    hourHeight,
    step,
    maxPerDay,
    resizable,
    loading,
    emptyState,
  };
  if (layout === "grid") return <DayTimelineGrid {...props} />;
  if (layout === "month") return <DayTimelineMonth {...props} />;
  return <DayList {...props} />;
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const DayList = ({
  events,
  onEventPress,
  loading,
  emptyState,
  labels,
  style,
  testID,
}: LayoutProps) => {
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

  const words = eventWords(labels);

  return (
    <View style={[styles.list, style]} testID={testID}>
      {sorted.map((event) => {
        const times = timesOf(event);
        const name = eventName(event, words);
        const tone = eventLook(event, theme);
        const bar = tone.bar;
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
              {titleOf(event)}
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

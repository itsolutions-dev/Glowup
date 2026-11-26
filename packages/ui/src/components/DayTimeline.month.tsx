import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";
import { DragDropProvider, DragEndEvent, Droppable } from "./DragDrop";
import {
  getDeviceLocale,
  getFirstDayOfWeek,
  getWeekdayNames,
  isSameDay,
  startOfDay,
} from "./DateTimePicker.shared";
import {
  EventSurface,
  eventLook,
  eventName,
  eventWords,
  type EventWords,
  titleOf,
  hhmm,
  LayoutProps,
} from "./DayTimeline.shared";
import Popover from "./Popover";
import {
  addMinutes,
  atMinutes,
  durationOf,
  minutesOf,
  monthWeeks,
} from "./internal/timeGrid";
import type { DayTimelineEvent } from "./DayTimeline";

// A day's cell holds its number and about three one-line events.
const CELL_HEIGHT = 112;
const TODAY_MARK = 24;

const defaultMore = (count: number) => `+${count} more`;

/**
 * DayTimeline's `month` layout: the weeks of a month, each day with its first
 * events and "+N" opening the rest; with `onEventChange`, drag an event to
 * another day to move it there at the same time.
 */
const DayTimelineMonth = ({
  events,
  month,
  weekDays,
  locale: localeProp,
  firstDayOfWeek,
  maxPerDay,
  startHour,
  onEventPress,
  onEventChange,
  onSlotPress,
  onDayPress,
  labels,
  style,
  testID,
}: LayoutProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [today] = useState(() => startOfDay(new Date()));
  const shown = month ?? today;
  const locale = localeProp ?? getDeviceLocale();
  const short = getWeekdayNames(locale);
  const full = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "full" }),
    [locale],
  );
  const weeks = monthWeeks(
    shown,
    firstDayOfWeek ?? getFirstDayOfWeek(locale),
    weekDays,
  );
  // Each day's events by start, keyed by the day's midnight.
  const byDay = useMemo(() => {
    const map = new Map<number, DayTimelineEvent[]>();
    for (const e of [...events].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    )) {
      const key = startOfDay(e.start).getTime();
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return map;
  }, [events]);

  const drop = ({ active, over }: DragEndEvent) => {
    if (!over || !onEventChange) return;
    const event = active.data as DayTimelineEvent;
    const day = over.data as Date;
    if (isSameDay(day, event.start)) return;
    const start = atMinutes(day, minutesOf(event.start));
    onEventChange(event, { start, end: addMinutes(start, durationOf(event)) });
  };

  const cell = {
    today,
    month: shown.getMonth(),
    maxPerDay,
    startHour,
    full,
    onEventPress,
    editable: !!onEventChange,
    onSlotPress,
    onDayPress,
    words: eventWords(labels),
    more: labels?.more ?? defaultMore,
    styles,
    testID,
  };

  return (
    <DragDropProvider onDragEnd={drop}>
      <View style={[styles.root, style]} testID={testID}>
        <View style={styles.row}>
          {(weeks[0] ?? []).map((day) => (
            <Text key={day.getDay()} style={styles.weekday}>
              {short[day.getDay()]}
            </Text>
          ))}
        </View>
        {weeks.map((week) => (
          <View key={week[0]?.getTime()} style={[styles.row, styles.week]}>
            {week.map((day) => (
              <MonthCell
                key={day.getTime()}
                day={day}
                events={byDay.get(day.getTime()) ?? []}
                {...cell}
              />
            ))}
          </View>
        ))}
      </View>
    </DragDropProvider>
  );
};

type Styles = ReturnType<typeof makeStyles>;

const MonthCell = ({
  day,
  events,
  today,
  month,
  maxPerDay,
  startHour,
  full,
  onEventPress,
  editable,
  onSlotPress,
  onDayPress,
  words,
  more,
  styles,
  testID,
}: {
  day: Date;
  events: DayTimelineEvent[];
  today: Date;
  month: number;
  maxPerDay: number;
  startHour: number;
  full: Intl.DateTimeFormat;
  onEventPress?: (event: DayTimelineEvent) => void;
  editable: boolean;
  onSlotPress?: (start: Date) => void;
  onDayPress?: (day: Date) => void;
  words: EventWords;
  more: (count: number) => string;
  styles: Styles;
  testID?: string;
}) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const isToday = isSameDay(day, today);
  const visible = events.slice(0, Math.max(0, maxPerDay));
  const hidden = events.length - visible.length;
  const key = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;

  const numberColor = isToday
    ? theme.colors.onPrimary
    : day.getMonth() === month
      ? theme.colors.onSurface
      : theme.colors.outline;
  const number = (
    <Text style={[theme.typography.labelMedium, { color: numberColor }]}>
      {day.getDate()}
    </Text>
  );
  const mark = [styles.number, isToday && styles.today];

  const chip = (event: DayTimelineEvent, inList: boolean) => {
    const look = eventLook(event, theme);
    return (
      <EventSurface
        key={event.id}
        event={event}
        editable={editable && !inList}
        onPress={
          onEventPress &&
          ((e) => {
            setOpen(false);
            onEventPress(e);
          })
        }
        name={eventName(event, words)}
        style={[
          styles.chip,
          { backgroundColor: look.background, borderStartColor: look.bar },
        ]}
        testID={testID && `${testID}-event-${event.id}`}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.chipText,
            { color: look.foreground },
            event.canceled && styles.struck,
          ]}
        >
          {`${hhmm(event.start)} ${titleOf(event)}`}
        </Text>
      </EventSurface>
    );
  };

  return (
    <Droppable
      id={`day-${day.getTime()}`}
      data={day}
      indicator={false}
      style={styles.cell}
      testID={testID && `${testID}-day-${key}`}
    >
      {({ isOver }) => (
        <>
          {onSlotPress && (
            <Pressable
              accessible={false}
              onPress={() => onSlotPress(atMinutes(day, startHour * 60))}
              style={StyleSheet.absoluteFill}
              testID={testID && `${testID}-empty-${key}`}
            />
          )}
          {isOver && (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.over]}
            />
          )}
          {onDayPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={full.format(day)}
              onPress={() => onDayPress(day)}
              style={mark}
            >
              {number}
            </Pressable>
          ) : (
            <View accessible accessibilityLabel={full.format(day)} style={mark}>
              {number}
            </View>
          )}
          {visible.map((e) => chip(e, false))}
          {hidden > 0 && (
            <Popover
              visible={open}
              onDismiss={() => setOpen(false)}
              anchor={
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setOpen(true)}
                  style={styles.more}
                >
                  <Text style={styles.moreText}>{more(hidden)}</Text>
                </Pressable>
              }
            >
              <View style={styles.list}>
                <Text style={styles.listTitle}>{full.format(day)}</Text>
                {events.map((e) => chip(e, true))}
              </View>
            </Popover>
          )}
        </>
      )}
    </Droppable>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderStartWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outlineVariant,
    },
    row: { flexDirection: "row" },
    week: { flexGrow: 1 },
    weekday: {
      ...theme.typography.labelSmall,
      flex: 1,
      textAlign: "center",
      paddingVertical: theme.spacing.s,
      color: theme.colors.onSurfaceVariant,
      borderEndWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outlineVariant,
    },
    cell: {
      flex: 1,
      minWidth: 0,
      minHeight: CELL_HEIGHT,
      gap: theme.spacing.xs,
      padding: theme.spacing.xs,
      borderEndWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.outlineVariant,
    },
    over: { backgroundColor: theme.colors.primaryContainer, opacity: 0.5 },
    number: {
      alignSelf: "flex-start",
      minWidth: TODAY_MARK,
      height: TODAY_MARK,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.shape.medium,
    },
    today: { backgroundColor: theme.colors.primary },
    chip: {
      borderRadius: theme.shape.small,
      borderStartWidth: 4,
      paddingHorizontal: theme.spacing.xs,
    },
    chipText: theme.typography.labelMedium,
    struck: { textDecorationLine: "line-through" },
    more: { alignSelf: "flex-start", paddingHorizontal: theme.spacing.xs },
    moreText: { ...theme.typography.labelMedium, color: theme.colors.primary },
    list: { gap: theme.spacing.xs, padding: theme.spacing.s, minWidth: 224 },
    listTitle: {
      ...theme.typography.titleSmall,
      color: theme.colors.onSurface,
      paddingBottom: theme.spacing.xs,
    },
  });

export default DayTimelineMonth;

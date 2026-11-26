import React, { useMemo, useRef, useState } from "react";
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { rgba } from "polished";
import { Theme, useTheme } from "../providers/ThemeProvider";
import {
  DragDropProvider,
  DragEndEvent,
  Droppable,
  useDragScroll,
  useDragState,
} from "./DragDrop";
import {
  getDeviceLocale,
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
  timesOf,
  LayoutProps,
} from "./DayTimeline.shared";
import {
  addMinutes,
  atMinutes,
  dropMinutes,
  durationOf,
  minutesOf,
  overlapLanes,
  snap,
  verticalPlacement,
} from "./internal/timeGrid";
import type {
  DayTimelineChange,
  DayTimelineEvent,
  DayTimelineProps,
} from "./DayTimeline";

// The hour labels' column, the shortest card and the resize handle, in dp.
const GUTTER = 48;
const MIN_HEIGHT = 20;
const HANDLE = 8;
// A card this tall has room for its times under the title.
const TWO_LINES = 40;

interface Grid {
  startHour: number;
  endHour: number;
  hourHeight: number;
  step: number;
}

type Change = (event: DayTimelineEvent, change: DayTimelineChange) => void;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * DayTimeline's `grid` layout: a column per day on a grid of hours, events
 * placed by time, overlapping ones side by side; with `onEventChange`, drag
 * an event to move it and its foot to resize it.
 */
const DayTimelineGrid = ({
  events,
  days,
  startHour,
  endHour,
  hourHeight,
  step,
  locale: localeProp,
  onEventPress,
  onEventChange,
  resizable,
  onSlotPress,
  onDayPress,
  labels,
  style,
  testID,
}: LayoutProps) => {
  const [today] = useState(() => startOfDay(new Date()));
  const columns = days?.length ? days : [today];
  const grid = { startHour, endHour, hourHeight, step };

  const drop = ({ active, over }: DragEndEvent) => {
    if (!over || !onEventChange) return;
    const event = active.data as DayTimelineEvent;
    const length = durationOf(event);
    const minutes = dropMinutes(
      over.rect.y,
      length,
      startHour,
      endHour,
      hourHeight,
      step,
    );
    const start = atMinutes(columns[over.data as number], minutes);
    if (start.getTime() === event.start.getTime()) return;
    onEventChange(event, { start, end: addMinutes(start, length) });
  };

  return (
    <DragDropProvider onDragEnd={drop}>
      <GridBody
        events={events}
        columns={columns}
        today={today}
        grid={grid}
        locale={localeProp ?? getDeviceLocale()}
        onEventPress={onEventPress}
        onEventChange={onEventChange}
        resizable={resizable}
        onSlotPress={onSlotPress}
        onDayPress={onDayPress}
        words={eventWords(labels)}
        resizeWord={labels?.resize ?? "Change the end"}
        style={style}
        testID={testID}
      />
    </DragDropProvider>
  );
};

// Inside the provider, which `useDragScroll` reads.
const GridBody = ({
  events,
  columns,
  today,
  grid,
  locale,
  onEventPress,
  onEventChange,
  resizable,
  onSlotPress,
  onDayPress,
  words,
  resizeWord,
  style,
  testID,
}: {
  events: DayTimelineEvent[];
  columns: Date[];
  today: Date;
  grid: Grid;
  locale: string;
  onEventPress?: (event: DayTimelineEvent) => void;
  onEventChange?: Change;
  resizable: boolean;
  onSlotPress?: (start: Date) => void;
  onDayPress?: (day: Date) => void;
  words: EventWords;
  resizeWord: string;
  style: DayTimelineProps["style"];
  testID?: string;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const scroll = useDragScroll();
  const short = getWeekdayNames(locale);
  const full = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "full" }),
    [locale],
  );
  const { startHour, endHour, hourHeight } = grid;
  const hours = Array.from(
    { length: Math.max(0, endHour - startHour) },
    (_, i) => startHour + i,
  );

  return (
    <ScrollView
      {...scroll}
      scrollEventThrottle={16}
      stickyHeaderIndices={[0]}
      style={style}
      testID={testID}
    >
      <View style={styles.header}>
        <View style={styles.gutter} />
        {columns.map((day) => {
          const isToday = isSameDay(day, today);
          const color = isToday
            ? theme.colors.primary
            : theme.colors.onSurfaceVariant;
          const heading = (
            <>
              <Text style={[theme.typography.labelSmall, { color }]}>
                {short[day.getDay()]}
              </Text>
              <Text
                style={[
                  theme.typography.titleMedium,
                  { color: isToday ? color : theme.colors.onSurface },
                ]}
              >
                {day.getDate()}
              </Text>
            </>
          );
          return onDayPress ? (
            <Pressable
              key={day.getTime()}
              accessibilityRole="button"
              accessibilityLabel={full.format(day)}
              onPress={() => onDayPress(day)}
              style={styles.heading}
            >
              {heading}
            </Pressable>
          ) : (
            <View
              key={day.getTime()}
              accessible
              accessibilityLabel={full.format(day)}
              style={styles.heading}
            >
              {heading}
            </View>
          );
        })}
      </View>
      <View style={[styles.body, { height: hours.length * hourHeight }]}>
        <View style={styles.gutter}>
          {hours.map((h) => (
            <Text
              key={h}
              style={[styles.hour, { top: (h - startHour) * hourHeight }]}
            >
              {`${pad(h)}:00`}
            </Text>
          ))}
        </View>
        <View pointerEvents="none" style={styles.lines}>
          {hours.map((h) => (
            <React.Fragment key={h}>
              <View
                style={[styles.line, { top: (h - startHour) * hourHeight }]}
              />
              <View
                style={[
                  styles.line,
                  styles.halfLine,
                  { top: (h - startHour + 0.5) * hourHeight },
                ]}
              />
            </React.Fragment>
          ))}
        </View>
        {columns.map((day, index) => (
          <Column
            key={day.getTime()}
            index={index}
            day={day}
            isToday={isSameDay(day, today)}
            events={events}
            grid={grid}
            onEventPress={onEventPress}
            onEventChange={onEventChange}
            resizable={resizable}
            onSlotPress={onSlotPress}
            words={words}
            resizeWord={resizeWord}
            styles={styles}
            testID={testID}
          />
        ))}
      </View>
    </ScrollView>
  );
};

type Styles = ReturnType<typeof makeStyles>;

const Column = ({
  index,
  day,
  isToday,
  events,
  grid,
  onEventPress,
  onEventChange,
  resizable,
  onSlotPress,
  words,
  resizeWord,
  styles,
  testID,
}: {
  index: number;
  day: Date;
  isToday: boolean;
  events: DayTimelineEvent[];
  grid: Grid;
  onEventPress?: (event: DayTimelineEvent) => void;
  onEventChange?: Change;
  resizable: boolean;
  onSlotPress?: (start: Date) => void;
  words: EventWords;
  resizeWord: string;
  styles: Styles;
  testID?: string;
}) => {
  const { theme } = useTheme();
  const { startHour, endHour, hourHeight, step } = grid;
  const dayEvents = useMemo(
    () =>
      events
        .filter((e) => isSameDay(e.start, day))
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events, day],
  );
  const lanes = useMemo(() => overlapLanes(dayEvents), [dayEvents]);
  const zone = `day-${index}`;

  // The slot under the pointer: the step it falls in, not the nearest one.
  // A click on the web reports the browser's MouseEvent, which has `offsetY` (inside the empty
  // layer, which holds nothing) where a touch has `locationY`.
  const slot = (e: GestureResponderEvent) => {
    const { locationY, offsetY } = e.nativeEvent as typeof e.nativeEvent & {
      offsetY?: number;
    };
    const into = Math.floor(
      ((locationY ?? offsetY ?? 0) / hourHeight) * (60 / Math.max(1, step)),
    );
    const minutes = Math.min(
      startHour * 60 + into * Math.max(1, step),
      endHour * 60 - Math.max(1, step),
    );
    onSlotPress?.(atMinutes(day, Math.max(minutes, startHour * 60)));
  };

  return (
    <Droppable
      id={zone}
      data={index}
      indicator={false}
      style={[
        styles.column,
        isToday && { backgroundColor: rgba(theme.colors.primary, 0.04) },
      ]}
      testID={testID && `${testID}-day-${index}`}
    >
      {onSlotPress && (
        <Pressable
          accessible={false}
          onPress={slot}
          style={StyleSheet.absoluteFill}
          testID={testID && `${testID}-empty-${index}`}
        />
      )}
      {onEventChange && <Landing zone={zone} grid={grid} styles={styles} />}
      {dayEvents.map((event, k) => {
        const place = verticalPlacement(
          event,
          startHour,
          endHour,
          hourHeight,
          MIN_HEIGHT,
        );
        if (!place) return null;
        const { lane, lanes: of } = lanes[k];
        return (
          <GridEvent
            key={event.id}
            event={event}
            box={{
              top: place.top,
              height: place.height,
              left: `${(lane / of) * 100}%`,
              width: `${100 / of}%`,
            }}
            grid={grid}
            onPress={onEventPress}
            onChange={onEventChange}
            resizable={resizable}
            words={words}
            resizeWord={resizeWord}
            styles={styles}
            testID={testID}
          />
        );
      })}
    </Droppable>
  );
};

/** Where a dragged event would land in this column: a dashed outline. */
const Landing = ({
  zone,
  grid,
  styles,
}: {
  zone: string;
  grid: Grid;
  styles: Styles;
}) => {
  const { startHour, endHour, hourHeight, step } = grid;
  const length = useDragState((s) =>
    s.active ? durationOf(s.active.data as DayTimelineEvent) : 0,
  );
  const minutes = useDragState((s) =>
    s.over?.id === zone
      ? dropMinutes(s.over.rect.y, length, startHour, endHour, hourHeight, step)
      : -1,
  );
  if (minutes < 0) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.landing,
        {
          top: ((minutes - startHour * 60) / 60) * hourHeight,
          height: Math.max((length / 60) * hourHeight, MIN_HEIGHT),
        },
      ]}
    />
  );
};

const GridEvent = ({
  event,
  box,
  grid,
  onPress,
  onChange,
  resizable,
  words,
  resizeWord,
  styles,
  testID,
}: {
  event: DayTimelineEvent;
  box: ViewStyle;
  grid: Grid;
  onPress?: (event: DayTimelineEvent) => void;
  onChange?: Change;
  resizable: boolean;
  words: EventWords;
  resizeWord: string;
  styles: Styles;
  testID?: string;
}) => {
  const { theme } = useTheme();
  // The length while its foot is dragged, in minutes; null otherwise.
  const [length, setLength] = useState<number | null>(null);
  // Where the press on the foot began, down the page.
  const pressedAt = useRef(0);

  // The new length for a foot moved to `minutes` after the start: its end on
  // a step, at least the first one after the start, at most the grid's end.
  const resized = (minutes: number) => {
    const step = Math.max(1, grid.step);
    const from = minutesOf(event.start);
    const end = Math.min(
      Math.max(snap(from + minutes, step), Math.ceil((from + 1) / step) * step),
      grid.endHour * 60,
    );
    return end - from;
  };
  const dragged = (e: GestureResponderEvent) =>
    resized(
      durationOf(event) +
        ((e.nativeEvent.pageY - pressedAt.current) / grid.hourHeight) * 60,
    );
  const commit = (minutes: number) => {
    if (onChange && minutes !== durationOf(event))
      onChange(event, {
        start: event.start,
        end: addMinutes(event.start, minutes),
      });
  };

  const shown =
    length === null
      ? event
      : { ...event, end: addMinutes(event.start, length) };
  const height =
    length === null
      ? (box.height as number)
      : Math.max((length / 60) * grid.hourHeight, MIN_HEIGHT);
  const look = eventLook(event, theme);
  const text = [{ color: look.foreground }, event.canceled && styles.struck];
  const editable = !!onChange && event.editable !== false;

  return (
    <View
      style={[styles.slot, box, { height }]}
      testID={testID && `${testID}-slot-${event.id}`}
    >
      <EventSurface
        event={event}
        editable={editable}
        onPress={onPress}
        name={eventName(shown, words)}
        style={[
          styles.card,
          { backgroundColor: look.background, borderStartColor: look.bar },
        ]}
        testID={testID && `${testID}-event-${event.id}`}
      >
        <Text style={[styles.title, text]} numberOfLines={1}>
          {titleOf(event)}
        </Text>
        {height >= TWO_LINES && (
          <Text style={[styles.times, text]} numberOfLines={1}>
            {timesOf(shown)}
          </Text>
        )}
      </EventSurface>
      {editable && resizable && (
        <View
          onStartShouldSetResponder={() => true}
          // A scroll view does not take the foot back while it is dragged.
          onResponderTerminationRequest={() => false}
          onResponderGrant={(e) => {
            pressedAt.current = e.nativeEvent.pageY;
          }}
          onResponderMove={(e) => setLength(dragged(e))}
          onResponderRelease={(e) => {
            setLength(null);
            commit(dragged(e));
          }}
          onResponderTerminate={() => setLength(null)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`${resizeWord}, ${event.title}`}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) =>
            commit(
              resized(
                durationOf(event) +
                  (e.nativeEvent.actionName === "increment" ? 1 : -1) *
                    grid.step,
              ),
            )
          }
          style={[styles.handle, Platform.OS === "web" && webResize]}
          testID={testID && `${testID}-resize-${event.id}`}
        />
      )}
    </View>
  );
};

const webResize = { cursor: "ns-resize" } as unknown as ViewStyle;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    heading: {
      flex: 1,
      alignItems: "center",
      paddingVertical: theme.spacing.s,
    },
    gutter: { width: GUTTER },
    body: { flexDirection: "row" },
    hour: {
      ...theme.typography.labelSmall,
      position: "absolute",
      start: 0,
      end: theme.spacing.s,
      textAlign: "right",
      color: theme.colors.onSurfaceVariant,
    },
    lines: {
      position: "absolute",
      top: 0,
      bottom: 0,
      end: 0,
      start: GUTTER,
    },
    line: {
      position: "absolute",
      start: 0,
      end: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.outlineVariant,
    },
    halfLine: { backgroundColor: theme.colors.surfaceContainerHighest },
    column: {
      flex: 1,
      borderStartWidth: StyleSheet.hairlineWidth,
      borderStartColor: theme.colors.outlineVariant,
    },
    landing: {
      position: "absolute",
      start: 0,
      end: theme.spacing.xs,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: theme.colors.primary,
      borderRadius: theme.shape.small,
    },
    slot: { position: "absolute", paddingEnd: theme.spacing.xs },
    card: {
      flex: 1,
      overflow: "hidden",
      borderRadius: theme.shape.small,
      borderStartWidth: 4,
      paddingHorizontal: theme.spacing.xs,
    },
    title: theme.typography.labelMedium,
    times: theme.typography.bodySmall,
    struck: { textDecorationLine: "line-through" },
    handle: {
      position: "absolute",
      start: 0,
      end: theme.spacing.xs,
      bottom: 0,
      height: HANDLE,
    },
  });

export default DayTimelineGrid;

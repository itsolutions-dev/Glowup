import React from "react";
import {
  Box,
  Chip,
  DragDropProvider,
  Draggable,
  Droppable,
  PortalHost,
  Typography,
} from "@its/glowup-ui";
import type { DragEndEvent } from "@its/glowup-ui";

// A Droppable is a zone inside a DragDropProvider; its children are content or
// a function of `{ isOver, index }`. `Held` presses and moves a chip the way a
// mouse would (see DragDropProvider's preview), so the zone shows `isOver`.
const Held = ({
  from,
  at = 0,
  by,
  children,
}: {
  from: string;
  /** Where on the item the press lands, in px below its centre: the copy keeps that grab point. */
  at?: number;
  by: { x: number; y: number };
  children: React.ReactNode;
}) => {
  const host = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const item = host.current?.querySelector<HTMLElement>(
      `[data-testid="${from}"]`,
    );
    if (!item) return;
    const { left, top, width, height } = item.getBoundingClientRect();
    const mouse = (type: string, dx: number, dy: number) =>
      item.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 0,
          buttons: 1,
          clientX: left + width / 2 + dx,
          clientY: top + height / 2 + at + dy,
        }),
      );
    mouse("mousedown", 0, 0);
    mouse("mousemove", 6, 6);
    const timer = setTimeout(() => mouse("mousemove", by.x, by.y), 100);
    return () => clearTimeout(timer);
  }, [from, at, by.x, by.y]);
  return <div ref={host}>{children}</div>;
};

const TOOLS = {
  mail: { label: "Mail", icon: "email-outline" },
  files: { label: "Files", icon: "folder-outline" },
  chat: { label: "Chat", icon: "chat-outline" },
  calendar: { label: "Calendar", icon: "calendar-blank-outline" },
  notes: { label: "Notes", icon: "note-text-outline" },
} as const;

const LIMIT = 3;

type Lists = Record<string, string[]>;

const Toolbar = ({ start }: { start: Lists }) => {
  const [shelves, setShelves] = React.useState<Lists>(start);
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || !(over.id in shelves)) return;
    const next: Lists = {};
    for (const [id, items] of Object.entries(shelves)) {
      next[id] = items.filter((item) => item !== active.id);
    }
    next[over.id].splice(over.index, 0, active.id);
    setShelves(next);
  };
  const tool = (id: string) => (
    <Draggable key={id} id={id} testID={id}>
      <Chip {...TOOLS[id as keyof typeof TOOLS]} />
    </Draggable>
  );
  return (
    <DragDropProvider onDragEnd={onDragEnd}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: 480,
        }}
      >
        <Droppable
          id="pinned"
          orientation="horizontal"
          // A full toolbar still takes its own tools, to reorder them.
          accept={(item) =>
            shelves.pinned.length < LIMIT || shelves.pinned.includes(item.id)
          }
        >
          {({ isOver }: { isOver: boolean }) => (
            <Box
              variant="flex"
              background={isOver ? "primaryContainer" : "surfaceContainerLow"}
              radius="large"
              padding={16}
              gap={8}
              align="center"
              style={{ minHeight: 64 }}
            >
              {shelves.pinned.map(tool)}
              {shelves.pinned.length === 0 && (
                <Typography variant="bodySmall" color="onSurfaceVariant">
                  Drop a tool here.
                </Typography>
              )}
            </Box>
          )}
        </Droppable>
        <Typography variant="labelLarge" color="onSurfaceVariant">
          {`More tools · ${shelves.pinned.length} of ${LIMIT} pinned`}
        </Typography>
        <Droppable id="more" orientation="horizontal">
          <Box variant="flex" gap={8}>
            {shelves.more.map(tool)}
          </Box>
        </Droppable>
      </div>
    </DragDropProvider>
  );
};

// Two horizontal zones. `accept` caps the pinned row at three tools.
export const HorizontalZones = () => (
  <Toolbar
    start={{ pinned: ["mail", "files"], more: ["chat", "calendar", "notes"] }}
  />
);

// A render function shows the empty zone's own message.
export const EmptyZone = () => (
  <Toolbar
    start={{ pinned: [], more: ["mail", "files", "chat", "calendar", "notes"] }}
  />
);

// "Chat" held over the pinned row: `isOver` paints it primaryContainer and the
// line marks the insertion point after "Files".
export const ItemOver = () => (
  <PortalHost>
    <Held from="chat" by={{ x: 190, y: -110 }}>
      <Toolbar
        start={{
          pinned: ["mail", "files"],
          more: ["chat", "calendar", "notes"],
        }}
      />
    </Held>
  </PortalHost>
);

import React from "react";
import {
  Box,
  Card,
  CardTitle,
  DragDropProvider,
  Draggable,
  Droppable,
  PortalHost,
  Typography,
} from "@its/glowup-ui";
import type { DragEndEvent } from "@its/glowup-ui";

// A drag starts from a real press and move, which a still capture cannot make.
// `Held` makes one: it presses the item whose testID is `from` with the mouse,
// moves it by `by` and never lets go, so the component draws its own mid-drag
// state: the item left in place at 0.4 opacity, the copy following the pointer
// (drawn at the PortalHost), the insertion line in the zone under it.
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

type Lists = Record<string, string[]>;

/** Take the item out of every list, then insert it at the drop. */
const moveItem = (lists: Lists, { active, over }: DragEndEvent): Lists => {
  if (!over || !(over.id in lists)) return lists;
  const next: Lists = {};
  for (const [id, items] of Object.entries(lists)) {
    next[id] = items.filter((item) => item !== active.id);
  }
  next[over.id].splice(over.index, 0, active.id);
  return next;
};

const COLUMNS = [
  { id: "todo", title: "To do" },
  { id: "doing", title: "In progress" },
  { id: "done", title: "Done" },
];

const TASKS: Record<string, { title: string; owner: string }> = {
  t1: { title: "Draft release notes", owner: "Marta" },
  t2: { title: "Fix login redirect", owner: "Luca" },
  t3: { title: "Review pricing page", owner: "Sara" },
  t4: { title: "Onboarding emails", owner: "Marta" },
  t5: { title: "Ship dark theme", owner: "Luca" },
};

const Board = () => {
  const [board, setBoard] = React.useState<Lists>({
    todo: ["t1", "t2", "t3"],
    doing: ["t4"],
    done: ["t5"],
  });
  return (
    <DragDropProvider
      onDragEnd={(event) => setBoard((current) => moveItem(current, event))}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          width: 720,
          alignItems: "flex-start",
        }}
      >
        {COLUMNS.map((column) => (
          <Droppable
            key={column.id}
            id={column.id}
            style={{ flexGrow: 1, flexBasis: 0 }}
          >
            {({ isOver }: { isOver: boolean }) => (
              <Box
                background={
                  isOver ? "surfaceContainerHighest" : "surfaceContainerLow"
                }
                radius="large"
                padding={12}
                gap={8}
              >
                <Typography variant="titleSmall">
                  {`${column.title} · ${board[column.id].length}`}
                </Typography>
                {board[column.id].map((id) => (
                  <Draggable key={id} id={id} testID={id}>
                    <Card variant="outlined" onClick={() => {}}>
                      <CardTitle
                        title={TASKS[id].title}
                        subtitle={TASKS[id].owner}
                      />
                    </Card>
                  </Draggable>
                ))}
              </Box>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropProvider>
  );
};

// Three columns of pressable cards: drop a card in another column or in
// another place in its own; onDragEnd moves it in the app's state.
export const KanbanBoard = () => <Board />;

// "Onboarding emails" held over "To do", between the first two
// cards: the column lights up and the line marks where it will land.
export const WhileDragging = () => (
  <PortalHost>
    <Held from="t4" at={28} by={{ x: -244, y: -14 }}>
      <Board />
    </Held>
  </PortalHost>
);

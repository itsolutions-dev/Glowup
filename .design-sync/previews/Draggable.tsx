import React from "react";
import {
  DragDropProvider,
  Draggable,
  Droppable,
  Icon,
  ListItem,
  Paper,
  PortalHost,
  Typography,
} from "@its/glowup-ui";
import type { DragEndEvent } from "@its/glowup-ui";

// Draggable only works inside a DragDropProvider and a Droppable, so every
// story is the whole composition. `Held` presses and moves an item the way a
// mouse would (see DragDropProvider's preview): a still cannot start a drag.
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

const STEPS: Record<string, { title: string; detail: string }> = {
  tests: { title: "Run the test suite", detail: "Unit and end-to-end" },
  notes: { title: "Write the release notes", detail: "From the changelog" },
  tag: { title: "Tag the version", detail: "Semver, signed" },
  deploy: { title: "Deploy to production", detail: "Behind a flag" },
};

const Checklist = ({
  compactPreview = false,
}: {
  compactPreview?: boolean;
}) => {
  const [steps, setSteps] = React.useState(Object.keys(STEPS));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const next = steps.filter((id) => id !== active.id);
    next.splice(over.index, 0, active.id);
    setSteps(next);
  };
  return (
    <DragDropProvider onDragEnd={onDragEnd}>
      <div style={{ width: 420 }}>
        <Droppable id="steps">
          {steps.map((id, index) => (
            <Draggable
              key={id}
              id={id}
              testID={id}
              // The first step always runs first: it cannot be lifted.
              disabled={id === "tests"}
              accessibilityLabel={STEPS[id].title}
              preview={
                compactPreview ? (
                  <Paper
                    elevation={3}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingHorizontal: 16,
                    }}
                  >
                    <Icon source="swap-vertical" size={20} />
                    <Typography variant="titleSmall">{`Move “${STEPS[id].title}”`}</Typography>
                  </Paper>
                ) : undefined
              }
            >
              <ListItem
                icon={id === "tests" ? "lock-outline" : "drag"}
                primaryText={`${index + 1}. ${STEPS[id].title}`}
                secondaryText={STEPS[id].detail}
              />
            </Draggable>
          ))}
        </Droppable>
      </div>
    </DragDropProvider>
  );
};

// A list in order. The locked first row is `disabled`; the others lift with a
// resting touch or a mouse moved while pressed.
export const ReorderableRows = () => <Checklist />;

// "Deploy to production" held between rows 2 and 3, grabbed near its bottom
// edge so the copy sits above the line: the row stays in place,
// faded, while its copy follows the pointer.
export const WhileDragging = () => (
  <PortalHost>
    <Held from="deploy" at={23} by={{ x: 40, y: -153 }}>
      <Checklist />
    </Held>
  </PortalHost>
);

// `preview` draws something else under the pointer than the item itself, at
// the item's size: here a raised "Move …" bar instead of the row. "Tag the
// version" is held between rows 1 and 2.
export const CustomPreview = () => (
  <PortalHost>
    <Held from="tag" at={23} by={{ x: 40, y: -153 }}>
      <Checklist compactPreview />
    </Held>
  </PortalHost>
);

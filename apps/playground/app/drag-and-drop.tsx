import { useState } from "react";
import { View } from "react-native";
import {
  Box,
  Button,
  Card,
  CardTitle,
  Chip,
  DragDropProvider,
  Draggable,
  Droppable,
  Form,
  FormField,
  GridLayout,
  HelperText,
  Input,
  ListItem,
  Paper,
  ScrollArea,
  Typography,
  VStack,
  useDragScroll,
  useDragState,
  useTheme,
  type DragEndEvent,
  type DragItem,
  type DropTarget,
  type FormValues,
} from "@its/glowup-ui";

import { CodeBlock } from "../site/CodeBlock";
import { Page, Section } from "../site/Page";
import { PropsTable } from "../site/PropsTable";
import { docFor } from "../site/propsData";

const USAGE = `import { DragDropProvider, Draggable, Droppable } from "@its/glowup-ui";

<DragDropProvider
  onDragEnd={({ active, over }) => {
    if (!over) return; // dropped outside every zone
    setColumns((columns) => {
      // over.index leaves the dragged item out: remove it, then insert it there
      const next = Object.fromEntries(
        Object.entries(columns).map(([key, ids]) => [
          key,
          ids.filter((id) => id !== active.id),
        ]),
      );
      next[over.id].splice(over.index, 0, active.id);
      return next;
    });
  }}
>
  {Object.entries(columns).map(([column, ids]) => (
    <Droppable key={column} id={column}>
      {ids.map((id) => (
        <Draggable key={id} id={id}>
          <Card onClick={() => open(id)}>…</Card>
        </Draggable>
      ))}
    </Droppable>
  ))}
</DragDropProvider>`;

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
  t1: { title: "Draft the release notes", owner: "Marta" },
  t2: { title: "Fix the login redirect", owner: "Luca" },
  t3: { title: "Review the pricing page", owner: "Sara" },
  t4: { title: "Update the onboarding emails", owner: "Marta" },
  t5: { title: "Ship the dark theme", owner: "Luca" },
};

/** Cards that are pressable, between three columns. */
const Board = () => {
  const [board, setBoard] = useState<Lists>({
    todo: ["t1", "t2", "t3"],
    doing: ["t4"],
    done: ["t5"],
  });
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <DragDropProvider
      onDragEnd={(event) => setBoard((current) => moveItem(current, event))}
    >
      <VStack spacing="m">
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {opened
            ? `Opened “${TASKS[opened].title}”.`
            : "Drag a card to another column or to another place in its own. Tap one to open it."}
        </Typography>
        <Box variant="flex" wrap gap={16} align="flex-start">
          {COLUMNS.map((column) => (
            <Droppable
              key={column.id}
              id={column.id}
              style={{ flexGrow: 1, flexBasis: 200 }}
            >
              {({ isOver }) => (
                <Box
                  background={
                    isOver ? "surfaceContainerHighest" : "surfaceContainerLow"
                  }
                  radius="large"
                  padding={16}
                  gap={8}
                >
                  <Typography variant="titleSmall">
                    {`${column.title} · ${board[column.id].length}`}
                  </Typography>
                  {board[column.id].map((id) => (
                    <Draggable key={id} id={id}>
                      <Card variant="outlined" onClick={() => setOpened(id)}>
                        <CardTitle
                          title={TASKS[id].title}
                          subtitle={TASKS[id].owner}
                        />
                      </Card>
                    </Draggable>
                  ))}
                  {board[column.id].length === 0 && (
                    <Typography variant="bodySmall" color="onSurfaceVariant">
                      Drop a card here.
                    </Typography>
                  )}
                </Box>
              )}
            </Droppable>
          ))}
        </Box>
      </VStack>
    </DragDropProvider>
  );
};

const STEPS: Record<string, { title: string; detail: string }> = {
  tests: { title: "Run the test suite", detail: "Unit and end-to-end" },
  notes: { title: "Write the release notes", detail: "From the changelog" },
  tag: { title: "Tag the version", detail: "Semver, signed" },
  deploy: { title: "Deploy to production", detail: "Behind a flag" },
  announce: { title: "Announce it", detail: "Blog and newsletter" },
};

/** One list in order, its first row locked in place. */
const Checklist = () => {
  const [steps, setSteps] = useState<Lists>({ steps: Object.keys(STEPS) });

  return (
    <DragDropProvider
      onDragEnd={(event) => setSteps((current) => moveItem(current, event))}
    >
      <View style={{ maxWidth: 480 }}>
        <Droppable id="steps">
          {steps.steps.map((id, index) => (
            <Draggable key={id} id={id} disabled={id === "tests"}>
              <ListItem
                icon={id === "tests" ? "lock-outline" : "drag"}
                primaryText={`${index + 1}. ${STEPS[id].title}`}
                secondaryText={STEPS[id].detail}
              />
            </Draggable>
          ))}
        </Droppable>
      </View>
    </DragDropProvider>
  );
};

const TOOLS = {
  mail: { label: "Mail", icon: "email-outline" },
  files: { label: "Files", icon: "folder-outline" },
  chat: { label: "Chat", icon: "chat-outline" },
  calendar: { label: "Calendar", icon: "calendar-blank-outline" },
  notes: { label: "Notes", icon: "note-text-outline" },
  tasks: { label: "Tasks", icon: "checkbox-marked-outline" },
} as const;

const LIMIT = 3;

/** A row that takes at most three tools, and the shelf they come from. */
const Toolbar = () => {
  const [shelves, setShelves] = useState<Lists>({
    pinned: ["mail", "files"],
    more: ["chat", "calendar", "notes", "tasks"],
  });

  const tool = (id: string) => {
    const { label, icon } = TOOLS[id as keyof typeof TOOLS];
    return (
      <Draggable key={id} id={id}>
        <Chip label={label} icon={icon} />
      </Draggable>
    );
  };

  return (
    <DragDropProvider
      onDragEnd={(event) => setShelves((current) => moveItem(current, event))}
    >
      <VStack spacing="m">
        <Droppable
          id="pinned"
          orientation="horizontal"
          // A full toolbar still takes its own tools, to reorder them.
          accept={(item) =>
            shelves.pinned.length < LIMIT || shelves.pinned.includes(item.id)
          }
        >
          {({ isOver }) => (
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
      </VStack>
    </DragDropProvider>
  );
};

// Two kinds of item, each zone taking one: the page takes sections, a section
// takes fields. Without it a field dropped between sections becomes a section.
type Kind = "section" | "field";
const takes = (kind: Kind) => (item: DragItem) =>
  (item.data as { kind?: Kind } | undefined)?.kind === kind;

/** Sections that are draggable and hold their own zone of fields. */
const NestedSections = () => {
  const [form, setForm] = useState<Lists>({
    page: ["Contact", "Shipping"],
    Contact: ["Name", "Email"],
    Shipping: ["Address", "City"],
  });

  return (
    <DragDropProvider
      onDragEnd={(event) => setForm((current) => moveItem(current, event))}
    >
      <View style={{ maxWidth: 480 }}>
        <Droppable id="page" accept={takes("section")}>
          <VStack spacing="s">
            {form.page.map((section) => (
              <Draggable key={section} id={section} data={{ kind: "section" }}>
                <Box
                  background="surfaceContainerLow"
                  radius="large"
                  padding={16}
                  gap={8}
                >
                  <Typography variant="titleSmall">{section}</Typography>
                  <Droppable id={section} accept={takes("field")}>
                    <VStack spacing="s" align="flex-start">
                      {form[section].map((field) => (
                        <Draggable
                          key={field}
                          id={field}
                          data={{ kind: "field" }}
                        >
                          <Chip label={field} icon="form-textbox" />
                        </Draggable>
                      ))}
                    </VStack>
                  </Droppable>
                </Box>
              </Draggable>
            ))}
          </VStack>
        </Droppable>
      </View>
    </DragDropProvider>
  );
};

const GRID_COLUMNS = 12;
const ROW = 48;
const GAP = 16;
/** The board's height in rows: its cells are drawn down to here while a note moves. */
const BOARD_ROWS = 5;

interface Note {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const NOTES: Note[] = [
  { id: "supplier", title: "Call the supplier", x: 0, y: 0, w: 4, h: 2 },
  { id: "venue", title: "Book the venue", x: 5, y: 0, w: 3, h: 2 },
  { id: "badges", title: "Print the badges", x: 9, y: 1, w: 3, h: 2 },
  { id: "invites", title: "Send the invites", x: 2, y: 3, w: 4, h: 2 },
];

const overlaps = (a: Note, b: Note) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** The cell under the top-left corner of the note's preview, inside the board. */
const snap = ({ rect, zone }: DropTarget, note: Note): Note => ({
  ...note,
  x: Math.min(
    Math.max(0, Math.round(rect.x / ((zone.width + GAP) / GRID_COLUMNS))),
    GRID_COLUMNS - note.w,
  ),
  y: Math.min(
    Math.max(0, Math.round(rect.y / (ROW + GAP))),
    BOARD_ROWS - note.h,
  ),
});

const CELLS = Array.from({ length: GRID_COLUMNS * BOARD_ROWS }, (_, i) => ({
  id: `cell-${i}`,
  x: i % GRID_COLUMNS,
  y: Math.floor(i / GRID_COLUMNS),
  w: 1,
  h: 1,
}));

/** Inside the provider: the landing place follows the drag through useDragState. */
const PinboardGrid = ({ notes }: { notes: Note[] }) => {
  const { theme } = useTheme();
  const activeId = useDragState((s) => s.active?.id ?? null);
  // A string, so the board redraws when the cell changes, not on every move.
  const cell = useDragState((s) => {
    const note = notes.find((n) => n.id === s.active?.id);
    if (s.over?.id !== "board" || !note) return null;
    const { x, y } = snap(s.over, note);
    return `${x},${y}`;
  });
  const note = notes.find((n) => n.id === activeId);
  const [x, y] = cell?.split(",").map(Number) ?? [];
  const landing = note && cell ? { ...note, id: "landing", x, y } : null;
  const free =
    !!landing && notes.every((n) => n.id === note?.id || !overlaps(n, landing));
  // While it is over a free place, the dragged note itself is drawn there
  // (dimmed, on the placeholder), not left behind where it was picked up.
  const placed =
    landing && free
      ? notes.map((n) =>
          n.id === note?.id ? { ...n, x: landing.x, y: landing.y } : n,
        )
      : notes;

  return (
    <Droppable
      id="board"
      indicator={false}
      style={{ height: BOARD_ROWS * (ROW + GAP) - GAP }}
    >
      <GridLayout
        stackBelow="compact"
        layout={[...(landing ? [...CELLS, landing] : []), ...placed]}
      >
        {landing &&
          CELLS.map((c) => (
            <View
              key={c.id}
              style={{
                flexGrow: 1,
                borderRadius: theme.shape.small,
                backgroundColor: theme.colors.surfaceContainerHigh,
              }}
            />
          ))}
        {landing && (
          <View
            key="landing"
            style={{
              flexGrow: 1,
              borderRadius: theme.shape.medium,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: free ? theme.colors.primary : theme.colors.error,
              backgroundColor: free
                ? theme.colors.primaryContainer
                : theme.colors.errorContainer,
            }}
          />
        )}
        {notes.map((n) => (
          <Draggable key={n.id} id={n.id} style={{ flexGrow: 1 }}>
            <Paper style={{ flexGrow: 1 }}>
              <Typography variant="titleSmall">{n.title}</Typography>
            </Paper>
          </Draggable>
        ))}
      </GridLayout>
    </Droppable>
  );
};

/** Notes placed by position: the drop's rect, snapped to a cell. */
const Pinboard = () => {
  const [notes, setNotes] = useState(NOTES);

  return (
    <DragDropProvider
      onDragEnd={({ active, over }) => {
        if (over?.id !== "board") return;
        setNotes((current) => {
          const note = current.find((n) => n.id === active.id);
          if (!note) return current;
          const landing = snap(over, note);
          // A place another note takes refuses the drop.
          if (current.some((n) => n.id !== note.id && overlaps(n, landing))) {
            return current;
          }
          return current.map((n) => (n.id === note.id ? landing : n));
        });
      }}
    >
      <PinboardGrid notes={notes} />
    </DragDropProvider>
  );
};

const ROW_LABELS = Array.from({ length: 30 }, (_, i) => `Row ${i + 1}`);

/** Inside the provider: useDragScroll needs it. */
const ScrollingRows = ({ rows }: { rows: string[] }) => {
  const scroll = useDragScroll();

  return (
    <ScrollArea {...scroll} height={320} style={{ maxWidth: 480 }}>
      <Droppable id="rows">
        {rows.map((row) => (
          <Draggable key={row} id={row}>
            <ListItem icon="drag" primaryText={row} />
          </Draggable>
        ))}
      </Droppable>
    </ScrollArea>
  );
};

/** A list longer than its box, reordered while it scrolls by itself. */
const LongList = () => {
  const [rows, setRows] = useState<Lists>({ rows: ROW_LABELS });

  return (
    <DragDropProvider
      onDragEnd={(event) => setRows((current) => moveItem(current, event))}
    >
      <ScrollingRows rows={rows.rows} />
    </DragDropProvider>
  );
};

const PRIORITIES: Record<string, string> = {
  price: "Price",
  speed: "Delivery speed",
  quality: "Build quality",
  support: "Support",
};

/**
 * A form control whose value is an order: the ids, first to last. Dropping a
 * row reports the new order through `onChange`, as any field does.
 */
const RankedList = ({
  value,
  onChange,
  label,
  error,
}: {
  value: string[];
  onChange: (order: string[]) => void;
  label?: string;
  error?: string;
}) => (
  <DragDropProvider
    onDragEnd={({ active, over }) => {
      if (!over) return;
      const order = value.filter((id) => id !== active.id);
      order.splice(over.index, 0, active.id);
      onChange(order);
    }}
  >
    <VStack spacing="xs">
      {label ? <Typography variant="labelLarge">{label}</Typography> : null}
      <Droppable id="ranking">
        {value.map((id, index) => (
          <Draggable key={id} id={id}>
            <ListItem
              icon="drag"
              primaryText={`${index + 1}. ${PRIORITIES[id]}`}
            />
          </Draggable>
        ))}
      </Droppable>
      {error ? <HelperText type="error">{error}</HelperText> : null}
    </VStack>
  </DragDropProvider>
);

/** A name and a ranking, sent together. */
const RankingForm = () => {
  const [sent, setSent] = useState<FormValues | null>(null);

  return (
    <Form
      initialValues={{ name: "", priorities: Object.keys(PRIORITIES) }}
      onSubmit={setSent}
    >
      <VStack spacing="m" style={{ maxWidth: 480 }}>
        <FormField name="name" label="Your name" rules={[{ required: true }]}>
          {(field) => <Input {...field} />}
        </FormField>
        <FormField name="priorities" label="What matters most? Drag to rank">
          {(field) => <RankedList {...field} />}
        </FormField>
        <View style={{ alignSelf: "flex-start" }}>
          <Button type="submit" iconName="send-outline">
            Send ranking
          </Button>
        </View>
        {sent ? (
          <Typography variant="bodyMedium">
            {`Sent: ${sent.name} ranked ${(sent.priorities as string[])
              .map((id) => PRIORITIES[id])
              .join(", ")}.`}
          </Typography>
        ) : null}
      </VStack>
    </Form>
  );
};

const REFERENCE = ["DragDropProvider", "Draggable", "Droppable"];

export default function DragAndDropPage() {
  return (
    <Page
      eyebrow="Library"
      title="Drag and drop"
      description="Drag and drop in @its/glowup-ui, on iOS, Android and the web, by touch and by mouse, with no dependency. A touch lifts an item after resting on it for a moment, so a swipe still scrolls; a mouse lifts it as soon as it moves, so a click still clicks."
    >
      <Section
        title="Between lists"
        description="The cards keep their tap: a press that rests or moves lifts the card instead. The card stays in place, dimmed, while a copy follows the pointer and a line marks where it would land."
      >
        <Board />
      </Section>
      <Section
        title="Reorder a list"
        description="The same drop handler reorders: the index it reports leaves the dragged row out. The first row is disabled, so it cannot be lifted, but rows can still land around it."
      >
        <Checklist />
      </Section>
      <Section
        title="Rules for a zone"
        description="accept decides what a zone takes: this toolbar takes a fourth tool only once one leaves. orientation lays the zone's items along a row."
      >
        <Toolbar />
      </Section>
      <Section
        title="Nested zones"
        description="Sections are draggable and hold their own zone: a field moves between sections, a section moves in the page, and a section never drops into itself. Each item carries its kind in data and each zone accepts one kind, so a field cannot land between sections."
      >
        <NestedSections />
      </Section>
      <Section
        title="Drop anywhere on a grid"
        description="over.rect says where the dragged note's preview is inside the board; its corner snapped to the nearest cell is where the note lands. The cells show only while a note moves, and a place another note takes refuses the drop. The board is a GridLayout, and the zone has its insertion line turned off (indicator={false})."
      >
        <Pinboard />
      </Section>
      <Section
        title="Scroll while dragging"
        description="A list in a ScrollArea spread with useDragScroll(): it does not scroll under a held row, it scrolls by itself when the row nears its top or bottom edge, and the drop lands where the row is released."
      >
        <LongList />
      </Section>
      <Section
        title="Inside a form"
        description="A FormField whose control is a reorderable list: the order is the field's value, so dropping a row reports it through onChange like any input, and the form sends it with the rest. Rank the rows, enter a name, then send."
      >
        <RankingForm />
      </Section>
      <Section
        title="Use it"
        description="The provider only reports the drop: keep the lists in your state and move the item in onDragEnd. Mount a Portal.Host at the root, where the copy that follows the pointer is drawn. Spread useDragScroll() on the ScrollView or ScrollArea that holds the zones, so it does not scroll under a held item and scrolls by itself near its edges."
      >
        <CodeBlock code={USAGE} title="Board.tsx" />
      </Section>
      <Section
        title="API reference"
        description="Generated from the library's TypeScript, so it cannot drift from the implementation."
      >
        {REFERENCE.map((name) => {
          const doc = docFor(name);
          return doc ? (
            <VStack key={name} spacing="s">
              <Typography variant="titleMedium">{name}</Typography>
              <PropsTable doc={doc} />
            </VStack>
          ) : null;
        })}
      </Section>
    </Page>
  );
}

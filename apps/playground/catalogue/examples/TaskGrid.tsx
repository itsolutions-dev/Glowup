import { useEffect, useState } from "react";
import {
  Box,
  Button,
  ChipGroup,
  DataGrid,
  EmptyState,
  HStack,
  StatusBadge,
  ToggleButtonGroup,
  VStack,
  type ColumnDefinition,
  type Density,
} from "@its/glowup-ui";

const STATUS_TYPE = {
  Done: "success",
  "In review": "warning",
  Blocked: "error",
} as const;

// "Archived" has no tasks yet, so choosing it shows the empty state.
const FILTERS = [...Object.keys(STATUS_TYPE), "Archived"].map((name) => ({
  value: name,
  label: name,
}));

const TASKS = (
  [
    ["T-112", "Fix rounding at checkout", "Mara Quinn", "In review"],
    ["T-111", "Translate the welcome email", "Theo Alvarez", "Done"],
    ["T-110", "Upgrade the payment SDK", "Priya Nair", "Blocked"],
    ["T-109", "Add a dark mode toggle", "Jonas Weber", "Done"],
    ["T-108", "Audit the sign-in form", "Lena Fischer", "In review"],
    ["T-107", "Cache the product list", "Omar Haddad", "Done"],
    ["T-106", "Redesign the empty inbox", "Sofia Rossi", "Done"],
    ["T-105", "Replace the map provider", "Kenji Mori", "Blocked"],
  ] as const
).map(([id, title, owner, status]) => ({ id, title, owner, status }));

const COLUMNS: ColumnDefinition[] = [
  { id: "id", label: "Task", width: 80 },
  { id: "title", label: "Title", width: 240 },
  { id: "owner", label: "Owner", width: 140 },
  {
    id: "status",
    label: "Status",
    width: 130,
    renderCell: (status: keyof typeof STATUS_TYPE) => (
      <StatusBadge label={status} type={STATUS_TYPE[status]} />
    ),
  },
];

export default function TaskGrid() {
  const [status, setStatus] = useState<string | null>(null);
  const [density, setDensity] = useState<Density>("normal");
  const [loading, setLoading] = useState(false);

  // A pretend request: the grid shows its spinner until it "answers".
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [loading]);

  const rows = TASKS.filter((task) => !status || task.status === status);

  return (
    <VStack spacing="s">
      <ChipGroup
        accessibilityLabel="Status"
        options={FILTERS}
        value={status}
        onChange={setStatus}
      />
      <HStack justify="space-between" align="center" wrap spacing="s">
        <ToggleButtonGroup
          accessibilityLabel="Row height"
          options={[
            { value: "normal", label: "Comfortable" },
            { value: "dense", label: "Compact" },
          ]}
          value={density}
          onValueChange={setDensity}
        />
        <Button
          variant="text"
          iconName="refresh"
          disabled={loading}
          onClick={() => setLoading(true)}
        >
          Reload
        </Button>
      </HStack>
      {/* The columns add up to 590: a wider grid would leave an empty strip. */}
      <Box height={320} style={{ maxWidth: 592 }}>
        <DataGrid
          data={loading ? [] : rows}
          columns={COLUMNS}
          density={density}
          loading={loading}
          emptyState={
            rows.length === 0 ? (
              <EmptyState
                icon="check-all"
                title={`No ${status?.toLowerCase()} tasks`}
                description="Nothing to show for this filter yet."
              />
            ) : undefined
          }
        />
      </Box>
    </VStack>
  );
}

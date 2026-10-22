import { useEffect, useState } from "react";
import {
  Box,
  DataGrid,
  Typography,
  VStack,
  type ColumnDefinition,
} from "@its/glowup-ui";

const USERS = ["Mara Quinn", "Theo Alvarez", "Priya Nair", "Jonas Weber"];
const EVENTS = [
  "Signed in",
  "Exported a report",
  "Invited a teammate",
  "Changed the billing plan",
  "Created an API key",
];

const COLUMNS: ColumnDefinition[] = [
  { id: "time", label: "Time", width: 90 },
  { id: "user", label: "User", width: 160 },
  { id: "event", label: "Event", width: 240 },
];

const PAGE = 15;
const TOTAL = 60;

// Newest first, seven minutes apart, from 17:40.
const entry = (index: number) => {
  const minutes = 17 * 60 + 40 - index * 7;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    id: index,
    time: `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`,
    user: USERS[index % USERS.length],
    event: EVENTS[(index * 3) % EVENTS.length],
  };
};

export default function ActivityLog() {
  const [count, setCount] = useState(PAGE);
  const [loading, setLoading] = useState(false);

  // A pretend request for the next page.
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setCount((now) => now + PAGE);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <VStack spacing="s">
      <Typography variant="bodyMedium" color="onSurfaceVariant">
        {`Showing ${count} of ${TOTAL} events. Scroll to the end for more.`}
      </Typography>
      {/* The columns add up to 490: a wider grid would leave an empty strip. */}
      <Box height={320} style={{ maxWidth: 492 }}>
        <DataGrid
          data={Array.from({ length: count }, (_, index) => entry(index))}
          columns={COLUMNS}
          loading={loading}
          onEndReached={() => {
            if (!loading && count < TOTAL) setLoading(true);
          }}
        />
      </Box>
    </VStack>
  );
}

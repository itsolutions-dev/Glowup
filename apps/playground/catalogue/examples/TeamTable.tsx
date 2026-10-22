import { useState } from "react";
import { Table, Typography, VStack } from "@its/glowup-ui";

const COLUMNS = [
  { id: "name", label: "Name" },
  { id: "role", label: "Role" },
  { id: "city", label: "City", fallback: "Remote" },
  { id: "orders", label: "Orders", alignment: "right" as const },
];

const PEOPLE = [
  { name: "Ada Lovelace", role: "Analyst", city: "London", orders: 12 },
  { name: "Grace Hopper", role: "Engineer", city: "New York", orders: 48 },
  { name: "Alan Turing", role: "Researcher", city: "", orders: 0 },
  { name: "Hedy Lamarr", role: "Inventor", city: "Vienna", orders: 7 },
];

export default function TeamTable() {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <VStack spacing="s">
      <Table
        tableTitle="Team"
        columns={COLUMNS}
        data={PEOPLE}
        hover
        selected={picked ?? undefined}
        onClick={(_row, index) => setPicked(index)}
      />
      <Typography variant="bodySmall">
        {picked === null ? "Pick a row." : `Picked ${PEOPLE[picked].name}.`}
      </Typography>
    </VStack>
  );
}

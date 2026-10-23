import { useState } from "react";
import {
  Autocomplete,
  Typography,
  VStack,
  type AutocompleteOption,
  type AutocompleteProps,
} from "@its/glowup-ui";

const props: Partial<AutocompleteProps> = {
  label: "Assignee",
  placeholder: "Search by name or role",
  helperText: "Type a name or a role.",
  emptyMessage: "No one on the team matches.",
};

const TEAM: AutocompleteOption[] = [
  { id: "mq", label: "Mara Quinn", value: "mq", description: "Design lead" },
  { id: "ta", label: "Theo Alvarez", value: "ta", description: "Engineer" },
  {
    id: "pn",
    label: "Priya Nair",
    value: "pn",
    description: "Product manager",
  },
  { id: "jw", label: "Jonas Weber", value: "jw", description: "Engineer" },
  { id: "lf", label: "Lena Fischer", value: "lf", description: "Support" },
  { id: "oh", label: "Omar Haddad", value: "oh", description: "Design" },
];

export default function AutocompleteExample() {
  const [query, setQuery] = useState("");
  const [assigned, setAssigned] = useState<AutocompleteOption[]>([]);

  // One option when picking one, the whole set when picking several.
  const choose = (chosen: AutocompleteOption | AutocompleteOption[] | null) =>
    setAssigned(Array.isArray(chosen) ? chosen : chosen ? [chosen] : []);

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Review Q3 invoices</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {assigned.length
            ? `Assigned to ${assigned.map((person) => person.label).join(", ")}.`
            : "Nobody is assigned yet."}
        </Typography>
      </VStack>
      <Autocomplete
        // The props type is a union on `multiple`, which the panel can switch.
        {...(props as AutocompleteProps)}
        value={query}
        onChange={setQuery}
        options={TEAM}
        // Before anything is typed the field offers the people asked most often.
        defaultOptions={TEAM.slice(0, 3)}
        // The role is searched too, not only the name.
        filter={(person, text) =>
          `${person.label} ${person.description}`
            .toLowerCase()
            .includes(text.toLowerCase())
        }
        onSelectedChange={choose}
      />
    </VStack>
  );
}

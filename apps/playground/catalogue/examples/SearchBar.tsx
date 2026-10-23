import { useState } from "react";
import {
  ListItem,
  SearchBar,
  Typography,
  VStack,
  type SearchBarProps,
} from "@its/glowup-ui";

const props: Partial<SearchBarProps> = {
  placeholder: "Search files",
};

const FILES = [
  { id: "f1", name: "Q3 budget.xlsx", owner: "Mara Quinn", icon: "file-excel" },
  {
    id: "f2",
    name: "Brand guidelines.pdf",
    owner: "Theo Alvarez",
    icon: "file-pdf-box",
  },
  {
    id: "f3",
    name: "Launch plan.docx",
    owner: "Priya Nair",
    icon: "file-word",
  },
  {
    id: "f4",
    name: "Customer interviews, round two (raw notes).txt",
    owner: "Jonas Weber",
    icon: "file-document-outline",
  },
  {
    id: "f5",
    name: "Onboarding checklist.docx",
    owner: "Mara Quinn",
    icon: "file-word",
  },
] as const;

export default function SearchBarExample() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const results = FILES.filter((file) =>
    `${file.name} ${file.owner}`.toLowerCase().includes(needle),
  );

  return (
    <VStack spacing="s">
      <SearchBar {...props} value={query} onChange={setQuery} />
      <Typography variant="labelLarge" color="onSurfaceVariant">
        {needle
          ? `${results.length} of ${FILES.length} files`
          : `${FILES.length} files`}
      </Typography>
      {results.map((file) => (
        <ListItem
          key={file.id}
          icon={file.icon}
          primaryText={file.name}
          secondaryText={`Owned by ${file.owner}`}
        />
      ))}
      {results.length === 0 && (
        <Typography variant="bodyMedium" color="onSurfaceVariant">
          {`No file matches "${query}".`}
        </Typography>
      )}
    </VStack>
  );
}

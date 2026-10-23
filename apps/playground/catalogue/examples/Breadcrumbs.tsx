import { useState } from "react";
import {
  Box,
  Breadcrumbs,
  Divider,
  ListItem,
  useTheme,
  type BreadcrumbItem,
  type BreadcrumbsProps,
} from "@its/glowup-ui";

const props: Partial<BreadcrumbsProps> = {
  maxItems: 3,
  separator: "chevron-right",
};

// A name with an entry is a folder; the others are files.
const FOLDERS: Record<string, string[]> = {
  Home: ["Projects", "Photos", "Receipts.pdf"],
  Projects: ["Glowup", "Website", "Roadmap.docx"],
  Glowup: ["Design", "Source", "Notes.md"],
  Design: ["Icons", "Tokens.json"],
  Icons: ["bolt.svg", "ring.svg"],
  Source: ["index.ts"],
  Website: ["index.html"],
  Photos: ["Rome.jpg", "Lisbon.jpg"],
};

export default function BreadcrumbsExample() {
  const { theme } = useTheme();
  const [path, setPath] = useState(["Home", "Projects", "Glowup", "Design"]);

  const items: BreadcrumbItem[] = path.map((name, index) => ({
    id: name,
    label: name,
    icon: index === 0 ? "home-outline" : undefined,
    onPress: () => setPath(path.slice(0, index + 1)),
  }));

  return (
    <Box
      background="surface"
      radius="large"
      borderWidth={1}
      borderColor="outlineVariant"
      width="100%"
      style={{ maxWidth: 480, alignSelf: "center", overflow: "hidden" }}
    >
      <Box padding={theme.spacing.m}>
        <Breadcrumbs {...props} items={items} />
      </Box>
      <Divider contentSpacing={0} />
      {FOLDERS[path[path.length - 1]].map((name) => (
        <ListItem
          key={name}
          icon={FOLDERS[name] ? "folder-outline" : "file-outline"}
          primaryText={name}
          onClick={FOLDERS[name] ? () => setPath([...path, name]) : undefined}
        />
      ))}
    </Box>
  );
}

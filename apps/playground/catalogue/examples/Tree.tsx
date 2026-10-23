import { useState } from "react";
import {
  Button,
  HStack,
  Tree,
  Typography,
  VStack,
  type TreeNode,
  type TreeProps,
} from "@its/glowup-ui";

const props: Partial<TreeProps> = {
  selectionMode: "multiple",
  checkboxes: true,
};

const FILES: TreeNode[] = [
  {
    id: "documents",
    label: "Documents",
    icon: "folder-outline",
    children: [
      {
        id: "budget.xlsx",
        label: "Budget 2026.xlsx",
        icon: "file-excel-outline",
        badge: "48 KB",
      },
      {
        id: "contract.pdf",
        label: "Contract.pdf",
        icon: "file-pdf-box",
        badge: "1.2 MB",
      },
      {
        id: "notes.txt",
        label: "Meeting notes.txt",
        icon: "file-document-outline",
        badge: "3 KB",
      },
      // Locked: it cannot be checked, and its folder skips it.
      {
        id: "payroll.pdf",
        label: "Payroll.pdf",
        icon: "lock-outline",
        disabled: true,
      },
    ],
  },
  { id: "photos", label: "Photos", icon: "folder-outline", hasChildren: true },
  {
    id: "archive",
    label: "Archive",
    icon: "folder-outline",
    hasChildren: true,
  },
  {
    id: "readme.md",
    label: "README.md",
    icon: "language-markdown-outline",
    badge: "2 KB",
  },
];

// What the folders without `children` hold, found when they are opened.
const FOLDERS: Record<string, TreeNode[]> = {
  photos: [
    {
      id: "offsite.jpg",
      label: "Team offsite.jpg",
      icon: "image-outline",
      badge: "3.1 MB",
    },
    {
      id: "logo.png",
      label: "Logo.png",
      icon: "image-outline",
      badge: "84 KB",
    },
    {
      id: "screenshots",
      label: "Screenshots",
      icon: "folder-outline",
      hasChildren: true,
    },
  ],
  screenshots: [
    {
      id: "home.png",
      label: "Home.png",
      icon: "image-outline",
      badge: "210 KB",
    },
    {
      id: "settings.png",
      label: "Settings.png",
      icon: "image-outline",
      badge: "180 KB",
    },
  ],
  archive: [
    {
      id: "2024.zip",
      label: "2024.zip",
      icon: "folder-zip-outline",
      badge: "212 MB",
    },
    {
      id: "2023.zip",
      label: "2023.zip",
      icon: "folder-zip-outline",
      badge: "187 MB",
    },
  ],
};

// A short wait stands in for the request.
const load = (node: TreeNode) =>
  new Promise<TreeNode[]>((resolve) =>
    setTimeout(() => resolve(FOLDERS[node.id] ?? []), 700),
  );

export default function TreeExample() {
  const [selected, setSelected] = useState<string[]>(["notes.txt"]);
  // A folder is in the list too once all it holds is checked; files are the
  // ids with an extension.
  const files = selected.filter((id) => id.includes("."));

  return (
    <VStack spacing="s">
      <HStack justify="space-between" align="center">
        <Typography variant="titleMedium">Project files</Typography>
        <Button
          variant="text"
          disabled={files.length === 0}
          onClick={() => setSelected([])}
        >
          Clear
        </Button>
      </HStack>
      <Tree
        {...props}
        data={FILES}
        defaultExpanded={["documents"]}
        loadChildren={load}
        selected={selected}
        onSelectedChange={setSelected}
      />
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {files.length === 0
          ? "Nothing selected."
          : `${files.length} ${files.length === 1 ? "file" : "files"} selected.`}
      </Typography>
    </VStack>
  );
}

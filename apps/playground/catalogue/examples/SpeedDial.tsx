import { useState } from "react";
import {
  Box,
  ListItem,
  SpeedDial,
  type SpeedDialAction,
  type SpeedDialProps,
} from "@its/glowup-ui";

const props: Partial<SpeedDialProps> = {
  mainIcon: "plus",
};

export default function SpeedDialExample() {
  const [files, setFiles] = useState(["Budget 2027.xlsx", "Site plan.pdf"]);
  const add = (name: string) =>
    setFiles((all) => [`${name} ${all.length - 1}`, ...all]);

  const actions: SpeedDialAction[] = [
    {
      id: "doc",
      label: "New document",
      icon: "file-document-outline",
      onPress: () => add("Untitled document"),
    },
    {
      id: "upload",
      label: "Upload",
      icon: "upload-outline",
      onPress: () => add("Upload"),
    },
    {
      id: "folder",
      label: "New folder",
      icon: "folder-plus-outline",
      onPress: () => add("New folder"),
    },
  ];

  return (
    // A screen: the dial sits in the corner of the nearest parent.
    <Box
      background="surfaceContainerLow"
      radius="large"
      height={360}
      style={{ overflow: "hidden" }}
    >
      {files.map((file) => (
        <ListItem key={file} icon="file-outline" primaryText={file} />
      ))}
      <SpeedDial mainIcon="plus" {...props} actions={actions} />
    </Box>
  );
}

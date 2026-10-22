import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Icon,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";

const SAMPLE_FILES = [
  "Invoice-2041.pdf",
  "Site-plan.dwg",
  "Holiday-photos.zip",
  "Meeting-notes.txt",
  "Budget-2027.xlsx",
];

export default function FileDropzone() {
  const { theme } = useTheme();
  const [files, setFiles] = useState<string[]>([]);
  const next = SAMPLE_FILES.find((file) => !files.includes(file));

  return (
    <VStack spacing="m">
      {/* centered-column-flex: a column, centred on both axes. */}
      <Box
        variant="centered-column-flex"
        gap={8}
        padding={24}
        radius="large"
        borderWidth={1}
        borderColor="outline"
        background="surfaceContainer"
        style={{ borderStyle: "dashed" }}
      >
        <Icon
          source="cloud-upload-outline"
          size={40}
          color={theme.colors.primary}
        />
        <Typography variant="titleMedium">
          {files.length ? `${files.length} files ready` : "No files yet"}
        </Typography>
        <Typography
          variant="bodyMedium"
          color="onSurfaceVariant"
          align="center"
        >
          Drop files here, or pick them from your device.
        </Typography>
        <Button
          iconName="plus"
          disabled={!next}
          onClick={() => next && setFiles([...files, next])}
        >
          {next ? "Add a file" : "That's all the samples"}
        </Button>
      </Box>

      {/* flex: a row, and `wrap` lets the chips flow onto the next line. */}
      <Box variant="flex" wrap gap={8}>
        {files.map((file) => (
          <Chip
            key={file}
            label={file}
            icon="file-outline"
            variant="tonal"
            onClose={() => setFiles(files.filter((f) => f !== file))}
          />
        ))}
      </Box>
    </VStack>
  );
}

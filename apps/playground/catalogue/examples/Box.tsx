import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  HStack,
  Icon,
  Typography,
  VStack,
  useTheme,
  type BoxProps,
} from "@its/glowup-ui";

const props: Partial<BoxProps> = {
  variant: "centered-column-flex",
  padding: 24,
  background: "surfaceContainer",
  radius: "large",
  borderWidth: 1,
  borderColor: "outline",
  gap: 8,
};

const SAMPLE_FILES = [
  "Invoice-2041.pdf",
  "Site-plan.dwg",
  "Holiday-photos.zip",
  "Meeting-notes.txt",
  "Budget-2027.xlsx",
];

export default function BoxExample() {
  const { theme } = useTheme();
  const [files, setFiles] = useState<string[]>([]);
  const next = SAMPLE_FILES.find((file) => !files.includes(file));

  return (
    <VStack spacing="m">
      <Box {...props} style={{ borderStyle: "dashed" }}>
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

      <HStack wrap spacing="s">
        {files.map((file) => (
          <Chip
            key={file}
            label={file}
            icon="file-outline"
            variant="tonal"
            onClose={() => setFiles(files.filter((f) => f !== file))}
          />
        ))}
      </HStack>
    </VStack>
  );
}

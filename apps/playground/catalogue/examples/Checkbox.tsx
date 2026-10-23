import { useState } from "react";
import {
  Button,
  Checkbox,
  Divider,
  Typography,
  VStack,
  type CheckboxProps,
} from "@its/glowup-ui";

const props: Partial<CheckboxProps> = {
  label: "Select all",
};

const FILES = [
  "invoice-march.pdf",
  "contract-v2.docx",
  "site-photos.zip",
  "notes.txt",
];

export default function CheckboxExample() {
  const [picked, setPicked] = useState<string[]>(["contract-v2.docx"]);
  const all = picked.length === FILES.length;
  const toggle = (file: string, on: boolean) =>
    setPicked(on ? [...picked, file] : picked.filter((name) => name !== file));

  return (
    <VStack spacing="xs" align="flex-start">
      <Typography variant="titleMedium">Attachments</Typography>
      <Checkbox
        indeterminate={picked.length > 0 && !all}
        {...props}
        checked={all}
        onValueChange={(on) => setPicked(on ? FILES : [])}
      />
      <Divider />
      {FILES.map((file) => (
        <Checkbox
          key={file}
          label={file}
          checked={picked.includes(file)}
          onValueChange={(on) => toggle(file, on)}
        />
      ))}
      <Button variant="tonal" disabled={picked.length === 0}>
        {`Download ${picked.length} of ${FILES.length}`}
      </Button>
    </VStack>
  );
}

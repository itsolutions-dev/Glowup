import { useState } from "react";
import {
  Editable,
  Typography,
  VStack,
  type EditableProps,
  type EditableType,
} from "@its/glowup-ui";

const props: Partial<EditableProps> = {
  placeholder: "Untitled",
  selectAllOnFocus: true,
};

// What each kind of field edits on this project card.
const LABELS: Record<EditableType, string> = {
  text: "Project name",
  textarea: "Description",
  number: "Budget (EUR)",
  select: "Priority",
};

const PRIORITIES = [
  { id: "low", label: "Low", value: "low" },
  { id: "medium", label: "Medium", value: "medium" },
  { id: "high", label: "High", value: "high" },
];

export default function EditableExample() {
  const type = props.type ?? "text";
  const [values, setValues] = useState<Record<EditableType, string>>({
    text: "Atlas redesign",
    textarea: "Refresh the dashboard and the settings screens.",
    number: "12500.00",
    select: "medium",
  });
  const [saved, setSaved] = useState("");

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Project details</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {saved || "Click a value to edit it."}
        </Typography>
      </VStack>
      <VStack spacing="xs">
        <Typography variant="labelMedium" color="onSurfaceVariant">
          {LABELS[type]}
        </Typography>
        <Editable
          {...props}
          label={LABELS[type]}
          options={PRIORITIES}
          value={values[type]}
          onChange={(value) => setValues((all) => ({ ...all, [type]: value }))}
          onSubmit={() => setSaved(`${LABELS[type]} saved.`)}
          validate={(value) =>
            type === "text" && value.length > 40
              ? "Keep the name under 40 characters."
              : undefined
          }
        />
      </VStack>
    </VStack>
  );
}

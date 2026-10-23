import { useState } from "react";
import {
  Checkbox,
  FormControl,
  Typography,
  VStack,
  type FormControlProps,
} from "@its/glowup-ui";

const props: Partial<FormControlProps> = {
  label: "Notify me about",
  helperText: "You can change this at any time.",
  required: true,
};

const TOPICS = [
  { id: "incidents", label: "Incidents and outages" },
  { id: "digest", label: "The weekly digest" },
  { id: "product", label: "New features" },
];

export default function FormControlExample() {
  const [topics, setTopics] = useState(["incidents"]);
  const toggle = (id: string) =>
    setTopics((now) =>
      now.includes(id) ? now.filter((topic) => topic !== id) : [...now, id],
    );

  return (
    <VStack spacing="s">
      <Typography variant="titleMedium">Email preferences</Typography>
      {/* Checkbox has no label or error of its own: the FormControl adds them. */}
      <FormControl
        {...props}
        error={topics.length === 0 ? "Pick at least one topic." : props.error}
      >
        {TOPICS.map((topic) => (
          <Checkbox
            key={topic.id}
            label={topic.label}
            checked={topics.includes(topic.id)}
            onValueChange={() => toggle(topic.id)}
          />
        ))}
      </FormControl>
    </VStack>
  );
}

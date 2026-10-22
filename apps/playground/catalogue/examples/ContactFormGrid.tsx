import { useState } from "react";
import {
  Avatar,
  Button,
  Grid,
  Input,
  Typography,
  VStack,
} from "@its/glowup-ui";

const CONTACT = {
  first: "Mara",
  last: "Quinn",
  email: "mara.quinn@example.com",
  phone: "",
  company: "Fernhill Dental",
};

const FIELDS = [
  { key: "first", label: "First name", size: { xs: 12, sm: 6 } },
  { key: "last", label: "Last name", size: { xs: 12, sm: 6 } },
  { key: "email", label: "Email", size: 12 },
  { key: "phone", label: "Phone", size: { xs: 12, sm: 6 } },
  { key: "company", label: "Company", size: { xs: 12, sm: 6 } },
] as const;

export default function ContactFormGrid() {
  const [form, setForm] = useState(CONTACT);
  const [saved, setSaved] = useState(false);
  const edit = (key: keyof typeof CONTACT, text: string) => {
    setForm((now) => ({ ...now, [key]: text }));
    setSaved(false);
  };

  return (
    <VStack spacing="m">
      <Typography variant="headlineSmall">Edit contact</Typography>

      {/* A container inside a container is also an item of it: it takes a size. */}
      <Grid container spacing={{ row: "m", column: "l" }}>
        <Grid container size={{ xs: 12, md: 8 }} spacing="s">
          {FIELDS.map((field) => (
            <Grid key={field.key} size={field.size}>
              <Input
                label={field.label}
                value={form[field.key]}
                onChange={(text) => edit(field.key, text)}
              />
            </Grid>
          ))}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <VStack spacing="s">
            <Avatar name={`${form.first} ${form.last}`} size="large" />
            <Typography variant="titleMedium">
              {`${form.first} ${form.last}`}
            </Typography>
            <Typography variant="bodyMedium" color="onSurfaceVariant">
              {form.company || "No company"}
            </Typography>
            <Button
              iconName={saved ? "check" : "content-save-outline"}
              disabled={saved}
              onClick={() => setSaved(true)}
            >
              {saved ? "Saved" : "Save contact"}
            </Button>
          </VStack>
        </Grid>
      </Grid>
    </VStack>
  );
}

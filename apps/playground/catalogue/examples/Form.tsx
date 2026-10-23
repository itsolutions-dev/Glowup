import { useState } from "react";
import {
  Button,
  Form,
  FormField,
  Input,
  Typography,
  VStack,
  type FormProps,
  type FormValues,
} from "@its/glowup-ui";

const props: Partial<FormProps> = {
  validateOn: "blur",
};

export default function FormExample() {
  const [saved, setSaved] = useState<FormValues | null>(null);

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Edit profile</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {saved
            ? `Saved. We will write to ${saved.email}.`
            : "Name and email are required."}
        </Typography>
      </VStack>
      <Form
        {...props}
        initialValues={{ name: "Maria Rossi", email: "", website: "" }}
        onSubmit={setSaved}
      >
        <VStack spacing="s">
          <FormField name="name" label="Name" rules={[{ required: true }]}>
            {(field) => <Input {...field} />}
          </FormField>
          <FormField
            name="email"
            label="Email"
            rules={[{ required: true }, { type: "email" }]}
          >
            {(field) => <Input {...field} />}
          </FormField>
          <FormField
            name="website"
            label="Website"
            helperText="Optional"
            rules={[{ type: "url" }]}
          >
            {(field) => <Input {...field} />}
          </FormField>
          <Button type="submit" fullWidth>
            Save profile
          </Button>
        </VStack>
      </Form>
    </VStack>
  );
}

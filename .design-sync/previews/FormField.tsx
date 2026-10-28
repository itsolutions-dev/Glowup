import React from "react";
import {
  Button,
  Form,
  FormField,
  Input,
  Select,
  Slider,
  Switch,
  useForm,
} from "@its/glowup-ui";
import type { FormProps } from "@its/glowup-ui";

// FormField connects one control to the Form around it: it hands the control
// its value, the change callback, onBlur, error, required and disabled. It only
// works inside a Form, so every story is a small form.
const card: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  width: 360,
};

const noop = () => {};

/** Validates on mount, so the card shows the rules' errors without typing. */
const Validated = ({ children, ...props }: FormProps) => {
  const form = useForm(props.initialValues);
  React.useEffect(() => {
    void form.validate();
  }, [form]);
  return (
    <Form form={form} {...props}>
      {children}
    </Form>
  );
};

// A function child spreads what the field hands it; `label` and `helperText`
// reach the Input, which draws them.
export const FunctionChild = () => (
  <div style={card}>
    <Form
      initialValues={{ email: "marta@itsol.it" }}
      onSubmit={noop}
      style={{ gap: 12 }}
    >
      <FormField
        name="email"
        label="Work email"
        helperText="We send the invoice here."
        rules={[{ required: true }, { type: "email" }]}
      >
        {(field) => <Input {...field} leadingIcon="email-outline" />}
      </FormField>
      <Button type="submit">Save</Button>
    </Form>
  </div>
);

// An element child gets the props injected; a control whose value prop or
// callback is not `value` / `onChange` names them.
export const ElementChild = () => (
  <div style={card}>
    <Form
      initialValues={{ role: "editor" }}
      onSubmit={noop}
      style={{ gap: 12 }}
    >
      <FormField name="role" label="Role">
        <Select
          variant="outlined"
          value="editor"
          onChange={noop}
          options={[
            { id: "viewer", label: "Viewer", value: "viewer" },
            { id: "editor", label: "Editor", value: "editor" },
            { id: "admin", label: "Admin", value: "admin" },
          ]}
        />
      </FormField>
      <FormField
        name="volume"
        label="Notification volume"
        control
        valuePropName="value"
        trigger="onValueChange"
        initialValue={60}
      >
        <Slider value={60} onValueChange={noop} min={0} max={100} />
      </FormField>
    </Form>
  </div>
);

// `control` wraps a control that draws no label or error of its own in a
// FormControl, which draws them around it.
export const Control = () => (
  <div style={card}>
    <Validated initialValues={{ alerts: false }} style={{ gap: 12 }}>
      <FormField
        name="alerts"
        label="Security alerts"
        helperText="Sign-ins from a new device."
        control
        rules={[{ required: true, message: "Security alerts must stay on" }]}
      >
        <Switch value={false} onChange={noop} />
      </FormField>
    </Validated>
  </div>
);

// The first rule that fails is the field's error.
export const RuleErrors = () => (
  <div style={card}>
    <Validated
      initialValues={{ name: "", email: "marta@", code: "12" }}
      style={{ gap: 12 }}
    >
      <FormField name="name" label="Name" rules={[{ required: true }]}>
        {(field) => <Input {...field} />}
      </FormField>
      <FormField name="email" label="Email" rules={[{ type: "email" }]}>
        {(field) => <Input {...field} />}
      </FormField>
      <FormField
        name="code"
        label="Invite code"
        rules={[{ minLength: 6, message: "The code has 6 characters" }]}
      >
        {(field) => <Input {...field} />}
      </FormField>
    </Validated>
  </div>
);

// `disabled` turns off one field; the form's own `disabled` turns off all.
export const Disabled = () => (
  <div style={card}>
    <Form
      initialValues={{ plan: "Pro", seats: "12" }}
      onSubmit={noop}
      style={{ gap: 12 }}
    >
      <FormField
        name="plan"
        label="Plan"
        disabled
        helperText="Managed by your admin."
      >
        {(field) => <Input {...field} />}
      </FormField>
      <FormField name="seats" label="Seats">
        {(field) => <Input {...field} />}
      </FormField>
    </Form>
  </div>
);

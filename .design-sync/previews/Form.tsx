import React from "react";
import {
  Button,
  Checkbox,
  Form,
  FormField,
  Input,
  Switch,
  Typography,
  useForm,
} from "@its/glowup-ui";
import type { FormProps } from "@its/glowup-ui";

// Form renders a real <form> on the web and a plain View on iOS and Android, so
// it takes layout through `style` like a View. The submit button is an ordinary
// Button with type="submit": pressing it, or Enter in a field on the web, calls
// onSubmit once.
const card: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  width: 360,
};

export const SignUp = () => (
  <div style={card}>
    <Typography variant="titleLarge">Create your account</Typography>
    <Form onSubmit={() => {}} style={{ gap: 12 }}>
      <Input label="Name" value="Marta Rossi" onChange={() => {}} required />
      <Input
        label="Email"
        value="marta@itsol.it"
        onChange={() => {}}
        leadingIcon="email-outline"
        required
      />
      <Button type="submit" fullWidth>
        Create account
      </Button>
    </Form>
  </div>
);

export const Subscribe = () => (
  <div style={card}>
    <Typography variant="titleLarge">Release notes by email</Typography>
    <Form onSubmit={() => {}} style={{ gap: 12 }}>
      <Input
        label="Email"
        value=""
        placeholder="you@company.com"
        onChange={() => {}}
        helperText="Press Enter in the field, or the button, to submit."
      />
      <Button type="submit" variant="tonal" iconName="send-outline">
        Subscribe
      </Button>
    </Form>
  </div>
);

export const WithError = () => (
  <div style={card}>
    <Typography variant="titleLarge">Sign in</Typography>
    <Form onSubmit={() => {}} style={{ gap: 12 }}>
      <Input
        label="Email"
        value="marta@"
        onChange={() => {}}
        error="Enter a valid email"
      />
      <Input
        label="Password"
        value="secret"
        onChange={() => {}}
        secureTextEntry
      />
      <Button type="submit" fullWidth iconName="login">
        Sign in
      </Button>
    </Form>
  </div>
);

// ---- Form with fields ------------------------------------------------------
// With `FormField` the form keeps the values, errors and flags in a store
// outside React state: typing in one field re-renders only that field. The
// function child hands the control its `value`, `onChange`, `onBlur`, `error`,
// `required` and `disabled`.

const noop = () => {};

/** Validates on mount, so a gallery can show the error state without typing. */
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

/** Submits on mount: the submit button shows its loading state while `onSubmit` is pending. */
const Submitting = ({ children, ...props }: FormProps) => {
  const form = useForm(props.initialValues);
  React.useEffect(() => {
    void form.submit();
  }, [form]);
  return (
    <Form form={form} {...props}>
      {children}
    </Form>
  );
};

export const WithFields = () => (
  <div style={card}>
    <Typography variant="titleLarge">Create your account</Typography>
    <Form
      initialValues={{
        name: "Marta Rossi",
        email: "marta@itsol.it",
        terms: true,
      }}
      onSubmit={() => {}}
      style={{ gap: 12 }}
    >
      <FormField name="name" label="Name" rules={[{ required: true }]}>
        {(field) => <Input {...field} />}
      </FormField>
      <FormField
        name="email"
        label="Email"
        helperText="We send the receipt here."
        rules={[{ required: true }, { type: "email" }]}
      >
        {(field) => <Input {...field} leadingIcon="email-outline" />}
      </FormField>
      <FormField
        name="terms"
        control
        valuePropName="checked"
        trigger="onValueChange"
        rules={[{ required: true, message: "Accept the terms to continue" }]}
      >
        <Checkbox
          label="I accept the terms of service"
          checked
          onValueChange={noop}
        />
      </FormField>
      <Button type="submit" fullWidth>
        Create account
      </Button>
    </Form>
  </div>
);

export const ValidationErrors = () => (
  <div style={card}>
    <Typography variant="titleLarge">Create your account</Typography>
    <Validated
      initialValues={{ name: "", email: "marta@", terms: false }}
      style={{ gap: 12 }}
    >
      <FormField name="name" label="Name" rules={[{ required: true }]}>
        {(field) => <Input {...field} />}
      </FormField>
      <FormField
        name="email"
        label="Email"
        rules={[{ required: true }, { type: "email" }]}
      >
        {(field) => <Input {...field} leadingIcon="email-outline" />}
      </FormField>
      <FormField
        name="terms"
        control
        label="Terms"
        valuePropName="checked"
        trigger="onValueChange"
        rules={[{ required: true, message: "Accept the terms to continue" }]}
      >
        <Checkbox
          label="I accept the terms of service"
          checked={false}
          onValueChange={noop}
        />
      </FormField>
      <Button type="submit" fullWidth>
        Create account
      </Button>
    </Validated>
  </div>
);

export const ConfirmPassword = () => (
  <div style={card}>
    <Typography variant="titleLarge">Choose a password</Typography>
    <Validated
      initialValues={{ password: "correct horse", confirm: "correct hors" }}
      style={{ gap: 12 }}
    >
      <FormField
        name="password"
        label="Password"
        rules={[{ required: true }, { minLength: 8 }]}
      >
        {(field) => <Input {...field} secureTextEntry />}
      </FormField>
      <FormField
        name="confirm"
        label="Confirm password"
        dependencies={["password"]}
        rules={[
          {
            validator: (value, all) =>
              value !== all.password && "The passwords do not match",
          },
        ]}
      >
        {(field) => <Input {...field} secureTextEntry />}
      </FormField>
    </Validated>
  </div>
);

export const SubmittingForm = () => (
  <div style={card}>
    <Typography variant="titleLarge">Saving</Typography>
    <Submitting
      initialValues={{ name: "Marta Rossi" }}
      onSubmit={() => new Promise<void>(noop)}
      style={{ gap: 12 }}
    >
      <FormField name="name" label="Name" rules={[{ required: true }]}>
        {(field) => <Input {...field} />}
      </FormField>
      <Button type="submit" fullWidth>
        Save
      </Button>
    </Submitting>
  </div>
);

export const DisabledForm = () => (
  <div style={card}>
    <Typography variant="titleLarge">Account</Typography>
    <Form
      initialValues={{ name: "Marta Rossi", newsletter: true }}
      disabled
      style={{ gap: 12 }}
    >
      <FormField name="name" label="Name">
        {(field) => <Input {...field} />}
      </FormField>
      <FormField name="newsletter" control>
        <Switch label="Product news by email" value onChange={noop} />
      </FormField>
      <Button type="submit" fullWidth>
        Save
      </Button>
    </Form>
  </div>
);

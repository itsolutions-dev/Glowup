// GENERATED — do not edit.
// Source: .design-sync/previews/Form.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Form, Input, Button, Typography } from "@its/glowup-ui";

// Form renders a real <form> on the web and a plain View on iOS and Android, so
// it takes layout through `style` like a View. The submit button is an ordinary
// Button with type="submit": pressing it, or Enter in a field on the web, calls
// onSubmit once.
const card: ViewStyle = {
  flexDirection: "column",
  gap: 16,
  width: 360,
};

export const SignUp = () => (
  <View style={card}>
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
  </View>
);

export const Subscribe = () => (
  <View style={card}>
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
  </View>
);

export const WithError = () => (
  <View style={card}>
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
  </View>
);

export const variants: Variant[] = [
  {
    name: "SignUp",
    title: "Sign up",
    render: SignUp,
  },
  {
    name: "Subscribe",
    title: "Subscribe",
    render: Subscribe,
  },
  {
    name: "WithError",
    title: "With error",
    render: WithError,
  },
];

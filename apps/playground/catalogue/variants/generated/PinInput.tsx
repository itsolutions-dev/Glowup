// GENERATED — do not edit.
// Source: .design-sync/previews/PinInput.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import type { Variant } from "../types";
import { PinInput, VStack } from "@its/glowup-ui";

export const SixDigits = () => (
  <VStack width={420}>
    <PinInput
      value="4821"
      onChangeText={() => {}}
      label="Verification code"
      helperText="We sent a 6-digit code to ada@acme.example."
    />
  </VStack>
);

export const Masked = () => (
  <VStack width={420}>
    <PinInput
      value="1234"
      onChangeText={() => {}}
      length={4}
      mask
      label="PIN"
    />
  </VStack>
);

export const Alphanumeric = () => (
  <VStack width={420}>
    <PinInput
      value="A7K2"
      onChangeText={() => {}}
      length={4}
      type="alphanumeric"
      label="Invite code"
      helperText="Letters and digits, case-insensitive."
    />
  </VStack>
);

export const ErrorAndDisabled = () => (
  <VStack spacing="m" width={420}>
    <PinInput
      value="482100"
      onChangeText={() => {}}
      label="Verification code"
      error="That code has expired."
    />
    <PinInput
      value="0000"
      onChangeText={() => {}}
      length={4}
      label="PIN"
      disabled
    />
  </VStack>
);

export const variants: Variant[] = [
  {
    name: "SixDigits",
    title: "Six digits",
    render: SixDigits,
  },
  {
    name: "Masked",
    title: "Masked",
    render: Masked,
  },
  {
    name: "Alphanumeric",
    title: "Alphanumeric",
    render: Alphanumeric,
  },
  {
    name: "ErrorAndDisabled",
    title: "Error and disabled",
    render: ErrorAndDisabled,
  },
];

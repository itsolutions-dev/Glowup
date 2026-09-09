import React from "react";
import { PinInput, VStack } from "@glowup/ui";

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

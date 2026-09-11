// GENERATED — do not edit.
// Source: .design-sync/previews/FormControl.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import type { Variant } from "../types";
import {
  Checkbox,
  FormControl,
  Input,
  RadioGroup,
  Slider,
  VStack,
} from "@its/glowup-ui";

export const AroundACheckbox = () => (
  <VStack spacing="m" width={380}>
    <FormControl label="Terms" helperText="You can withdraw consent later.">
      <Checkbox
        label="I accept the terms of service"
        checked
        onValueChange={() => {}}
      />
    </FormControl>
    <FormControl
      label="Terms"
      error="You must accept the terms to continue."
      required
    >
      <Checkbox
        label="I accept the terms of service"
        checked={false}
        onValueChange={() => {}}
      />
    </FormControl>
  </VStack>
);

export const AroundARadioGroup = () => (
  <VStack width={380}>
    <FormControl
      label="Invoice frequency"
      helperText="Applies from the next billing cycle."
      required
    >
      <RadioGroup
        options={[
          { id: "m", label: "Monthly", value: "m" },
          { id: "q", label: "Quarterly", value: "q" },
          { id: "y", label: "Yearly", value: "y" },
        ]}
        value="y"
        onValueChange={() => {}}
      />
    </FormControl>
  </VStack>
);

/** `disabled` dims the whole group, control and supporting text together. */
export const Disabled = () => (
  <VStack spacing="m" width={380}>
    <FormControl
      label="Storage quota"
      helperText="Fixed by your plan."
      disabled
    >
      <Slider
        value={30}
        onValueChange={() => {}}
        min={0}
        max={100}
        showValueLabel
        disabled
      />
    </FormControl>
    <FormControl label="Workspace name" helperText="Shown on every invoice.">
      <Input value="Acme S.r.l." onChangeText={() => {}} />
    </FormControl>
  </VStack>
);

export const variants: Variant[] = [
  {
    name: "AroundACheckbox",
    title: "Around a checkbox",
    render: AroundACheckbox,
  },
  {
    name: "AroundARadioGroup",
    title: "Around a radio group",
    render: AroundARadioGroup,
  },
  {
    name: "Disabled",
    title: "Disabled",
    description:
      "`disabled` dims the whole group, control and supporting text together.",
    render: Disabled,
  },
];

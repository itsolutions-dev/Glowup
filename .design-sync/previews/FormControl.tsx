import React from "react";
import {
  Checkbox,
  FormControl,
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

/**
 * `disabled` dims the control and its supporting text, beside an enabled group.
 * It does not reach the control itself, so the control takes `disabled` too.
 */
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
    <FormControl
      label="Budget alert"
      helperText="Notify me at this share of the budget."
    >
      <Slider
        value={80}
        onValueChange={() => {}}
        min={0}
        max={100}
        showValueLabel
      />
    </FormControl>
  </VStack>
);

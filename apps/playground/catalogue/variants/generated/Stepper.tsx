// GENERATED — do not edit.
// Source: .design-sync/previews/Stepper.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Stepper } from "@its/glowup-ui";

const wrap: ViewStyle = { width: 400, flexDirection: "row" };
const narrow: ViewStyle = { width: 240, flexDirection: "row" };

const checkout = ["Cart", "Shipping", "Payment", "Review"];

export const Checkout = () => (
  <View style={wrap}>
    <Stepper steps={checkout} activeStep={2} onClick={() => {}} />
  </View>
);

export const FirstStep = () => (
  <View style={wrap}>
    <Stepper steps={checkout} activeStep={0} onClick={() => {}} />
  </View>
);

export const AllComplete = () => (
  <View style={wrap}>
    <Stepper steps={checkout} activeStep={4} />
  </View>
);

export const WithIcons = () => (
  <View style={wrap}>
    <Stepper
      activeStep={1}
      onClick={() => {}}
      steps={[
        { label: "Account", icon: "account-outline" },
        { label: "Company", icon: "domain" },
        { label: "Billing", icon: "credit-card-outline" },
      ]}
    />
  </View>
);

/** `direction="column"` stacks the steps with the label beside each circle. */
export const Vertical = () => (
  <View style={narrow}>
    <Stepper
      direction="column"
      steps={checkout}
      activeStep={2}
      onClick={() => {}}
    />
  </View>
);

export const VerticalWithIcons = () => (
  <View style={narrow}>
    <Stepper
      direction="column"
      activeStep={1}
      steps={[
        { label: "Account", icon: "account-outline" },
        { label: "Company", icon: "domain" },
        { label: "Billing", icon: "credit-card-outline" },
      ]}
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Checkout",
    title: "Checkout",
    render: Checkout,
  },
  {
    name: "FirstStep",
    title: "First step",
    render: FirstStep,
  },
  {
    name: "AllComplete",
    title: "All complete",
    render: AllComplete,
  },
  {
    name: "WithIcons",
    title: "With icons",
    render: WithIcons,
  },
  {
    name: "Vertical",
    title: "Vertical",
    description:
      '`direction="column"` stacks the steps with the label beside each circle.',
    render: Vertical,
  },
  {
    name: "VerticalWithIcons",
    title: "Vertical with icons",
    render: VerticalWithIcons,
  },
];

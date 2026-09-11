// GENERATED — do not edit.
// Source: .design-sync/previews/Stepper.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Stepper } from "@its/glowup-ui";

const wrap: ViewStyle = { width: 400, flexDirection: "row" };

const checkout = ["Cart", "Shipping", "Payment", "Review"];

export const Checkout = () => (
  <View style={wrap}>
    <Stepper steps={checkout} activeStep={2} onStepPress={() => {}} />
  </View>
);

export const FirstStep = () => (
  <View style={wrap}>
    <Stepper steps={checkout} activeStep={0} onStepPress={() => {}} />
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
      onStepPress={() => {}}
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
];

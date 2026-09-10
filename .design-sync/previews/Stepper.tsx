import React from "react";
import { Stepper } from "@its/glowup-ui";

const wrap: React.CSSProperties = { width: 400, display: "flex" };

const checkout = ["Cart", "Shipping", "Payment", "Review"];

export const Checkout = () => (
  <div style={wrap}>
    <Stepper steps={checkout} activeStep={2} onStepPress={() => {}} />
  </div>
);

export const FirstStep = () => (
  <div style={wrap}>
    <Stepper steps={checkout} activeStep={0} onStepPress={() => {}} />
  </div>
);

export const AllComplete = () => (
  <div style={wrap}>
    <Stepper steps={checkout} activeStep={4} />
  </div>
);

export const WithIcons = () => (
  <div style={wrap}>
    <Stepper
      activeStep={1}
      onStepPress={() => {}}
      steps={[
        { label: "Account", icon: "account-outline" },
        { label: "Company", icon: "domain" },
        { label: "Billing", icon: "credit-card-outline" },
      ]}
    />
  </div>
);

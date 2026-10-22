import React from "react";
import { Stepper } from "@its/glowup-ui";

const wrap: React.CSSProperties = { width: 400, display: "flex" };
const narrow: React.CSSProperties = { width: 240, display: "flex" };

const checkout = ["Cart", "Shipping", "Payment", "Review"];

export const Checkout = () => (
  <div style={wrap}>
    <Stepper steps={checkout} activeStep={2} onClick={() => {}} />
  </div>
);

export const FirstStep = () => (
  <div style={wrap}>
    <Stepper steps={checkout} activeStep={0} onClick={() => {}} />
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
      onClick={() => {}}
      steps={[
        { label: "Account", icon: "account-outline" },
        { label: "Company", icon: "domain" },
        { label: "Billing", icon: "credit-card-outline" },
      ]}
    />
  </div>
);

/** `direction="column"` stacks the steps with the label beside each circle. */
export const Vertical = () => (
  <div style={narrow}>
    <Stepper
      direction="column"
      steps={checkout}
      activeStep={2}
      onClick={() => {}}
    />
  </div>
);

export const VerticalWithIcons = () => (
  <div style={narrow}>
    <Stepper
      direction="column"
      activeStep={1}
      steps={[
        { label: "Account", icon: "account-outline" },
        { label: "Company", icon: "domain" },
        { label: "Billing", icon: "credit-card-outline" },
      ]}
    />
  </div>
);

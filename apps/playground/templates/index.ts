import type { ComponentType } from "react";

import Checkout from "./Checkout";
import Dashboard from "./Dashboard";
import Inbox from "./Inbox";
import Pricing from "./Pricing";
import Profile from "./Profile";
import Settings from "./Settings";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import { TEMPLATE_SOURCES } from "./sources.generated";

export interface Template {
  /** URL segment: /templates/<slug>. */
  slug: string;
  title: string;
  /** One line for the gallery. */
  summary: string;
  /** The page's lead paragraph and meta description. */
  description: string;
  /** The width the screen was designed at: the gallery thumbnail renders it there. */
  width: number;
  Component: ComponentType;
  /** Filled from the generated sources: the file, its JSX, its components. */
  file: string;
  source: string;
  components: string[];
}

const define = (
  name: keyof typeof TEMPLATE_SOURCES,
  Component: ComponentType,
  meta: Omit<Template, "Component" | "file" | "source" | "components">,
): Template => ({ ...meta, Component, ...TEMPLATE_SOURCES[name] });

/**
 * Whole screens built only from Glowup components and theme tokens. Each one is
 * a self-contained file under templates/ importing nothing but React, React
 * Native and the library, so its source — shown on its page — can be pasted
 * into an app as is.
 */
export const TEMPLATES: Template[] = [
  define("SignIn", SignIn, {
    slug: "sign-in",
    title: "Sign in",
    summary:
      "Split brand panel, social providers, validated email and password.",
    description:
      "A split sign-in screen: a brand panel that wraps above the form on a phone, social providers, then email and password with inline validation and a show-password toggle.",
    width: 880,
  }),
  define("SignUp", SignUp, {
    slug: "sign-up",
    title: "Sign up",
    summary:
      "Three-step registration with a password meter and a one-time code.",
    description:
      "A three-step registration built on Stepper: account details with a live password-strength meter, a one-time code with PinInput, then a short profile with a role and interests.",
    width: 560,
  }),
  define("Dashboard", Dashboard, {
    slug: "dashboard",
    title: "Dashboard",
    summary: "Admin shell with rail navigation, KPI tiles, sources and orders.",
    description:
      "An admin shell: a navigation rail on a wide container and a bottom bar on a narrow one, a period switch driving the KPI tiles, traffic sources and a table of recent orders.",
    width: 1040,
  }),
  define("Inbox", Inbox, {
    slug: "inbox",
    title: "Inbox",
    summary: "List–detail mail with search, filters, empty state and delete.",
    description:
      "List–detail mail: search and filter chips over a ListItem list, the message beside it on a wide container and in place of it on a narrow one, an empty state and a confirmed delete.",
    width: 960,
  }),
  define("Profile", Profile, {
    slug: "profile",
    title: "Profile",
    summary:
      "Cover, identity, counts and tabs for activity, projects and details.",
    description:
      "A public profile: a cover band with the avatar over it, the follow and message actions, three counts, then tabs for activity, project cards and contact details.",
    width: 720,
  }),
  define("Settings", Settings, {
    slug: "settings",
    title: "Settings",
    summary: "Grouped lists, a live theme switch, unsaved-changes banner.",
    description:
      "Settings as labelled ListSection groups: account rows, an appearance group that switches the real theme, notification toggles, an unsaved-changes banner and a confirmed danger zone.",
    width: 600,
  }),
  define("Checkout", Checkout, {
    slug: "checkout",
    title: "Checkout",
    summary:
      "Address, delivery, payment and a summary with a progress pay button.",
    description:
      "A one-page checkout: shipping address, delivery options and payment method beside an order summary with quantity, promo code, totals and a pay button that carries its own progress.",
    width: 1000,
  }),
  define("Pricing", Pricing, {
    slug: "pricing",
    title: "Pricing",
    summary: "Billing switch, three plans with the featured one raised, FAQ.",
    description:
      "A pricing page: a monthly/yearly switch, three plans with the recommended one raised by the glow variant, and a FAQ of accordions underneath.",
    width: 1000,
  }),
];

export const templateFor = (slug?: string) =>
  TEMPLATES.find((template) => template.slug === slug);

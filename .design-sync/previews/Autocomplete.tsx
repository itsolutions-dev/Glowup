import React from "react";
import { Autocomplete, VStack } from "@its/glowup-ui";
import type { AutocompleteOption } from "@its/glowup-ui";

const cities: AutocompleteOption[] = [
  {
    id: "mi",
    label: "Milan",
    value: "MI",
    description: "Lombardy",
    icon: "domain",
  },
  {
    id: "to",
    label: "Turin",
    value: "TO",
    description: "Piedmont",
    icon: "domain",
  },
  {
    id: "ge",
    label: "Genoa",
    value: "GE",
    description: "Liguria",
    icon: "domain",
  },
  {
    id: "bo",
    label: "Bologna",
    value: "BO",
    description: "Emilia-Romagna",
    icon: "domain",
  },
];

const noop = () => {};

/**
 * Without a PortalHost the suggestion list is an absolutely-positioned sibling
 * of the field, so an open card needs a tall, relatively-positioned wrapper.
 * The list itself only opens on real focus - this wrapper supplies one.
 */
const Focused = ({ children }: { children: React.ReactNode }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const input = ref.current?.querySelector("input");
    const id = setTimeout(() => input?.focus(), 0);
    return () => clearTimeout(id);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", width: 380, height: 300 }}>
      {children}
    </div>
  );
};

export const Suggestions = () => (
  <Focused>
    <Autocomplete
      value="o"
      onChangeText={noop}
      options={cities}
      onSelect={noop}
      label="Delivery city"
      helperText="Free text is allowed - this is not a Select."
    />
  </Focused>
);

export const ClosedField = () => (
  <VStack spacing="m" width={380}>
    <Autocomplete
      value="Milan"
      onChangeText={noop}
      options={cities}
      onSelect={noop}
      label="Delivery city"
      leadingIcon="magnify"
      helperText="Clearable once there is text."
    />
    <Autocomplete
      value=""
      onChangeText={noop}
      options={cities}
      onSelect={noop}
      label="Delivery city"
      placeholder="Start typing a city"
      required
    />
  </VStack>
);

export const States = () => (
  <VStack spacing="m" width={380}>
    <Autocomplete
      value="Mila"
      onChangeText={noop}
      options={cities}
      onSelect={noop}
      label="City"
      loading
      helperText="Fetching matches…"
    />
    <Autocomplete
      value="Zzz"
      onChangeText={noop}
      options={cities}
      onSelect={noop}
      label="City"
      error="No delivery hub covers that city."
    />
    <Autocomplete
      value="Milan"
      onChangeText={noop}
      options={cities}
      onSelect={noop}
      label="City"
      disabled
    />
  </VStack>
);

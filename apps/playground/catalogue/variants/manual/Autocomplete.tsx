import { useState } from "react";
import { View } from "react-native";
import { Autocomplete, Typography } from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo } from "./shared";

// Hand-written rather than generated: the authored preview forces the
// suggestion list open by reaching for the DOM input with querySelector, which
// is a screenshot trick for the design-sync pipeline. Here the field is real and
// opens on a real focus, so the demo is the field itself.

const CITIES = [
  { id: "mi", label: "Milano", value: "Milano" },
  { id: "to", label: "Torino", value: "Torino" },
  { id: "ro", label: "Roma", value: "Roma" },
  { id: "no", label: "Novara", value: "Novara" },
  { id: "bo", label: "Bologna", value: "Bologna" },
  { id: "mo", label: "Modena", value: "Modena" },
];

const Suggestions = () => {
  const [query, setQuery] = useState("o");

  return (
    <View style={demo.panel}>
      <Typography variant="labelMedium">
        Focus the field to open the list — free text is allowed, this is not a
        Select.
      </Typography>
      <Autocomplete
        value={query}
        onChangeText={setQuery}
        options={CITIES}
        onSelect={(option) => setQuery(String(option.value))}
        label="Delivery city"
        leadingIcon="map-marker-outline"
        helperText="Matches anywhere in the name, not just the start."
      />
    </View>
  );
};

const Loading = () => {
  const [query, setQuery] = useState("mil");

  return (
    <View style={demo.panel}>
      <Autocomplete
        value={query}
        onChangeText={setQuery}
        options={[]}
        onSelect={() => {}}
        label="Delivery city"
        loading
        helperText="Waiting on the server."
      />
    </View>
  );
};

const WithError = () => {
  const [query, setQuery] = useState("Atlantis");

  return (
    <View style={demo.panel}>
      <Autocomplete
        value={query}
        onChangeText={setQuery}
        options={CITIES}
        onSelect={() => {}}
        label="Delivery city"
        required
        error="We do not deliver there yet"
        emptyMessage="No city matches"
      />
    </View>
  );
};

const Disabled = () => (
  <View style={demo.panel}>
    <Autocomplete
      value="Milano"
      onChangeText={() => {}}
      options={CITIES}
      onSelect={() => {}}
      label="Delivery city"
      disabled
    />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Suggestions",
    title: "Suggestions",
    description:
      "The list opens on focus and filters as you type; selecting a suggestion writes its value back into the field.",
    render: Suggestions,
  },
  { name: "Loading", title: "Loading", render: Loading },
  { name: "WithError", title: "With error", render: WithError },
  { name: "Disabled", title: "Disabled", render: Disabled },
];

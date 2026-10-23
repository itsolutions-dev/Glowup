import { useState } from "react";
import {
  Select,
  Typography,
  VStack,
  type Option,
  type SelectProps,
} from "@its/glowup-ui";

const props: Partial<SelectProps> = {
  label: "Ship to",
  placeholder: "Choose a country",
};

const COUNTRIES: Option[] = [
  { id: "it", label: "Italy", value: "it", icon: "flag-outline" },
  { id: "fr", label: "France", value: "fr", icon: "flag-outline" },
  { id: "de", label: "Germany", value: "de", icon: "flag-outline" },
  { id: "es", label: "Spain", value: "es", icon: "flag-outline" },
  { id: "pt", label: "Portugal", value: "pt", icon: "flag-outline" },
];

const DELIVERY: Record<string, string> = {
  it: "1-2 days",
  fr: "2-3 days",
  de: "2-3 days",
  es: "3-4 days",
  pt: "4-5 days",
};

export default function SelectExample() {
  const [country, setCountry] = useState<string | null>("it");
  const [countries, setCountries] = useState<string[]>(["it"]);
  const chosen = props.multiple ? countries : country ? [country] : [];

  return (
    <VStack spacing="m">
      <Typography variant="titleMedium">Delivery</Typography>
      <Select
        {...props}
        options={COUNTRIES}
        value={props.multiple ? countries : country}
        onChange={props.multiple ? setCountries : setCountry}
      />
      <VStack spacing="xs">
        {chosen.length === 0 && (
          <Typography variant="bodySmall" color="onSurfaceVariant">
            Pick a country to see the delivery time.
          </Typography>
        )}
        {COUNTRIES.filter((option) => chosen.includes(option.value)).map(
          (option) => (
            <Typography key={option.id} variant="bodyMedium">
              {`${option.label}: arrives in ${DELIVERY[option.value]}`}
            </Typography>
          ),
        )}
      </VStack>
    </VStack>
  );
}

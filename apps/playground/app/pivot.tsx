import { useMemo, useState } from "react";
import { View } from "react-native";
import {
  Banner,
  Button,
  Paper,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";
import { PivotGrid } from "@its/glowup-pivot";

import { CodeBlock } from "../site/CodeBlock";
import { Page, Section } from "../site/Page";
import { samplePivotEngine } from "../site/samplePivot";

const INSTALL = `npm install @its/glowup-pivot`;

const USAGE = `import { PivotEngine, PivotGrid } from "@its/glowup-pivot";

const engine = new PivotEngine();
engine.setLocale("it-IT");
// The first row names the fields; the others are the data.
engine.setData([{ site: { type: "string", caption: "Site" }, n: { type: "number", caption: "Count" } }, ...rows]);
engine.setSlice({
  rows: [{ uniqueName: "site" }],
  columns: [{ uniqueName: "Measures" }],
  measures: [{ uniqueName: "n", aggregation: "sum" }],
  expands: { expandAll: true },
  filters: [],
});

// \`toolbar\`: Export to Excel (an .xlsx on web, iOS and Android), Fullscreen and Reset.
// On iOS and Android the export needs expo-file-system and expo-sharing in the app.
<PivotGrid engine={engine} height={528} toolbar fileName="report" />`;

const LOCALES = [
  { id: "en-US", label: "English" },
  { id: "it-IT", label: "Italiano" },
];

/** The sample pivot, and a switch for the locale the numbers are formatted with. */
const Demo = () => {
  const { theme } = useTheme();
  const engine = useMemo(() => samplePivotEngine(), []);
  const [locale, setLocale] = useState("en-US");

  return (
    <VStack spacing={16}>
      <Paper
        style={{
          overflow: "hidden",
          borderRadius: 12,
          backgroundColor: theme.colors.surface,
        }}
      >
        <PivotGrid
          engine={engine}
          height={528}
          toolbar
          fileName="pivot-sample"
        />
      </Paper>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {LOCALES.map(({ id, label }) => (
          <Button
            key={id}
            variant={locale === id ? "filled" : "outlined"}
            onClick={() => {
              engine.setLocale(id);
              setLocale(id);
            }}
          >
            {label}
          </Button>
        ))}
      </View>
    </VStack>
  );
};

export default function PivotPage() {
  return (
    <Page
      eyebrow="Companion package"
      title="Pivot"
      description="@its/glowup-pivot shows a pivot table, with the engine of AuraPivot copied into the package. It is a read-only grid on the web, phone browsers included, and in the iOS and Android app. This page is not published yet."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message="A table to read and export: rows and column groups open and close, the header and the first two columns stay in view while you scroll, and the toolbar exports what is on screen to Excel, opens the grid full screen and resets it. The field panel, formats, filters, calculated fields and drill-through are left out for now."
        />
      }
    >
      <Section
        title="Live"
        description="Invented data with the shape of a CRM report: sites, four categories under each site, a true/false column and the grand total on top."
      >
        <Demo />
      </Section>
      <Section
        title="Use it"
        description="An engine holds the data and the report; the grid shows it and asks the engine to open or close a row. With toolbar, the grid exports an .xlsx of what it shows: downloaded on the web, handed to the share sheet on iOS and Android."
      >
        <CodeBlock code={INSTALL} language="bash" title="Terminal" />
        <CodeBlock code={USAGE} title="Screen.tsx" />
        <Typography variant="bodyMedium">
          The notes on what was copied from AuraPivot and what differs are in
          docs/pivot-upstream.md.
        </Typography>
      </Section>
    </Page>
  );
}

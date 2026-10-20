import { useState } from "react";
import { View } from "react-native";
import {
  Banner,
  Button,
  Paper,
  Toggle,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";
import { BarChart, type ChartDatum } from "@its/glowup-charts";

import { CodeBlock } from "../site/CodeBlock";
import { Page, Section } from "../site/Page";

const INSTALL = `npx expo install @its/glowup-charts react-native-svg`;

const USAGE = `import { BarChart } from "@its/glowup-charts";

// One object per category: its label and one number per series key
const data = [
  { label: "Jan", answered: 120, missed: 30 },
  { label: "Feb", answered: 98, missed: 41 },
];

<BarChart
  data={data}
  series={[
    { key: "answered", label: "Answered" },
    { key: "missed", label: "Missed" },
  ]}
  stacked
  horizontal
  target={150}
  locale="it-IT"
  onSelect={(index) => console.log(index)}
/>`;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const ANSWERED = [120, 98, 134, 110, 142, 128, 90, 76, 131, 149, 138, 117];
const MISSED = [30, 41, 22, 35, 18, 27, 44, 39, 21, 15, 24, 33];

const CALLS: ChartDatum[] = MONTHS.map((label, i) => ({
  label,
  answered: ANSWERED[i],
  missed: MISSED[i],
}));

const SERIES = [
  { key: "answered", label: "Answered" },
  { key: "missed", label: "Missed" },
];

const Option = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
    <Toggle value={value} onValueChange={onChange} />
    <Typography variant="bodyMedium">{label}</Typography>
  </View>
);

const Demo = () => {
  const { theme } = useTheme();
  const [stacked, setStacked] = useState(false);
  const [horizontal, setHorizontal] = useState(false);
  const [target, setTarget] = useState(true);
  const [few, setFew] = useState(false);
  const [state, setState] = useState<"data" | "loading" | "empty">("data");
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <VStack spacing={16}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        <Option label="Stacked" value={stacked} onChange={setStacked} />
        <Option
          label="Horizontal"
          value={horizontal}
          onChange={setHorizontal}
        />
        <Option label="Target line" value={target} onChange={setTarget} />
        <Option label="Three months only" value={few} onChange={setFew} />
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {(["data", "loading", "empty"] as const).map((s) => (
          <Button
            key={s}
            mode={state === s ? "filled" : "outlined"}
            onPress={() => setState(s)}
          >
            {s}
          </Button>
        ))}
      </View>
      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          backgroundColor: theme.colors.surfaceContainerLow,
        }}
      >
        <BarChart
          title="Calls by month"
          data={state === "empty" ? [] : few ? CALLS.slice(0, 3) : CALLS}
          series={SERIES}
          loading={state === "loading"}
          stacked={stacked}
          horizontal={horizontal}
          height={horizontal && !few ? 400 : 240}
          target={target ? 150 : undefined}
          onSelect={setPicked}
          testID="demo-bars"
        />
      </Paper>
      <Typography variant="bodyMedium">
        {picked === null
          ? "Tap or hover a month."
          : `Selected: ${CALLS[picked]?.label}`}
      </Typography>
    </VStack>
  );
};

export default function ChartsPage() {
  return (
    <Page
      eyebrow="Companion package"
      title="Charts"
      description="@its/glowup-charts draws charts with react-native-svg and a copy of d3's scales and shapes, with no dependency of its own. Only the bar chart exists so far. This page is not published yet."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message="Checked in a browser; on a phone it has run only in unit tests so far. Series colours are provisional: they come from the theme's roles until the library has a chart palette."
        />
      }
    >
      <Section
        title="Live"
        description="Bars grouped or stacked, vertical or horizontal, a target line, a tooltip on tap or hover, and the loading and empty states."
      >
        <Demo />
      </Section>
      <Section
        title="Use it"
        description="The data is one object per category with a number per series key, the shape recharts and the CRM already use."
      >
        <CodeBlock code={INSTALL} language="bash" title="Terminal" />
        <CodeBlock code={USAGE} title="Screen.tsx" />
        <Typography variant="bodyMedium">
          The prop reference is in packages/charts/README.md until the generator
          covers this package.
        </Typography>
      </Section>
    </Page>
  );
}

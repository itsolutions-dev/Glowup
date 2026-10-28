import { useMemo, useState, type ReactNode } from "react";
import { View } from "react-native";
import {
  Banner,
  Button,
  Paper,
  Switch,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";
import {
  AreaChart,
  BarChart,
  DonutChart,
  LineChart,
  PieChart,
  Sparkline,
  StackedBar,
  type ChartDatum,
} from "@its/glowup-charts";

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
  legend
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
    <Switch value={value} onChange={onChange} />
    <Typography variant="bodyMedium">{label}</Typography>
  </View>
);

const Demo = () => {
  const { theme } = useTheme();
  const [kind, setKind] = useState<"bars" | "lines" | "area">("bars");
  const [stacked, setStacked] = useState(false);
  const [horizontal, setHorizontal] = useState(false);
  const [smooth, setSmooth] = useState(false);
  const [target, setTarget] = useState(true);
  const [table, setTable] = useState(false);
  const [few, setFew] = useState(false);
  const [state, setState] = useState<"data" | "loading" | "empty">("data");
  const [picked, setPicked] = useState<number | null>(null);
  const common = {
    title: "Calls by month",
    data: state === "empty" ? [] : few ? CALLS.slice(0, 3) : CALLS,
    series: SERIES,
    loading: state === "loading",
    legend: true,
    table,
    target: target ? 150 : undefined,
    onSelect: setPicked,
    testID: "demo-bars",
  };

  return (
    <VStack spacing={16}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {(["bars", "lines", "area"] as const).map((k) => (
          <Button
            key={k}
            variant={kind === k ? "filled" : "outlined"}
            onClick={() => setKind(k)}
          >
            {k}
          </Button>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {kind === "bars" ? (
          <>
            <Option label="Stacked" value={stacked} onChange={setStacked} />
            <Option
              label="Horizontal"
              value={horizontal}
              onChange={setHorizontal}
            />
          </>
        ) : (
          <Option label="Smooth" value={smooth} onChange={setSmooth} />
        )}
        <Option label="Target line" value={target} onChange={setTarget} />
        <Option label="Table" value={table} onChange={setTable} />
        <Option label="Three months only" value={few} onChange={setFew} />
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {(["data", "loading", "empty"] as const).map((s) => (
          <Button
            key={s}
            variant={state === s ? "filled" : "outlined"}
            onClick={() => setState(s)}
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
        {kind === "bars" ? (
          <BarChart
            {...common}
            stacked={stacked}
            horizontal={horizontal}
            height={horizontal && !few ? 400 : 240}
          />
        ) : kind === "lines" ? (
          <LineChart {...common} curve={smooth ? "monotone" : "linear"} />
        ) : (
          <AreaChart {...common} curve={smooth ? "monotone" : "linear"} />
        )}
      </Paper>
      <Typography variant="bodyMedium">
        {picked === null
          ? "Tap or hover a month."
          : `Selected: ${CALLS[picked]?.label}`}
      </Typography>
    </VStack>
  );
};

const OUTCOMES = [
  { id: "answered", label: "Answered", value: 120 },
  { id: "missed", label: "Missed", value: 30 },
  { id: "busy", label: "Busy", value: 14 },
  { id: "voicemail", label: "Voicemail", value: 9 },
  { id: "dropped", label: "Dropped", value: 1 },
];

const TRENDS = [
  { name: "Answered", values: ANSWERED },
  { name: "Missed", values: MISSED },
];

const Tile = ({
  title,
  wide = false,
  children,
}: {
  title: string;
  /** Alone on its row: no width to share, so no basis (it would be a height in a column). */
  wide?: boolean;
  children: ReactNode;
}) => {
  const { theme } = useTheme();
  return (
    <Paper
      style={{
        ...(wide ? {} : { flexGrow: 1, flexBasis: 240 }),
        padding: 16,
        borderRadius: 12,
        gap: 8,
        backgroundColor: theme.colors.surfaceContainerLow,
      }}
    >
      <Typography variant="labelLarge">{title}</Typography>
      {children}
    </Paper>
  );
};

const PartsDemo = () => {
  const [pie, setPie] = useState(false);
  const [percent, setPercent] = useState(false);
  const [table, setTable] = useState(false);
  const [done, setDone] = useState(72);
  const Ring = pie ? PieChart : DonutChart;

  return (
    <VStack spacing={16}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        <Option label="Pie (no hole)" value={pie} onChange={setPie} />
        <Option
          label="Percent on slices"
          value={percent}
          onChange={setPercent}
        />
        <Option label="Table" value={table} onChange={setTable} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        <Tile title="Calls by outcome">
          <Ring
            testID="demo-donut"
            data={OUTCOMES}
            legend
            height={220}
            centerValue={(sum) => String(sum)}
            centerLabel="calls"
            showPercent={percent}
            table={table}
          />
        </Tile>
        <Tile title="A gauge: 72 of 100">
          <DonutChart
            testID="demo-gauge"
            data={[{ id: "done", label: "Done", value: done }]}
            total={100}
            height={220}
            centerValue={`${done}%`}
            centerLabel="target reached"
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              variant="outlined"
              onClick={() => setDone((d) => Math.max(0, d - 18))}
            >
              Less
            </Button>
            <Button
              variant="outlined"
              onClick={() => setDone((d) => Math.min(100, d + 18))}
            >
              More
            </Button>
          </View>
        </Tile>
      </View>
      <Tile wide title="Outcome share, in one bar">
        <StackedBar testID="demo-stack" data={OUTCOMES} legend />
      </Tile>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {TRENDS.map((t) => (
          <Tile key={t.name} title={t.name}>
            <Sparkline testID={`demo-spark-${t.name}`} values={t.values} area />
          </Tile>
        ))}
      </View>
    </VStack>
  );
};

// A sprint per team: points planned and committed (one column, overlapping), and how the committed ones ended (stacked).
const SPRINT: ChartDatum[] = [
  ["Design", 8, 6, 6, 0, 0],
  ["Mobile", 13, 10, 7, 2, 1],
  ["Web", 12, 12, 9, 3, 0],
  ["Backend", 20, 15, 15, 0, 0],
  ["Data", 5, 3, 2, 1, 0],
  ["Platform", 0, 0, 0, 0, 0],
  ["QA", 6, 6, 4, 0, 2],
  ["Support", 4, 4, 4, 0, 0],
].map(([label, planned, committed, done, review, blocked]) => ({
  label: label as string,
  planned,
  committed,
  done,
  review,
  blocked,
}));

/** Two columns per category, one overlapping and one stacked, a target and an outcome mark per category. */
const ColumnsDemo = () => {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Tile wide title="Sprint points by team">
      <BarChart
        testID="demo-columns"
        height={280}
        data={SPRINT}
        series={[
          {
            key: "planned",
            label: "Planned",
            column: "plan",
            color: c.primaryContainer,
          },
          {
            key: "committed",
            label: "Committed",
            column: "plan",
            color: c.primary,
          },
          { key: "done", label: "Done", column: "result", color: c.success },
          {
            key: "review",
            label: "In review",
            column: "result",
            color: c.secondary,
          },
          {
            key: "blocked",
            label: "Blocked",
            column: "result",
            color: c.error,
          },
        ]}
        columnMode={{ plan: "overlap" }}
        // The target of a team is what it committed to.
        target={(d) => (d.committed ? Number(d.committed) : null)}
        marker={(d, { totals, target }) =>
          !target
            ? null
            : d.blocked
              ? { icon: "close", color: c.error, label: "Work blocked" }
              : totals.result < target || d.review
                ? { icon: "check", color: c.warning, label: "Not finished yet" }
                : { icon: "check", color: c.success, label: "Commitment met" }
        }
        // Fewer than five points: too small a commitment to judge.
        dimmed={(d) => Number(d.committed) < 5}
        legend
        table
        title="Sprint points by team"
      />
    </Tile>
  );
};

// A trend, twelve swells over the range and noise: what a long series looks like, and what the dense mode folds.
const manyPoints = (n: number): ChartDatum[] =>
  Array.from({ length: n }, (_, i) => ({
    label: `${i + 1}`,
    value: Math.round(
      40 +
        (30 * i) / n +
        18 * Math.sin((24 * Math.PI * i) / n) +
        1.5 * ((i * 37) % 13) -
        9,
    ),
    other: Math.round(
      25 +
        (10 * i) / n +
        10 * Math.cos((16 * Math.PI * i) / n) +
        1.2 * ((i * 17) % 7) -
        4,
    ),
  }));

const MANY_SERIES = [
  { key: "value", label: "Value" },
  { key: "other", label: "Other" },
];

const MANY_COUNTS = [50, 400, 2000, 10000];

/** Thousands of bars or points: what the dense mode is for. */
const ManyDemo = () => {
  const { theme } = useTheme();
  const [count, setCount] = useState(2000);
  const [dense, setDense] = useState(true);
  const [kind, setKind] = useState<"bars" | "lines">("bars");
  const data = useMemo(() => manyPoints(count), [count]);

  return (
    <VStack spacing={16}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {MANY_COUNTS.map((n) => (
          <Button
            key={n}
            variant={count === n ? "filled" : "outlined"}
            onClick={() => setCount(n)}
          >
            {`${n} points`}
          </Button>
        ))}
        {(["bars", "lines"] as const).map((k) => (
          <Button
            key={k}
            variant={kind === k ? "filled" : "outlined"}
            onClick={() => setKind(k)}
          >
            {`many ${k}`}
          </Button>
        ))}
      </View>
      <Option label="Dense mode" value={dense} onChange={setDense} />
      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          backgroundColor: theme.colors.surfaceContainerLow,
        }}
      >
        {kind === "bars" ? (
          <BarChart
            testID="demo-many"
            data={data}
            series={MANY_SERIES}
            dense={dense}
            legend
          />
        ) : (
          <LineChart
            testID="demo-many"
            data={data}
            series={MANY_SERIES}
            dense={dense}
            legend
          />
        )}
      </Paper>
    </VStack>
  );
};

export default function ChartsPage() {
  return (
    <Page
      eyebrow="Companion package"
      title="Charts"
      description="@its/glowup-charts draws charts with react-native-svg and a copy of d3's scales and shapes, with no dependency of its own. Bars, lines, areas, donuts, a stacked bar and sparklines exist so far. This page is not published yet."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message="Checked in a browser, and on the iPhone simulator and the Android emulators in CI. Series colours come from the theme's chart palette (theme.charts), in order."
        />
      }
    >
      <Section
        title="Live"
        description="Bars (grouped or stacked, vertical or horizontal), lines and areas (straight or smooth), a target line, a legend that switches a series off, a tooltip on tap or hover, and the loading and empty states."
      >
        <Demo />
      </Section>
      <Section
        title="Parts of a whole"
        description="A donut or a pie, a gauge (a donut with a total bigger than its part), a single stacked bar and sparklines. Tap or point at a slice to read it."
      >
        <PartsDemo />
      </Section>
      <Section
        title="Columns, targets and outcomes"
        description="Series that share a column make one bar of the category: stacked, or overlapping from zero with the longest behind. A target per category draws a short line across it, an outcome mark sits past its longest bar, and a category can be dimmed. Target and outcome are read in the tooltip, the table and the text for a screen reader."
      >
        <ColumnsDemo />
      </Section>
      <Section
        title="Thousands of points"
        description="Past a few hundred bars a chart draws one path per series and one touch layer instead of a node per bar, and past about one point per two pixels it folds the points that share a column into their mean with a faint strip from lowest to highest. The tooltip still reads the exact point. Switch it off to see the difference."
      >
        <ManyDemo />
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

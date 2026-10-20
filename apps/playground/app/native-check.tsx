// The native verification screen, for CI only (.github/workflows/native.yml): a
// build made with EXPO_PUBLIC_NATIVE_CHECK_ROUTE=/native-check opens it after
// launch (see NativeCheckTrigger in _layout.tsx). Nothing links here.
//
//  - "Measurements" are laid out on the device and compared, so they catch what
//    jest cannot: the real height difference between normal and dense controls.
//    Read them from the iOS screenshot, or the `NATIVECHECK` lines in logcat.
//  - "Interaction" is driven on Android with `adb` (scripts/android-interact.mjs):
//    it types, taps and reads the `STATE` lines below. iOS has no equivalent from
//    CI, so there the screen is only measured and photographed.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from "react-native";
import {
  BottomSheet,
  Button,
  DrawerItem,
  Input,
  NavigationDrawer,
  Select,
  Tabs,
  useTheme,
} from "@its/glowup-ui";
import { isPdfError, usePdfAdapters } from "@its/glowup-pdf";

import { SAMPLE_PDF_PAGES, samplePdf } from "../site/samplePdf";

type Sizes = Record<string, number>;
type Row = [name: string, ok: boolean | null, detail: string];

const noop = () => {};
const OPTIONS = [{ id: "1", label: "Uno", value: 1 }];

const PDF_WIDTH = 600;
const PDF_OPEN = "pdf opens and reports its pages";
const PDF_DRAW = "pdf page is drawn at the width asked";
const PDF_SEARCH = "pdf search finds a known word";
const PDF_REFUSE = "pdf refuses a file that is not a PDF";

/**
 * The PDF module on the device, on the playground's sample: open it, draw the first page,
 * search "hello" (on pages 1 and 2), and open something that is not a PDF. The drawn page is
 * shown below the rows so a screenshot proves it, and its real pixel width is read from the
 * image once it has loaded.
 */
const usePdfChecks = () => {
  const pdf = usePdfAdapters();
  const [rows, setRows] = useState<Record<string, [boolean | null, string]>>(
    {},
  );
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let uri: string | null = null;
    const set = (name: string, ok: boolean | null, detail: string) => {
      if (alive) setRows((prev) => ({ ...prev, [name]: [ok, detail] }));
    };
    const failure = (error: unknown) =>
      `${isPdfError(error) ? `${error.code}: ` : ""}${error instanceof Error ? error.message : String(error)}`;

    void (async () => {
      try {
        uri = await pdf.files.write(samplePdf());
        const { pages } = await pdf.native.open(uri);
        const first = pages[0];
        set(
          PDF_OPEN,
          pages.length === SAMPLE_PDF_PAGES,
          `${pages.length} pages, first ${Math.round(first?.width ?? 0)} x ${Math.round(first?.height ?? 0)}`,
        );
        const drawn = await pdf.native.renderPage(uri, 0, PDF_WIDTH);
        if (alive) setImage(drawn);
        // The file's own size, read from its header: the image view's load event reports what the
        // platform decoded for a 90-point box, not the 600 pixels written.
        Image.getSize(
          drawn,
          (width, height) =>
            set(PDF_DRAW, width === PDF_WIDTH, `${width} x ${height} pixels`),
          (error) => set(PDF_DRAW, false, failure(error)),
        );
      } catch (error) {
        set(PDF_OPEN, false, failure(error));
        return;
      }
      try {
        const caps = await pdf.native.capabilities();
        if (!caps.search) {
          set(
            PDF_SEARCH,
            null,
            `search is off on this device (${Platform.OS} ${Platform.Version})`,
          );
        } else {
          const hits = await pdf.native.search(uri, "hello");
          const found = hits.map((hit) => hit.page).join(",");
          const inside = hits.every((hit) =>
            hit.rects.every(
              (r) =>
                r.width > 0 &&
                r.height > 0 &&
                r.x >= 0 &&
                r.y >= 0 &&
                r.x + r.width <= 1.001 &&
                r.y + r.height <= 1.001,
            ),
          );
          // "hello" on page 1 is the second line, 720 points up a page 842 high: 0.12 to 0.14 from
          // the top. A rectangle measured from the bottom, or in points, would not land there.
          const top = hits[0]?.rects[0]?.y ?? -1;
          const fromTop = top > 0.05 && top < 0.25;
          set(
            PDF_SEARCH,
            found === "0,1" && inside && fromTop,
            `pages ${found || "none"}, rectangles ${inside ? "inside" : "outside"} the page, first ${fromTop ? "near" : "not near"} the top (y=${top.toFixed(2)})`,
          );
        }
      } catch (error) {
        set(PDF_SEARCH, false, failure(error));
      }
      let junk: string | null = null;
      try {
        junk = await pdf.files.write(
          Uint8Array.from("not a pdf", (c) => c.charCodeAt(0)),
        );
        await pdf.native.open(junk);
        set(PDF_REFUSE, false, "it was opened");
      } catch (error) {
        set(
          PDF_REFUSE,
          isPdfError(error) && error.code === "format",
          failure(error),
        );
      } finally {
        if (junk) void pdf.files.remove(junk);
      }
    })();

    return () => {
      alive = false;
      if (uri) {
        void pdf.native.close(uri).catch(() => {});
        void pdf.files.remove(uri);
      }
    };
  }, [pdf]);

  const checks = useMemo<Row[]>(
    () =>
      [PDF_OPEN, PDF_DRAW, PDF_SEARCH, PDF_REFUSE].map((name) => [
        name,
        ...(rows[name] ?? [null, "not measured yet"]),
      ]),
    [rows],
  );
  return { checks, image };
};

/** Reports the height and width of what it wraps, once laid out. */
const Measured = ({
  id,
  onSize,
  children,
}: {
  id: string;
  onSize: (id: string, size: { h: number; w: number }) => void;
  children: React.ReactNode;
}) => (
  <View
    onLayout={(e: LayoutChangeEvent) =>
      onSize(id, {
        h: e.nativeEvent.layout.height,
        w: e.nativeEvent.layout.width,
      })
    }
    style={{ alignSelf: "flex-start" }}
  >
    {children}
  </View>
);

export default function NativeCheck() {
  const { theme } = useTheme();
  const [h, setH] = useState<Sizes>({});
  const [w, setW] = useState<Sizes>({});
  const onSize = useCallback((id: string, size: { h: number; w: number }) => {
    setH((prev) => ({ ...prev, [id]: Math.round(size.h) }));
    setW((prev) => ({ ...prev, [id]: Math.round(size.w) }));
  }, []);

  const [amount, setAmount] = useState("");
  const [plain, setPlain] = useState("");
  const [name, setName] = useState("");
  const [filters, setFilters] = useState(0);
  const [tab, setTab] = useState("overview");
  const [sheet, setSheet] = useState(false);

  // Each check compares a difference, not an absolute size: line heights differ
  // between platforms, the padding the props add does not.
  const pdf = usePdfChecks();
  const measured = useMemo<Row[]>(
    () => [
      check("input dense is 24 shorter", h.inputNormal, h.inputDense, 24),
      check("button dense is 12 shorter", h.buttonNormal, h.buttonDense, 12),
      check("select dense is 20 shorter", h.selectNormal, h.selectDense, 20),
      [
        "button badge adds width",
        w.badgeOn == null || w.badgeOff == null
          ? null
          : w.badgeOn - w.badgeOff >= 12,
        `${w.badgeOff} -> ${w.badgeOn}`,
      ],
    ],
    [h, w],
  );
  const checks = useMemo<Row[]>(
    () => [...measured, ...pdf.checks],
    [measured, pdf.checks],
  );
  // One line per check for logcat; on iOS the log carries no console output, so
  // the same lines are drawn on screen below.
  useEffect(() => {
    checks.forEach(([name, ok, detail]) =>
      console.log(
        `NATIVECHECK ${name}: ${ok == null ? "PENDING" : ok ? "PASS" : "FAIL"} (${detail})`,
      ),
    );
  }, [checks]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      {/* Outside the scroll view, so it stays reachable with the keyboard up: the Android script
          taps it after typing (Enter does not close the keyboard of a number field). */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Hide keyboard"
        onPress={Keyboard.dismiss}
        style={{ paddingHorizontal: 16, paddingVertical: 6 }}
      >
        <Text style={{ color: theme.colors.primary }}>Hide keyboard</Text>
      </Pressable>
      <ScrollView
        // A tap on a field inside a ScrollView that keeps the default ("never") closes the keyboard
        // as it opens: the Android run showed the hide request 45 ms after the show.
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        <Text
          style={[
            theme.typography.titleLarge,
            { color: theme.colors.onSurface },
          ]}
        >
          Native check
        </Text>

        <Text style={{ color: theme.colors.onSurfaceVariant }}>
          Measurements
        </Text>
        {checks.map(([name, ok, detail]) => (
          <Text
            key={name}
            style={{
              color:
                ok == null
                  ? theme.colors.onSurfaceVariant
                  : ok
                    ? theme.colors.success
                    : theme.colors.error,
            }}
          >
            {`${ok == null ? "PENDING" : ok ? "PASS" : "FAIL"} ${name} (${detail})`}
          </Text>
        ))}

        {pdf.image ? (
          <Image
            source={{ uri: pdf.image }}
            accessibilityLabel="Sample PDF page"
            style={{ width: 90, height: 127, backgroundColor: "#fff" }}
          />
        ) : null}

        <Text style={{ color: theme.colors.onSurfaceVariant }}>
          Interaction
        </Text>

        <Input
          label="Amount"
          type="number"
          decimalSeparator=","
          precision={2}
          value={amount}
          onChangeText={setAmount}
        />
        <Text
          style={{ color: theme.colors.onSurface }}
        >{`reported=${amount}`}</Text>

        {/* A control for the Amount field: the library's Input is not involved, so if this one takes
          keys and Amount does not, the fault is in the Input and not in the emulator. */}
        <TextInput
          accessibilityLabel="Plain field"
          keyboardType="decimal-pad"
          value={plain}
          onChangeText={setPlain}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.outline,
            borderRadius: 4,
            padding: 8,
            color: theme.colors.onSurface,
          }}
        />
        <Text
          style={{ color: theme.colors.onSurface }}
        >{`plain=${plain}`}</Text>

        {/* The library's Input with nothing special set: tells a fault of every Input from one of the number type. */}
        <Input label="Name" value={name} onChangeText={setName} />
        <Text style={{ color: theme.colors.onSurface }}>{`name=${name}`}</Text>

        <View style={{ flexDirection: "row" }}>
          <Button
            mode="outlined"
            iconName="filter-outline"
            badge={filters}
            onPress={() => setFilters((n) => n + 1)}
          >
            Filters
          </Button>
        </View>
        <Text
          style={{ color: theme.colors.onSurface }}
        >{`badge=${filters}`}</Text>

        <Tabs
          tabs={[
            { label: "Overview", key: "overview" },
            { label: "Billing", key: "billing" },
            { label: "Audit", key: "audit", disabled: true },
          ]}
          activeKey={tab}
          onChange={(_, key) => setTab(key ?? "")}
        />
        <Text style={{ color: theme.colors.onSurface }}>{`tab=${tab}`}</Text>

        {/* A row, so the drawer stretches to this height: its body is `flex: 1`, and in a column
          of auto height it collapses to nothing on iOS and Android (not on the web). */}
        <View style={{ height: 280, flexDirection: "row" }}>
          <NavigationDrawer width={280}>
            <DrawerItem label="Reports" icon="chart-box-outline">
              <DrawerItem label="Sales" onPress={noop} />
            </DrawerItem>
            {/* Open from the start, so it never animates: if "Old" shows and "Sales" does not,
              it is the opening animation that fails, not the layout. */}
            <DrawerItem label="Archive" icon="archive-outline" defaultExpanded>
              <DrawerItem label="Old" onPress={noop} />
            </DrawerItem>
          </NavigationDrawer>
        </View>

        <View style={{ flexDirection: "row" }}>
          <Button mode="tonal" onPress={() => setSheet(true)}>
            Open sheet
          </Button>
        </View>
        <Text
          style={{ color: theme.colors.onSurface }}
        >{`sheet=${sheet ? "open" : "closed"}`}</Text>
        <BottomSheet
          visible={sheet}
          onDismiss={() => setSheet(false)}
          title="Filters"
          showCloseButton
          actions={<Button onPress={() => setSheet(false)}>Apply</Button>}
        >
          <Text style={{ color: theme.colors.onSurface }}>Sheet content</Text>
        </BottomSheet>

        {/* Laid out only to be measured. */}
        <View style={{ width: 280 }}>
          <Measured id="inputNormal" onSize={onSize}>
            <Input label="Normal" value="" onChangeText={noop} />
          </Measured>
          <Measured id="inputDense" onSize={onSize}>
            <Input label="Dense" density="dense" value="" onChangeText={noop} />
          </Measured>
          <Measured id="buttonNormal" onSize={onSize}>
            <Button>Normal</Button>
          </Measured>
          <Measured id="buttonDense" onSize={onSize}>
            <Button density="dense">Dense</Button>
          </Measured>
          <Measured id="selectNormal" onSize={onSize}>
            <Select options={OPTIONS} value={1} onSelect={noop} />
          </Measured>
          <Measured id="selectDense" onSize={onSize}>
            <Select
              options={OPTIONS}
              value={1}
              onSelect={noop}
              density="dense"
            />
          </Measured>
          <Measured id="badgeOff" onSize={onSize}>
            <Button>Filters</Button>
          </Measured>
          <Measured id="badgeOn" onSize={onSize}>
            <Button badge={3}>Filters</Button>
          </Measured>
        </View>
      </ScrollView>
    </View>
  );
}

/** `normal - dense` should equal `expected`, give or take 2. */
function check(
  name: string,
  normal: number | undefined,
  dense: number | undefined,
  expected: number,
): [string, boolean | null, string] {
  if (normal == null || dense == null) return [name, null, "not measured yet"];
  const delta = normal - dense;
  return [
    name,
    Math.abs(delta - expected) <= 2,
    `${normal} -> ${dense}, Δ=${delta}, expected ${expected}`,
  ];
}

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
import { ScrollView, Text, View, type LayoutChangeEvent } from "react-native";
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

type Sizes = Record<string, number>;

const noop = () => {};
const OPTIONS = [{ id: "1", label: "Uno", value: 1 }];

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
  const [filters, setFilters] = useState(0);
  const [tab, setTab] = useState("overview");
  const [sheet, setSheet] = useState(false);

  // Each check compares a difference, not an absolute size: line heights differ
  // between platforms, the padding the props add does not.
  const checks = useMemo<[name: string, ok: boolean | null, detail: string][]>(
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
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <Text
        style={[theme.typography.titleLarge, { color: theme.colors.onSurface }]}
      >
        Native check
      </Text>

      <Text style={{ color: theme.colors.onSurfaceVariant }}>Measurements</Text>
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

      <Text style={{ color: theme.colors.onSurfaceVariant }}>Interaction</Text>

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
      <View style={{ height: 200, flexDirection: "row" }}>
        <NavigationDrawer width={280}>
          <DrawerItem label="Reports" icon="chart-box-outline">
            <DrawerItem label="Sales" onPress={noop} />
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
          <Select options={OPTIONS} value={1} onSelect={noop} density="dense" />
        </Measured>
        <Measured id="badgeOff" onSize={onSize}>
          <Button>Filters</Button>
        </Measured>
        <Measured id="badgeOn" onSize={onSize}>
          <Button badge={3}>Filters</Button>
        </Measured>
      </View>
    </ScrollView>
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

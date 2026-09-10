import { useState } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Animated,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  useTheme,
  Typography,
  Input,
  Select,
  Toggle,
  NumericInput,
  SearchBar,
} from "@glowup/ui";

// The catalogue itself — entries, grouping and the stage renderer — lives in
// ../catalogue; this screen is only the shell around it.
import ComponentPreview from "../catalogue/ComponentPreview";
import { ComponentRegistry } from "../catalogue/registry";
import {
  CATEGORIES,
  CATEGORY_OF,
  FLAT_ORDER,
  TOTAL_COUNT,
} from "../catalogue/categories";
import type { PropDefinition } from "../catalogue/types";

/**
 * The presentation app's main screen: the shell around the catalogue. It owns
 * the navigation state (category, search, selection), the properties panel and
 * the stage chrome; the catalogue entries, their grouping and the stage
 * renderer live in ../catalogue.
 */
const Playground = () => {
  const { theme, toggleTheme } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const [query, setQuery] = useState("");
  const [enterAnim] = useState(() => new Animated.Value(1));
  const [selectedComponentName, setSelectedComponentName] =
    useState<string>("Button");

  // Dynamically initialize state for the selected component's props
  const [componentProps, setComponentProps] = useState<Record<string, any>>(
    () => {
      const meta = ComponentRegistry["Button"];
      const initial: Record<string, any> = {};
      Object.keys(meta.props).forEach((key) => {
        initial[key] = meta.props[key].default;
      });
      return initial;
    },
  );

  const activeMeta = ComponentRegistry[selectedComponentName];

  const handleComponentChange = (name: any) => {
    if (name === selectedComponentName) return;
    setSelectedComponentName(name);
    const meta = ComponentRegistry[name];
    const initial: Record<string, any> = {};
    Object.keys(meta.props).forEach((key) => {
      initial[key] = meta.props[key].default;
    });
    setComponentProps(initial);

    // Re-play the stage entrance on every switch.
    enterAnim.setValue(0);
    Animated.spring(enterAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 11,
    }).start();
  };

  const updateProp = (key: string, value: any) => {
    setComponentProps((prev) => ({ ...prev, [key]: value }));
  };

  const renderPropEditor = (key: string, def: PropDefinition) => {
    const val = componentProps[key];

    switch (def.type) {
      case "text":
        return (
          <Input
            key={key}
            label={def.label}
            value={val?.toString() || ""}
            onChangeText={(t) => updateProp(key, t)}
            style={styles.propInput}
          />
        );
      case "number":
        return (
          <NumericInput
            key={key}
            label={def.label}
            value={val?.toString() || "0"}
            onChangeText={(t) => updateProp(key, t)}
            style={styles.propInput}
          />
        );
      case "boolean":
        return (
          <View key={key} style={styles.propRow}>
            <Typography variant="bodyMedium">{def.label}</Typography>
            <Toggle value={!!val} onValueChange={(v) => updateProp(key, v)} />
          </View>
        );
      case "select":
        return (
          <Select
            key={key}
            label={def.label}
            options={
              def.options?.map((o, i) => ({ id: i.toString(), ...o })) || []
            }
            value={val}
            onSelect={(v) => updateProp(key, v)}
            style={styles.propInput}
          />
        );
      default:
        return null;
    }
  };

  // --- Derived navigation state ---
  const [navCat, setNavCat] = useState<string>("All");
  const q = query.trim().toLowerCase();
  const matches = (n: string) => n.toLowerCase().includes(q);
  const activeCategory = CATEGORY_OF[selectedComponentName];
  const activeIndex = FLAT_ORDER.indexOf(selectedComponentName) + 1;
  const propKeys = Object.keys(activeMeta.props);
  const navPillItems = FLAT_ORDER.filter(matches).filter(
    (n) => navCat === "All" || CATEGORY_OF[n] === navCat,
  );

  const stageAnimStyle = {
    opacity: enterAnim,
    transform: [
      {
        translateY: enterAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
      {
        scale: enterAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.985, 1],
        }),
      },
    ],
  };

  // --- Small render helpers ---
  const renderNavRow = (name: string) => {
    const active = name === selectedComponentName;
    return (
      <Pressable
        key={name}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => handleComponentChange(name)}
        style={({ hovered }: any) => [
          styles.navItem,
          hovered && { backgroundColor: theme.colors.surfaceContainerHigh },
          active && { backgroundColor: theme.colors.secondaryContainer },
        ]}
      >
        <View
          style={[
            styles.navAccent,
            {
              backgroundColor: active ? theme.colors.primary : "transparent",
            },
          ]}
        />
        <Typography
          variant="bodyMedium"
          style={{
            color: active
              ? theme.colors.onSecondaryContainer
              : theme.colors.onSurfaceVariant,
            fontWeight: active ? "700" : "400",
          }}
        >
          {name}
        </Typography>
      </Pressable>
    );
  };

  const renderPill = (name: string) => {
    const active = name === selectedComponentName;
    return (
      <Pressable
        key={name}
        onPress={() => handleComponentChange(name)}
        style={({ hovered }: any) => [
          styles.pill,
          {
            borderColor: active
              ? theme.colors.primary
              : theme.colors.outlineVariant,
            backgroundColor: active
              ? theme.colors.secondaryContainer
              : hovered
                ? theme.colors.surfaceContainerHigh
                : "transparent",
          },
        ]}
      >
        <Typography
          variant="labelLarge"
          style={{
            color: active
              ? theme.colors.onSecondaryContainer
              : theme.colors.onSurface,
          }}
        >
          {name}
        </Typography>
      </Pressable>
    );
  };

  const renderCatChip = (label: string, icon?: string) => {
    const active = navCat === label;
    return (
      <Pressable
        key={label}
        onPress={() => setNavCat(label)}
        style={({ hovered }: any) => [
          styles.catChip,
          {
            backgroundColor: active
              ? theme.colors.primary
              : hovered
                ? theme.colors.surfaceContainerHigh
                : theme.colors.surfaceContainer,
          },
        ]}
      >
        {icon && (
          <Icons
            name={icon as any}
            size={14}
            color={
              active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
            }
          />
        )}
        <Typography
          variant="labelMedium"
          style={{
            color: active
              ? theme.colors.onPrimary
              : theme.colors.onSurfaceVariant,
            marginLeft: icon ? 6 : 0,
          }}
        >
          {label}
        </Typography>
      </Pressable>
    );
  };

  const eyebrow = (text: string, color: string) => (
    <Typography variant="labelSmall" style={[styles.eyebrow, { color }]}>
      {text}
    </Typography>
  );

  const stage = (
    <View style={styles.stageCol}>
      <View style={styles.stageHeader}>
        {eyebrow(
          `${(activeCategory || "").toUpperCase()} · ${String(activeIndex).padStart(2, "0")} / ${TOTAL_COUNT}`,
          theme.colors.primary,
        )}
        <Typography
          variant="headlineMedium"
          style={{ color: theme.colors.onSurface }}
        >
          {selectedComponentName}
        </Typography>
      </View>
      <View
        style={[
          styles.stage,
          {
            backgroundColor: theme.colors.surfaceContainerLow,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View
          style={[
            styles.corner,
            styles.cornerTL,
            { borderColor: theme.colors.outline },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.cornerTR,
            { borderColor: theme.colors.outline },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.cornerBL,
            { borderColor: theme.colors.outline },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.cornerBR,
            { borderColor: theme.colors.outline },
          ]}
        />
        <Animated.View style={[styles.stageInner, stageAnimStyle]}>
          <ComponentPreview
            selectedComponentName={selectedComponentName}
            activeMeta={activeMeta}
            componentProps={componentProps}
            updateProp={updateProp}
          />
        </Animated.View>
      </View>
    </View>
  );

  const propsPanel = (
    <>
      <View
        style={[
          styles.propsHeader,
          { borderBottomColor: theme.colors.outlineVariant },
        ]}
      >
        {eyebrow("PROPERTIES", theme.colors.onSurfaceVariant)}
        <Typography
          variant="labelSmall"
          style={{ color: theme.colors.outline }}
        >
          {propKeys.length} {propKeys.length === 1 ? "prop" : "props"}
        </Typography>
      </View>
      {propKeys.length === 0 ? (
        <Typography
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          No configurable props.
        </Typography>
      ) : (
        propKeys.map((key) => renderPropEditor(key, activeMeta.props[key]))
      )}
    </>
  );

  const header = (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View>
        {eyebrow("MATERIAL YOU", theme.colors.primary)}
        <Typography
          variant="titleLarge"
          style={{ color: theme.colors.onSurface, letterSpacing: 0.5 }}
        >
          Component Gallery
        </Typography>
      </View>
      <View style={styles.headerRight}>
        <View
          style={[
            styles.countChip,
            { borderColor: theme.colors.outlineVariant },
          ]}
        >
          <Typography
            variant="labelMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {TOTAL_COUNT} components
          </Typography>
        </View>
        <Pressable
          onPress={toggleTheme}
          accessibilityRole="button"
          accessibilityLabel="Toggle theme"
          style={({ hovered }: any) => [
            styles.themeBtn,
            { backgroundColor: theme.colors.secondaryContainer },
            hovered && { opacity: 0.85 },
          ]}
        >
          <Icons
            name={theme.isDark ? "weather-sunny" : "weather-night"}
            size={20}
            color={theme.colors.onSecondaryContainer}
          />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      {header}

      {isWide ? (
        <View style={styles.wideBody}>
          {/* Sidebar navigator */}
          <View
            style={[
              styles.sidebar,
              {
                backgroundColor: theme.colors.surface,
                borderRightColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.sidebarHeader}>
              {eyebrow("CATALOG", theme.colors.onSurfaceVariant)}
            </View>
            <View style={styles.searchWrap}>
              <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder="Filter components…"
              />
            </View>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {CATEGORIES.map((cat) => {
                const items = cat.items.filter(matches);
                if (!items.length) return null;
                return (
                  <View key={cat.label} style={styles.navGroup}>
                    <View style={styles.navGroupHeader}>
                      <Icons
                        name={cat.icon as any}
                        size={14}
                        color={theme.colors.primary}
                      />
                      <Typography
                        variant="labelSmall"
                        style={[
                          styles.navGroupLabel,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {cat.label.toUpperCase()}
                      </Typography>
                      <Typography
                        variant="labelSmall"
                        style={{ color: theme.colors.outline }}
                      >
                        {items.length}
                      </Typography>
                    </View>
                    {items.map(renderNavRow)}
                  </View>
                );
              })}
              {navPillItems.length === 0 && (
                <Typography
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, padding: 16 }}
                >
                  No matches for “{query}”.
                </Typography>
              )}
            </ScrollView>
          </View>

          {/* Stage */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.stageScroll}
            showsVerticalScrollIndicator={false}
          >
            {stage}
          </ScrollView>

          {/* Properties */}
          <View
            style={[
              styles.propsColWide,
              { borderLeftColor: theme.colors.outlineVariant },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
            >
              {propsPanel}
            </ScrollView>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.narrowBody}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Filter components…"
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            {renderCatChip("All")}
            {CATEGORIES.map((c) => renderCatChip(c.label, c.icon))}
          </ScrollView>
          <View style={styles.pillWrap}>{navPillItems.map(renderPill)}</View>
          {stage}
          <View style={{ marginTop: 8 }}>{propsPanel}</View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  // Header band
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  countChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontWeight: "700",
  },

  // Wide 3-pane body
  wideBody: { flex: 1, flexDirection: "row" },

  // Sidebar
  sidebar: { width: 264, borderRightWidth: 1, paddingTop: 12 },
  sidebarHeader: { paddingHorizontal: 20, paddingBottom: 8 },
  searchWrap: { paddingHorizontal: 12 },
  navGroup: { marginTop: 10, paddingHorizontal: 8 },
  navGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  navGroupLabel: { flex: 1, letterSpacing: 1.2, fontWeight: "700" },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 2,
    overflow: "hidden",
  },
  navAccent: { width: 3, height: 16, borderRadius: 2, marginRight: 10 },

  // Stage
  stageScroll: { flexGrow: 1, padding: 28 },
  stageCol: { width: "100%", maxWidth: 760, alignSelf: "center" },
  stageHeader: { marginBottom: 18, gap: 2 },
  stage: {
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 340,
    padding: 36,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  stageInner: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  corner: { position: "absolute", width: 14, height: 14, opacity: 0.5 },
  cornerTL: { top: 12, left: 12, borderTopWidth: 1, borderLeftWidth: 1 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 1, borderRightWidth: 1 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 1, borderLeftWidth: 1 },
  cornerBR: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },

  // Properties
  propsColWide: {
    width: 328,
    borderLeftWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  propsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  propInput: { marginBottom: 16 },
  propRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  // Narrow (stacked) body
  narrowBody: { padding: 16, paddingBottom: 140, gap: 14 },
  catRow: { gap: 8, paddingVertical: 2, paddingRight: 16 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});

export default Playground;

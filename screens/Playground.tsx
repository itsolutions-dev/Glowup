import React, { useState, useMemo } from "react";
import { ScrollView, View, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../providers/ThemeProvider";

// Components
import Typography from "../components/Typography";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import Checkbox from "../components/Checkbox";
import Toggle from "../components/Toggle";
import Chip from "../components/Chip";
import Badge from "../components/Badge";
import Avatar from "../components/Avatar";
import Card from "../components/Card";
import Divider from "../components/Divider";
import Spinner from "../components/Spinner";
import NumericInput from "../components/NumericInput";
import AppBar from "../components/AppBar";
import DataGrid from "../components/DataGrid";
import { RadioGroup } from "../components/RadioButton";
import Slider from "../components/Slider";
import Tooltip from "../components/Tooltip";
import Menu from "../components/Menu";
import BottomSheet from "../components/BottomSheet";
import NavigationBar from "../components/NavigationBar";
import Skeleton from "../components/Skeleton";
import SearchBar from "../components/SearchBar";
import Banner from "../components/Banner";
import Breadcrumbs from "../components/Breadcrumbs";
import Pagination from "../components/Pagination";
import Rating from "../components/Rating";
import EmptyState from "../components/EmptyState";
import Carousel from "../components/Carousel";

// Types for Registry
type PropType = "text" | "number" | "boolean" | "select" | "node";

interface PropDefinition {
  type: PropType;
  default: any;
  options?: { label: string; value: any }[];
  label: string;
}

interface ComponentMetadata {
  name: string;
  Component: any;
  props: Record<string, PropDefinition>;
  isContainer?: boolean;
}

const ComponentRegistry: Record<string, ComponentMetadata> = {
  Button: {
    name: "Button",
    Component: Button,
    props: {
      children: { type: "text", default: "Click Me", label: "Label" },
      mode: {
        type: "select",
        default: "filled",
        label: "Mode",
        options: [
          { label: "Filled", value: "filled" },
          { label: "Tonal", value: "tonal" },
          { label: "Outlined", value: "outlined" },
        ],
      },
      iconName: { type: "text", default: "plus", label: "Icon Name" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
      loading: { type: "boolean", default: false, label: "Loading" },
    },
  },
  Input: {
    name: "Input",
    Component: Input,
    props: {
      label: { type: "text", default: "User Name", label: "Label" },
      placeholder: {
        type: "text",
        default: "Enter name...",
        label: "Placeholder",
      },
      value: { type: "text", default: "", label: "Value" },
      error: { type: "text", default: "", label: "Error Message" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Chip: {
    name: "Chip",
    Component: Chip,
    props: {
      label: { type: "text", default: "React Native", label: "Label" },
      selected: { type: "boolean", default: false, label: "Selected" },
      mode: {
        type: "select",
        default: "filled",
        label: "Mode",
        options: [
          { label: "Filled", value: "filled" },
          { label: "Tonal", value: "tonal" },
          { label: "Outlined", value: "outlined" },
        ],
      },
    },
  },
  Avatar: {
    name: "Avatar",
    Component: Avatar,
    props: {
      name: { type: "text", default: "Glowup User", label: "Name" },
      size: { type: "number", default: 48, label: "Size" },
      status: {
        type: "select",
        default: undefined,
        label: "Status",
        options: [
          { label: "None", value: undefined },
          { label: "Online", value: "online" },
          { label: "Offline", value: "offline" },
          { label: "Busy", value: "busy" },
          { label: "Away", value: "away" },
        ],
      },
      icon: { type: "text", default: "", label: "Icon Override" },
    },
  },
  Badge: {
    name: "Badge",
    Component: Badge,
    props: {
      count: { type: "number", default: 5, label: "Count" },
      maxCount: { type: "number", default: 99, label: "Max Count" },
      showZero: { type: "boolean", default: false, label: "Show Zero" },
      dot: { type: "boolean", default: false, label: "Dot Mode" },
    },
  },
  Card: {
    name: "Card",
    Component: Card,
    isContainer: true,
    props: {
      variant: {
        type: "select",
        default: "filled",
        label: "Variant",
        options: [
          { label: "Filled", value: "filled" },
          { label: "Outlined", value: "outlined" },
          { label: "Glow", value: "glow" },
        ],
      },
      children: {
        type: "text",
        default: "This is a card content",
        label: "Content",
      },
    },
  },
  Spinner: {
    name: "Spinner",
    Component: Spinner,
    props: {
      label: { type: "text", default: "Loading...", label: "Label" },
      value: { type: "number", default: 10, label: "Value" },
      min: { type: "number", default: 0, label: "Min" },
      max: { type: "number", default: 100, label: "Max" },
    },
  },
  DataGrid: {
    name: "DataGrid",
    Component: DataGrid,
    props: {
      density: {
        type: "select",
        default: "normal",
        label: "Density",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Dense", value: "dense" },
        ],
      },
      loading: { type: "boolean", default: false, label: "Loading" },
    },
  },
  RadioGroup: {
    name: "RadioGroup",
    Component: RadioGroup,
    props: {
      label: { type: "text", default: "Choose one", label: "Label" },
      value: { type: "text", default: "a", label: "Value" },
      direction: {
        type: "select",
        default: "column",
        label: "Direction",
        options: [
          { label: "Column", value: "column" },
          { label: "Row", value: "row" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
      error: { type: "text", default: "", label: "Error Message" },
    },
  },
  Slider: {
    name: "Slider",
    Component: Slider,
    props: {
      value: { type: "number", default: 40, label: "Value" },
      min: { type: "number", default: 0, label: "Min" },
      max: { type: "number", default: 100, label: "Max" },
      step: { type: "number", default: 0, label: "Step (0 = off)" },
      label: { type: "text", default: "Volume", label: "Label" },
      showValueLabel: {
        type: "boolean",
        default: true,
        label: "Show Value",
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Tooltip: {
    name: "Tooltip",
    Component: Tooltip,
    props: {
      content: {
        type: "text",
        default: "Helpful hint",
        label: "Content",
      },
      position: {
        type: "select",
        default: "top",
        label: "Position",
        options: [
          { label: "Top", value: "top" },
          { label: "Bottom", value: "bottom" },
        ],
      },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Menu: {
    name: "Menu",
    Component: Menu,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      closeOnSelect: {
        type: "boolean",
        default: true,
        label: "Close On Select",
      },
    },
  },
  BottomSheet: {
    name: "BottomSheet",
    Component: BottomSheet,
    props: {
      visible: { type: "boolean", default: false, label: "Visible" },
      title: { type: "text", default: "Sheet Title", label: "Title" },
      showHandle: { type: "boolean", default: true, label: "Show Handle" },
      dismissOnScrimTap: {
        type: "boolean",
        default: true,
        label: "Dismiss On Scrim Tap",
      },
    },
  },
  NavigationBar: {
    name: "NavigationBar",
    Component: NavigationBar,
    props: {
      activeId: { type: "text", default: "home", label: "Active Id" },
      showLabels: {
        type: "select",
        default: "always",
        label: "Show Labels",
        options: [
          { label: "Always", value: "always" },
          { label: "Selected", value: "selected" },
        ],
      },
    },
  },
  Skeleton: {
    name: "Skeleton",
    Component: Skeleton,
    props: {
      variant: {
        type: "select",
        default: "rect",
        label: "Variant",
        options: [
          { label: "Rect", value: "rect" },
          { label: "Circle", value: "circle" },
          { label: "Text", value: "text" },
        ],
      },
      width: { type: "number", default: 200, label: "Width" },
      height: { type: "number", default: 48, label: "Height" },
      duration: { type: "number", default: 1200, label: "Duration (ms)" },
    },
  },
  SearchBar: {
    name: "SearchBar",
    Component: SearchBar,
    props: {
      value: { type: "text", default: "", label: "Value" },
      placeholder: { type: "text", default: "Search", label: "Placeholder" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Banner: {
    name: "Banner",
    Component: Banner,
    props: {
      visible: { type: "boolean", default: true, label: "Visible" },
      message: {
        type: "text",
        default: "Your subscription is about to expire.",
        label: "Message",
      },
      type: {
        type: "select",
        default: "default",
        label: "Type",
        options: [
          { label: "Default", value: "default" },
          { label: "Info", value: "info" },
          { label: "Warning", value: "warning" },
          { label: "Error", value: "error" },
        ],
      },
    },
  },
  Breadcrumbs: {
    name: "Breadcrumbs",
    Component: Breadcrumbs,
    props: {
      maxItems: { type: "number", default: 0, label: "Max Items (0 = all)" },
    },
  },
  Pagination: {
    name: "Pagination",
    Component: Pagination,
    props: {
      page: { type: "number", default: 1, label: "Page" },
      totalPages: { type: "number", default: 12, label: "Total Pages" },
      siblingCount: { type: "number", default: 1, label: "Sibling Count" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  Rating: {
    name: "Rating",
    Component: Rating,
    props: {
      value: { type: "number", default: 3.5, label: "Value" },
      max: { type: "number", default: 5, label: "Max" },
      size: { type: "number", default: 24, label: "Size" },
      disabled: { type: "boolean", default: false, label: "Disabled" },
    },
  },
  EmptyState: {
    name: "EmptyState",
    Component: EmptyState,
    props: {
      icon: { type: "text", default: "inbox-outline", label: "Icon" },
      title: { type: "text", default: "No items yet", label: "Title" },
      description: {
        type: "text",
        default: "Items you add will show up here.",
        label: "Description",
      },
    },
  },
  Carousel: {
    name: "Carousel",
    Component: Carousel,
    props: {
      showDots: { type: "boolean", default: true, label: "Show Dots" },
      autoPlayInterval: {
        type: "number",
        default: 0,
        label: "Auto-play (ms, 0 = off)",
      },
    },
  },
};

const Playground = () => {
  const { theme, toggleTheme } = useTheme();
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
    setSelectedComponentName(name);
    const meta = ComponentRegistry[name];
    const initial: Record<string, any> = {};
    Object.keys(meta.props).forEach((key) => {
      initial[key] = meta.props[key].default;
    });
    setComponentProps(initial);
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

  // Mock data for DataGrid if needed
  const gridData = useMemo(
    () => [
      { id: 1, name: "Item 1", value: "Val 1" },
      { id: 2, name: "Item 2", value: "Val 2" },
    ],
    [],
  );
  const gridCols = useMemo(
    () => [
      { id: "name", label: "Name", width: 150 },
      { id: "value", label: "Value", width: 150 },
    ],
    [],
  );

  const renderPreview = () => {
    const { Component, isContainer } = activeMeta;
    let props = { ...componentProps };

    // Special handling for some components
    if (selectedComponentName === "DataGrid") {
      props.data = gridData;
      props.columns = gridCols;
    }

    if (selectedComponentName === "RadioGroup") {
      props.options = [
        { id: "a", label: "Option A", value: "a" },
        { id: "b", label: "Option B", value: "b" },
        { id: "c", label: "Option C", value: "c" },
      ];
      props.onValueChange = (v: any) => updateProp("value", v);
    }

    if (selectedComponentName === "Slider") {
      props.value = Number(props.value) || 0;
      props.min = Number(props.min) || 0;
      props.max = Number(props.max) || 100;
      props.step = Number(props.step) || undefined;
      props.onValueChange = (v: number) => updateProp("value", v);
    }

    if (selectedComponentName === "Tooltip") {
      return (
        <Component {...props}>
          <Button mode="tonal" onPress={() => {}}>
            Hover / long-press me
          </Button>
        </Component>
      );
    }

    if (selectedComponentName === "Menu") {
      props.items = [
        { id: "1", label: "Edit", icon: "pencil-outline", onPress: () => {} },
        {
          id: "2",
          label: "Duplicate",
          icon: "content-copy",
          trailing: "Ctrl+D",
          onPress: () => {},
        },
        {
          id: "3",
          label: "Delete",
          icon: "delete-outline",
          destructive: true,
          dividerAbove: true,
          onPress: () => {},
        },
      ];
      props.onDismiss = () => updateProp("visible", false);
      props.anchor = (
        <Button mode="tonal" onPress={() => updateProp("visible", true)}>
          Open Menu
        </Button>
      );
      return <Component {...props} />;
    }

    if (selectedComponentName === "BottomSheet") {
      props.onDismiss = () => updateProp("visible", false);
      return (
        <>
          <Button mode="tonal" onPress={() => updateProp("visible", true)}>
            Open Bottom Sheet
          </Button>
          <Component {...props}>
            <Typography variant="bodyMedium">
              Bottom sheet content goes here. Drag the handle down or tap the
              scrim to dismiss.
            </Typography>
          </Component>
        </>
      );
    }

    if (selectedComponentName === "NavigationBar") {
      props.items = [
        { id: "home", label: "Home", icon: "home-outline", badgeCount: 0 },
        {
          id: "search",
          label: "Search",
          icon: "magnify",
        },
        {
          id: "inbox",
          label: "Inbox",
          icon: "email-outline",
          badgeCount: 3,
        },
        {
          id: "profile",
          label: "Profile",
          icon: "account-outline",
        },
      ];
      props.onItemPress = (id: string) => updateProp("activeId", id);
    }

    if (selectedComponentName === "Skeleton") {
      props.width = Number(props.width) || 200;
      props.height = Number(props.height) || 48;
      props.duration = Number(props.duration) || 1200;
    }

    if (selectedComponentName === "SearchBar") {
      props.onChangeText = (t: string) => updateProp("value", t);
    }

    if (selectedComponentName === "Banner") {
      props.actions = [
        { label: "Dismiss", onPress: () => updateProp("visible", false) },
        { label: "Renew", onPress: () => {} },
      ];
    }

    if (selectedComponentName === "Breadcrumbs") {
      const maxItems = Number(props.maxItems) || 0;
      props.maxItems = maxItems > 0 ? maxItems : undefined;
      props.items = [
        { id: "1", label: "Home", icon: "home-outline", onPress: () => {} },
        { id: "2", label: "Projects", onPress: () => {} },
        { id: "3", label: "Glowup", onPress: () => {} },
        { id: "4", label: "Components", onPress: () => {} },
        { id: "5", label: "Breadcrumbs" },
      ];
    }

    if (selectedComponentName === "Pagination") {
      props.page = Number(props.page) || 1;
      props.totalPages = Number(props.totalPages) || 1;
      props.siblingCount = Number(props.siblingCount) || 1;
      props.onPageChange = (p: number) => updateProp("page", p);
    }

    if (selectedComponentName === "Rating") {
      props.value = Number(props.value) || 0;
      props.max = Number(props.max) || 5;
      props.size = Number(props.size) || 24;
      props.onChange = (v: number) => updateProp("value", v);
    }

    if (selectedComponentName === "EmptyState") {
      props.action = {
        label: "Add item",
        iconName: "plus",
        onPress: () => {},
      };
    }

    if (selectedComponentName === "Carousel") {
      props.autoPlayInterval = Number(props.autoPlayInterval) || 0;
      return (
        <View style={{ width: "100%", maxWidth: 480 }}>
          <Component {...props}>
            {[
              "primaryContainer",
              "secondaryContainer",
              "tertiaryContainer",
            ].map((colorKey, i) => (
              <View
                key={colorKey}
                style={{
                  height: 160,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: (theme.colors as any)[colorKey],
                }}
              >
                <Typography variant="titleMedium">{`Slide ${i + 1}`}</Typography>
              </View>
            ))}
          </Component>
        </View>
      );
    }

    if (isContainer) {
      const { children, ...otherProps } = props;
      return (
        <Component {...otherProps}>
          {typeof children === "string" ? (
            <Typography variant="bodyMedium">{children}</Typography>
          ) : (
            children
          )}
        </Component>
      );
    }

    return <Component {...props} onPress={() => console.log("Pressed")} />;
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <AppBar
        navigation={{ openDrawer: () => {}, goBack: () => {} } as any}
        route={{ name: "Playground" } as any}
        back={false}
        options={
          {
            headerTitle: "Live Playground",
            headerRight: () => (
              <View style={{ marginRight: 8 }}>
                <Button
                  onPress={toggleTheme}
                  mode="tonal"
                  iconName={theme.isDark ? "brightness-7" : "brightness-4"}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    padding: 0,
                  }}
                >
                  {""}
                </Button>
              </View>
            ),
          } as any
        }
      />

      <View style={styles.container}>
        {/* Component Selector */}
        <View style={styles.selectorSection}>
          <Select
            label="Select Component"
            value={selectedComponentName}
            onSelect={handleComponentChange}
            options={Object.keys(ComponentRegistry).map((name) => ({
              id: name,
              label: name,
              value: name,
            }))}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View
            style={
              Platform.OS === "web" ? styles.webLayout : styles.mobileLayout
            }
          >
            {/* Prop Editors */}
            <View style={styles.editorSection}>
              <Typography variant="titleMedium" style={styles.sectionTitle}>
                Properties
              </Typography>
              <Divider style={styles.divider} />
              {Object.keys(activeMeta.props).map((key) =>
                renderPropEditor(key, activeMeta.props[key]),
              )}
            </View>

            {/* Preview Area */}
            <View style={styles.previewSection}>
              <Typography variant="titleMedium" style={styles.sectionTitle}>
                Preview
              </Typography>
              <Divider style={styles.divider} />
              <View style={styles.previewBox}>{renderPreview()}</View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  selectorSection: { padding: 16, zIndex: 100 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  webLayout: {
    flexDirection: "row",
    gap: 32,
  },
  mobileLayout: {
    flexDirection: "column",
  },
  editorSection: {
    flex: 1,
    minWidth: 300,
    marginBottom: 24,
  },
  previewSection: {
    flex: 1.5,
    minWidth: 300,
  },
  sectionTitle: { marginBottom: 8, opacity: 0.7 },
  divider: { marginBottom: 16 },
  propInput: { marginBottom: 16 },
  propRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  previewBox: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(128,128,128,0.3)",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
});

export default Playground;

import React, { useState, useMemo } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  SafeAreaView,
  Platform,
} from "react-native";
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

// The diagnostics' building blocks, shared by the RFID and the barcode
// scanner screens.
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

export function errorText(error: unknown): string {
  if (!error) return "";
  const { code, message } = error as { code?: string; message?: string };
  return code ? `${code}: ${message ?? ""}` : String(message ?? error);
}

export function useAction() {
  const [error, setError] = useState("");
  const run = (action: () => Promise<unknown> | unknown) => {
    setError("");
    Promise.resolve()
      .then(action)
      .catch((failure: unknown) => setError(errorText(failure)));
  };
  return { error, run };
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

export function Line({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Text style={styles.line}>
      <Text style={styles.label}>{`${label}: `}</Text>
      {children}
    </Text>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

export function Button({
  label,
  onPress,
  onPressIn,
  onPressOut,
}: {
  label: string;
  onPress?: () => void;
  /** For a button held down: the software trigger. */
  onPressIn?: () => void;
  onPressOut?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggle}>
      <Text style={[styles.line, styles.toggleLabel]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
      />
    </View>
  );
}

export function Bar({
  value,
  large = false,
}: {
  value: number;
  large?: boolean;
}) {
  return (
    <View style={[styles.track, large && styles.trackLarge]}>
      <View style={[styles.fill, { width: `${Math.round(value * 100)}%` }]} />
    </View>
  );
}

export const styles = StyleSheet.create({
  page: { padding: 16, paddingTop: 48, gap: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "600" },
  section: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 12,
  },
  heading: { fontSize: 17, fontWeight: "600" },
  line: { fontSize: 14 },
  label: { fontWeight: "600" },
  small: { fontSize: 12, color: "#555" },
  mono: { fontFamily: "monospace", fontSize: 12 },
  error: { color: "#b3261e", fontSize: 13 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  // A long label wraps instead of pushing the switch off screen.
  toggleLabel: { flexShrink: 1 },
  button: {
    backgroundColor: "#1f5fbf",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
  },
  pressed: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 6,
    padding: 8,
    fontFamily: "monospace",
  },
  item: { paddingVertical: 6, gap: 2 },
  track: {
    height: 6,
    backgroundColor: "#e5e5e5",
    borderRadius: 3,
    overflow: "hidden",
  },
  trackLarge: { height: 24, borderRadius: 6 },
  fill: { height: "100%", backgroundColor: "#2e7d32" },
});

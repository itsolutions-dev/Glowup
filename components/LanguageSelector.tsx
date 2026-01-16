import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useTheme } from "../providers/ThemeProvider";

const LanguageSelector = ({ currentLang, onToggle }) => {
  const { theme } = useTheme();

  const languages = {
    en: { flag: "🇺🇸", label: "EN" },
    es: { flag: "🇪🇸", label: "ES" },
    it: { flag: "🇮🇹", label: "IT" },
    fr: { flag: "🇫🇷", label: "FR" },
  };

  const active = languages[currentLang] || languages.it;

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed
            ? theme.colors.surfaceVariant
            : "transparent",
        },
      ]}
    >
      <Text style={styles.flag}>{active.flag}</Text>
      <Text
        style={[
          theme.typography.labelLarge,
          { color: theme.colors.primary, marginLeft: 4 },
        ]}
      >
        {active.label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  flag: {
    fontSize: 18,
  },
});

export default LanguageSelector;

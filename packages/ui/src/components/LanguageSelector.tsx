import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useTheme, getGlowStyles } from "../providers/ThemeProvider";
import { PressableState } from "./types";

const LANGUAGES: Record<string, { flag: string; label: string }> = {
  en: { flag: "🇺🇸", label: "EN" },
  es: { flag: "🇪🇸", label: "ES" },
  it: { flag: "🇮🇹", label: "IT" },
  fr: { flag: "🇫🇷", label: "FR" },
};

const LANGUAGE_CODES = Object.keys(LANGUAGES);

interface LanguageSelectorProps {
  currentLang: string;
  /** Called with the next language code when the selector is pressed. */
  onChange: (lang: string) => void;
}

const LanguageSelector = ({ currentLang, onChange }: LanguageSelectorProps) => {
  const { theme } = useTheme();

  const activeCode = LANGUAGES[currentLang] ? currentLang : LANGUAGE_CODES[0];
  const active = LANGUAGES[activeCode];

  const handlePress = () => {
    const currentIndex = LANGUAGE_CODES.indexOf(activeCode);
    const nextCode = LANGUAGE_CODES[(currentIndex + 1) % LANGUAGE_CODES.length];
    onChange(nextCode);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Change language, current: ${active.label}`}
      style={({ hovered, pressed }: PressableState) => [
        styles.container,
        {
          backgroundColor: pressed
            ? theme.colors.surfaceVariant
            : "transparent",
        },
        (hovered || pressed) && getGlowStyles(theme, true),
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

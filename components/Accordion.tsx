import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, Theme } from "providers/ThemeProvider";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  startExpanded?: boolean;
  style?: Object;
  titleStyle?: Object;
}

const Accordion = ({
  title,
  children,
  style = {},
  titleStyle = {},
  startExpanded = false,
}: AccordionProps) => {
  const [expanded, setExpanded] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useEffect(() => {
    setExpanded(startExpanded);
  }, [startExpanded]);

  const toggleExpand = () => {
    // Standard M3 easing is roughly 300ms
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surfaceContainerLow },
        style,
      ]}
    >
      <Pressable
        onPress={toggleExpand}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: expanded }} // For native platforms
        aria-expanded={expanded} // For web platforms
        style={({ hovered }) => [
          styles.header,
          hovered && { backgroundColor: theme.colors.surfaceHover },
        ]}
      >
        <Text
          style={[styles.title, { color: theme.colors.onSurface }, titleStyle]}
        >
          {title}
        </Text>
        <Icons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={24}
          color={theme.colors.onSurfaceVariant}
        />
      </Pressable>

      {expanded && (
        <View style={styles.content}>
          {typeof children === "string" ? (
            <Text
              style={[
                theme.typography.bodyMedium, // Apply a default body text style from theme
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </View>
  );
};

export default Accordion;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    container: {
      marginVertical: 4,
      borderRadius: 12,
      overflow: "hidden",
      width: "100%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      minHeight: 56,
    },
    title: {
      ...theme.typography.titleMedium,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
  });

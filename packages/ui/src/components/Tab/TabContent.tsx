import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";

interface TabContentProps {
  activeTab: number;
  children: React.ReactNode;
  style?: object;
}

const TabContent = ({ activeTab, children, style = {} }: TabContentProps) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style,
      ]}
    >
      {React.Children.map(children, (child, index) => {
        if (index !== activeTab) return null;

        return (
          <Animated.View style={styles.contentFrame}>{child}</Animated.View>
        );
      })}
    </View>
  );
};

export default TabContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentFrame: {
    flex: 1,
    padding: 16,
  },
});

import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "providers/ThemeProvider";

interface CircularProgress {
  size?: number;
  strokeWidth?: number;
  color?: string;
  duration?: number;
}

const CircularProgress = ({
  size = 48,
  strokeWidth = 4,
  color,
  duration = 1000,
}: CircularProgress) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  useEffect(() => {
    let isMounted = true;

    const startAnimation = () => {
      rotateAnim.setValue(0);
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        // Recursively restart if the animation finished and component is still mounted
        if (finished && isMounted) {
          startAnimation();
        }
      });
    };

    startAnimation();

    return () => {
      isMounted = false;
      rotateAnim.stopAnimation();
    };
  }, [rotateAnim, duration]);

  // Interpolate 0-1 into a full rotation
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ rotate }],
        },
      ]}
      accessibilityRole="progressbar"
      accessible={true}
      accessibilityLabel="Loading"
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          stroke={color || theme.colors.primary}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CircularProgress;

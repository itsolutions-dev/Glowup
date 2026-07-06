import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useTheme, Theme } from "../providers/ThemeProvider";

interface CarouselProps {
  children: React.ReactNode;
  showDots?: boolean;
  /** Auto-advance interval in ms; 0 disables auto-play. */
  autoPlayInterval?: number;
  /** Fixed height; otherwise sized by the tallest page. */
  height?: number;
  onIndexChange?: (index: number) => void;
}

const Carousel = ({
  children,
  showDots = true,
  autoPlayInterval = 0,
  height,
  onIndexChange,
}: CarouselProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const pages = useMemo(() => React.Children.toArray(children), [children]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  // Pause auto-play while the user is interacting
  const interacting = useRef(false);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  const goToIndex = useCallback(
    (index: number, animated = true) => {
      if (containerWidth === 0) return;
      const clamped = Math.max(0, Math.min(pages.length - 1, index));
      scrollRef.current?.scrollTo({
        x: clamped * containerWidth,
        animated,
      });
    },
    [containerWidth, pages.length],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (containerWidth === 0) return;
      const index = Math.round(
        event.nativeEvent.contentOffset.x / containerWidth,
      );
      const clamped = Math.max(0, Math.min(pages.length - 1, index));
      setActiveIndex((prev) => {
        if (prev !== clamped) onIndexChange?.(clamped);
        return clamped;
      });
    },
    [containerWidth, pages.length, onIndexChange],
  );

  useEffect(() => {
    if (!autoPlayInterval || autoPlayInterval <= 0 || pages.length < 2) return;
    const timer = setInterval(() => {
      if (interacting.current) return;
      setActiveIndex((prev) => {
        const next = (prev + 1) % pages.length;
        goToIndex(next);
        return prev; // handleScroll updates the index once the scroll lands
      });
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [autoPlayInterval, pages.length, goToIndex]);

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          interacting.current = true;
        }}
        onScrollEndDrag={() => {
          interacting.current = false;
        }}
        style={height != null ? { height } : undefined}
        {...(Platform.OS === "web" && {
          // Snap fallback: react-native-web maps pagingEnabled onto CSS
          // scroll-snap, but older browsers need the explicit interval
          snapToInterval: containerWidth || undefined,
          decelerationRate: "fast" as const,
        })}
      >
        {pages.map((page, index) => (
          <View key={index} style={{ width: containerWidth || "100%" }}>
            {page}
          </View>
        ))}
      </ScrollView>

      {showDots && pages.length > 1 && (
        <View style={styles.dotsRow}>
          {pages.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => goToIndex(index)}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${index + 1}`}
              accessibilityState={{ selected: index === activeIndex }}
              style={styles.dotPressable}
            >
              <View
                style={[
                  styles.dot,
                  index === activeIndex
                    ? { backgroundColor: theme.colors.primary, width: 20 }
                    : { backgroundColor: theme.colors.outlineVariant },
                ]}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

export default Carousel;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    wrapper: {
      width: "100%",
    },
    dotsRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: theme.spacing.s,
      gap: 6,
    },
    dotPressable: {
      padding: 4,
      ...Platform.select({
        web: { cursor: "pointer" },
      }),
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      ...Platform.select({
        web: {
          transitionProperty: "background-color, width" as any,
          transitionDuration: "200ms" as any,
        },
      }),
    },
  });

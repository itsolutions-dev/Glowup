import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  Typography,
  useTheme,
  type PressableState,
  type Theme,
} from "@its/glowup-ui";

/** The narrowest a tile may get before the grid drops a column. */
const TILE_MIN_WIDTH = 104;
const TILE_HEIGHT = 88;
/** Columns before the grid has been measured: the prerender and the first paint. */
const FIRST_COLUMNS = 6;

interface IconGridProps {
  names: readonly string[];
  /** The icon drawn as chosen. */
  selected?: string;
  onSelect: (name: string) => void;
  /** The height of the scrolling pane. */
  height: number;
  /** Shown instead of the grid when `names` is empty. */
  emptyText?: string;
}

/**
 * A scrolling grid of icons, each with its name under it.
 *
 * Virtualised: the font has some seven thousand glyphs and a plain wrapped
 * `View` of that many tiles would put thirty thousand nodes on the page.
 * `FlatList` renders the rows around the viewport only, and the fixed tile
 * height lets it skip measuring them.
 */
export const IconGrid = ({
  names,
  selected,
  onSelect,
  height,
  emptyText = "No icon matches.",
}: IconGridProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [width, setWidth] = useState(0);
  const columns =
    width > 0 ? Math.max(2, Math.floor(width / TILE_MIN_WIDTH)) : FIRST_COLUMNS;

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <IconTile
        name={item}
        selected={item === selected}
        basis={`${100 / columns}%`}
        onSelect={onSelect}
      />
    ),
    [columns, onSelect, selected],
  );

  return (
    <View
      style={{ height }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {names.length === 0 ? (
        <View style={styles.empty}>
          <Typography
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {emptyText}
          </Typography>
        </View>
      ) : (
        <FlatList
          // A different column count is a different list: FlatList does not
          // support changing `numColumns` on the fly.
          key={columns}
          data={names as string[]}
          numColumns={columns}
          keyExtractor={(name) => name}
          renderItem={renderItem}
          // With columns, the layout is asked for by row.
          getItemLayout={(_, index) => ({
            length: TILE_HEIGHT,
            offset: TILE_HEIGHT * index,
            index,
          })}
          initialNumToRender={8}
          windowSize={9}
          maxToRenderPerBatch={8}
          extraData={selected}
          showsVerticalScrollIndicator
        />
      )}
    </View>
  );
};

const IconTile = ({
  name,
  selected,
  basis,
  onSelect,
}: {
  name: string;
  selected: boolean;
  basis: `${number}%`;
  onSelect: (name: string) => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected }}
      onPress={() => onSelect(name)}
      style={({ hovered, focused }: PressableState) => [
        styles.tile,
        { flexBasis: basis, maxWidth: basis },
        (hovered || focused) && {
          backgroundColor: theme.colors.surfaceContainerHigh,
        },
        selected && { backgroundColor: theme.colors.secondaryContainer },
      ]}
    >
      <Icons
        name={name as never}
        size={28}
        color={
          selected
            ? theme.colors.onSecondaryContainer
            : theme.colors.onSurfaceVariant
        }
      />
      <Typography
        variant="labelSmall"
        numberOfLines={2}
        style={[
          styles.name,
          {
            color: selected
              ? theme.colors.onSecondaryContainer
              : theme.colors.onSurface,
          },
        ]}
      >
        {name}
      </Typography>
    </Pressable>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    tile: {
      flexGrow: 0,
      height: TILE_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
      borderRadius: theme.shape.large,
    },
    name: { textAlign: "center" },
    empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

export default IconGrid;

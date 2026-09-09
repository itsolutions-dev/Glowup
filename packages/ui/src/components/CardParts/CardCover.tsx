import React, { useMemo } from "react";
import {
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Theme, useTheme } from "../../providers/ThemeProvider";
import Image from "../Image";

export interface CardCoverProps {
  source: ImageSourcePropType;
  /** Alternative text — an unnamed image is invisible to a screen reader. */
  alt: string;
  /** Width divided by height. M3 card covers default to 16:9. */
  ratio?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The media band at the top of a `Card`. It bleeds to the card's edges by
 * cancelling the card's own padding, which is what makes a cover read as a
 * cover rather than as an inset picture.
 */
const CardCover = ({
  source,
  alt,
  ratio = 16 / 9,
  style,
  testID,
}: CardCoverProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.bleed, style]}>
      <Image
        source={source}
        alt={alt}
        ratio={ratio}
        width="100%"
        radius={0}
        testID={testID}
      />
    </View>
  );
};

export default CardCover;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    bleed: {
      // Card applies spacing.m padding; pull the media back out to the edges.
      marginHorizontal: -theme.spacing.m,
      marginTop: -theme.spacing.m,
      marginBottom: theme.spacing.m,
      overflow: "hidden",
    },
  });

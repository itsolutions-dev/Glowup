import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { rgba } from "polished";
import { useTheme, Theme } from "../providers/ThemeProvider";
import Portal, { usePortalHost } from "./Portal";
import { useEscapeKey } from "./internal/useEscapeKey";
import { elevationStyle } from "./internal/elevation";
import {
  placeAnchored,
  placeOnSide,
  type AnchorPosition,
  type AnchorRect,
  type PlacementSide,
} from "./internal/anchorPlacement";

const EMPTY_SIZE = { width: 0, height: 0 };

export interface HoverCardProps {
  /** What the card shows: any node. It is supplementary, never the only way to something. */
  content: React.ReactNode;
  /** The trigger. It is not wrapped in an accessible element of its own. */
  children: React.ReactNode;
  /**
   * The side of the trigger the card opens on, centred on it. When that side
   * has no room the card goes to the opposite one, and it always stays inside
   * the window. Defaults to `"bottom"`.
   */
  placement?: PlacementSide;
  /**
   * Places the card as `Popover` does (below, above or over the trigger,
   * aligned by its left edge, right edge or centre) instead of by
   * `placement`, which it replaces when given.
   */
  anchorPosition?: AnchorPosition;
  /** Web: how long the pointer or focus rests on the trigger before the card opens, in ms. Defaults to `300`. */
  openDelay?: number;
  /** Web: how long after the pointer leaves the trigger and the card before it closes, in ms. Defaults to `150`. */
  closeDelay?: number;
  /** Controls whether the card is open; pair with `onOpenChange`. */
  open?: boolean;
  /** Whether the card starts open (uncontrolled). Defaults to `false`. */
  defaultOpen?: boolean;
  /** Called with the new state when the user opens or closes the card. */
  onOpenChange?: (open: boolean) => void;
  /** The card never opens, and closes if it was open. */
  disabled?: boolean;
  /** Width of the card in px; it never grows past the window. Defaults to `280`. */
  width?: number;
  /** Style of the trigger's wrapper, which shrinks to the trigger by default. */
  style?: StyleProp<ViewStyle>;
  /** Root testID. The card gets `${testID}-card`, the native outside-press layer `${testID}-backdrop`. */
  testID?: string;
}

/**
 * A card that shows more about its trigger: a profile on a username, a preview
 * on a link. On the web it opens when the pointer rests on the trigger or it
 * takes focus, and stays open while the pointer is over the card, so the card
 * can hold links; Escape closes it. On native it opens on a long press of the
 * trigger and closes on a press outside or Android back. It is not modal and
 * does not block the page on the web.
 *
 * Like a tooltip it is for sighted users: on the web it is not in the tab
 * order when it sits in a `Portal.Host`, so whatever it shows has to be
 * reachable some other way too.
 *
 * ```tsx
 * <HoverCard content={<Profile user={user} />} placement="top">
 *   <Typography>@{user.handle}</Typography>
 * </HoverCard>
 * ```
 */
const HoverCard = ({
  content,
  children,
  placement = "bottom",
  anchorPosition,
  openDelay = 300,
  closeDelay = 150,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  width = 280,
  style,
  testID,
}: HoverCardProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const window = useWindowDimensions();
  const hasPortalHost = usePortalHost();
  const cardId = useId();
  const anchorRef = useRef<View>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [openState, setOpenState] = useState(defaultOpen);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const [cardSize, setCardSize] = useState(EMPTY_SIZE);
  const isOpen = !disabled && (openProp ?? openState);

  const setOpen = useCallback(
    (next: boolean) => {
      if (next === isOpen) return;
      if (openProp === undefined) setOpenState(next);
      onOpenChange?.(next);
    },
    [isOpen, openProp, onOpenChange],
  );
  // The timers fire after a render that may have replaced `setOpen`.
  const latestSetOpen = useRef(setOpen);
  useEffect(() => {
    latestSetOpen.current = setOpen;
  });

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  // Timers outlive the component if the trigger unmounts mid-hover.
  useEffect(() => cancel, [cancel]);

  const schedule = useCallback(
    (next: boolean) => {
      cancel();
      const delay = next ? openDelay : closeDelay;
      if (delay <= 0) latestSetOpen.current(next);
      else timer.current = setTimeout(() => latestSetOpen.current(next), delay);
    },
    [cancel, openDelay, closeDelay],
  );

  // Where the trigger is, whenever the card is up: it may open from a prop,
  // and the window may be resized under it.
  useEffect(() => {
    if (!isOpen) return;
    anchorRef.current?.measureInWindow((x, y, w, h) =>
      setAnchor({ x, y, width: w, height: h }),
    );
  }, [isOpen, window.width, window.height]);

  useEscapeKey(isOpen, () => latestSetOpen.current(false));

  const onCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    setCardSize({ width: w, height: h });
  }, []);

  const portalled = hasPortalHost && Platform.OS === "web";
  const measured = !!anchor && cardSize.width > 0;

  // The card's corner in window coordinates; inline (no host) it is drawn
  // inside the trigger's wrapper, so the trigger's own corner comes off.
  const corner = useMemo(() => {
    if (!anchor) return { left: 0, top: 0 };
    const cardWidth = Math.min(width, window.width - 16);
    const size = { width: cardWidth, height: cardSize.height };
    let left: number;
    let top: number;
    if (anchorPosition) {
      const placed = placeAnchored(anchor, size, window, anchorPosition);
      left = placed.left;
      top = placed.top ?? window.height - (placed.bottom ?? 0) - size.height;
    } else {
      ({ left, top } = placeOnSide(anchor, size, window, placement));
    }
    return Platform.OS === "web" && !portalled
      ? { left: left - anchor.x, top: top - anchor.y }
      : { left, top };
  }, [anchor, anchorPosition, placement, width, window, cardSize, portalled]);

  const card = (
    <View
      nativeID={cardId}
      testID={testID ? `${testID}-card` : undefined}
      onLayout={onCardLayout}
      // Over the card counts as over the trigger, or it could not be reached.
      onPointerEnter={cancel}
      onPointerLeave={() => schedule(false)}
      onFocus={cancel}
      onBlur={() => schedule(false)}
      style={[
        styles.card,
        { width, maxWidth: window.width - 16, ...corner },
        // Hidden until it has been measured and placed, or it would flash at the origin.
        !measured && styles.unplaced,
      ]}
    >
      {content}
    </View>
  );

  const hoverProps = {
    onPointerEnter: () => schedule(true),
    onPointerLeave: () => schedule(false),
    onFocus: () => schedule(true),
    onBlur: () => schedule(false),
  };

  return (
    <View
      ref={anchorRef}
      testID={testID}
      collapsable={false}
      style={[styles.wrapper, style]}
      // Web listens on a plain View, as Tooltip does: a Pressable would not
      // deliver hover to a pressable trigger, and focus bubbles up from it.
      {...(Platform.OS === "web" ? hoverProps : undefined)}
      // Not in react-native's View typings; react-native-web passes it on.
      {...(isOpen ? ({ "aria-describedby": cardId } as object) : undefined)}
    >
      {Platform.OS === "web" ? (
        children
      ) : (
        <Pressable
          accessible={false}
          onLongPress={() => {
            if (!disabled) setOpen(true);
          }}
        >
          {children}
        </Pressable>
      )}

      {isOpen &&
        (Platform.OS === "web" ? (
          portalled ? (
            <Portal>{card}</Portal>
          ) : (
            card
          )
        ) : (
          <Modal
            transparent
            animationType="fade"
            visible
            onRequestClose={() => setOpen(false)}
          >
            <Pressable
              testID={testID ? `${testID}-backdrop` : undefined}
              style={StyleSheet.absoluteFill}
              onPress={() => setOpen(false)}
              importantForAccessibility="no"
              accessibilityElementsHidden
            />
            {card}
          </Modal>
        ))}
    </View>
  );
};

export default HoverCard;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { alignSelf: "flex-start", position: "relative" },
    card: {
      position: "absolute",
      zIndex: 1000,
      padding: theme.spacing.m,
      borderRadius: theme.shape.medium,
      ...elevationStyle(theme, 3),
      ...Platform.select({
        web: { boxShadow: `0 4px 12px ${rgba(theme.colors.shadow, 0.2)}` },
      }),
    },
    unplaced: { opacity: 0 },
  });

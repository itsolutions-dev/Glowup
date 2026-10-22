import React from "react";
import { View } from "react-native";
import { SizeClass, useBreakpoint } from "../hooks/useBreakpoint";

export interface VisibleProps {
  /** A condition of your own; the children show only while it holds. Defaults to `true`. */
  when?: boolean;
  /** Shows from this window size class up (`"medium"` is medium, expanded, large, …). */
  above?: SizeClass;
  /** Shows only on size classes smaller than this one (`"medium"` is compact only). */
  below?: SizeClass;
  /** Shows only on this size class, or on any of these. */
  only?: SizeClass | SizeClass[];
  /** Rendered in place of the children while they are not shown. */
  fallback?: React.ReactNode;
  /**
   * Hides the children with `display: "none"` instead of unmounting them, so
   * their state survives. They are then wrapped in a `View` (laid out as if it
   * were not there while they show). Defaults to `false`.
   */
  keepMounted?: boolean;
  children?: React.ReactNode;
}

/**
 * Shows its children only when every condition holds: your own (`when`) and the
 * window's size class (`above`, `below`, `only`, read through `useBreakpoint`).
 * While a prerendered page hydrates the class is `compact`, then the real one.
 *
 * ```tsx
 * <Visible above="expanded" fallback={<NavBar … />}>
 *   <NavigationRail … />
 * </Visible>
 * ```
 */
const Visible = ({
  when = true,
  above,
  below,
  only,
  fallback,
  keepMounted = false,
  children,
}: VisibleProps) => {
  const { sizeClass, atLeast } = useBreakpoint();
  const visible =
    when &&
    (above === undefined || atLeast(above)) &&
    (below === undefined || !atLeast(below)) &&
    (only === undefined ||
      (Array.isArray(only) ? only.includes(sizeClass) : only === sizeClass));

  if (!keepMounted) return <>{visible ? children : fallback}</>;
  return (
    <>
      <View style={{ display: visible ? "contents" : "none" }}>{children}</View>
      {!visible && fallback}
    </>
  );
};

export default Visible;

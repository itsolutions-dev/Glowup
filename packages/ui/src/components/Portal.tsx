import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";

interface PortalMethods {
  /** Upsert: mounting an existing key replaces its content. */
  mount: (key: string, children: React.ReactNode) => void;
  unmount: (key: string) => void;
}

const PortalContext = createContext<PortalMethods | null>(null);

export interface PortalHostProps {
  children: React.ReactNode;
}

/**
 * Renders every `Portal` mounted below it on top of its own children.
 *
 * Wrap the app root once:
 * ```tsx
 * <ThemeProvider>
 *   <PortalHost>
 *     <App />
 *   </PortalHost>
 * </ThemeProvider>
 * ```
 */
export const PortalHost = ({ children }: PortalHostProps) => {
  const [portals, setPortals] = useState<
    { key: string; children: React.ReactNode }[]
  >([]);

  const methods = useMemo<PortalMethods>(
    () => ({
      mount: (key, node) =>
        setPortals((current) =>
          current.some((p) => p.key === key)
            ? current.map((p) => (p.key === key ? { key, children: node } : p))
            : [...current, { key, children: node }],
        ),
      unmount: (key) =>
        setPortals((current) => current.filter((p) => p.key !== key)),
    }),
    [],
  );

  return (
    <PortalContext.Provider value={methods}>
      <View style={styles.host} collapsable={false} pointerEvents="box-none">
        {children}
      </View>
      {portals.map(({ key, children: node }) => (
        <View
          key={key}
          collapsable={false}
          pointerEvents="box-none"
          style={StyleSheet.absoluteFill}
        >
          {node}
        </View>
      ))}
    </PortalContext.Provider>
  );
};

/** True when a `PortalHost` is mounted above this point in the tree. */
export const usePortalHost = () => useContext(PortalContext) !== null;

export interface PortalProps {
  children: React.ReactNode;
}

/**
 * Renders `children` at the `PortalHost` instead of in place, so an overlay
 * escapes a parent that clips it (`overflow: "hidden"`), sits above siblings
 * regardless of their elevation, and is not dragged around by a `ScrollView`.
 *
 * Without a `PortalHost` above it the children render inline, so a component
 * that opts in still works in a tree that has not been wrapped.
 */
const Portal = ({ children }: PortalProps) => {
  const manager = useContext(PortalContext);
  const key = useId();

  // The host is a sibling, so its setState must not run during this render.
  // `mount` upserts, which keeps content updates from unmounting the portal.
  useEffect(() => {
    manager?.mount(key, children);
  }, [manager, key, children]);

  useEffect(() => {
    if (!manager) return;
    return () => manager.unmount(key);
  }, [manager, key]);

  return manager ? null : <>{children}</>;
};

/** `Portal.Host` mirrors the react-native-paper API. */
Portal.Host = PortalHost;

export default Portal;

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});

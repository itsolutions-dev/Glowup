import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { View, StyleSheet } from "react-native";
import Snackbar from "../components/Snackbar";
import { MaterialCommunityIconsGlyphs } from "../components/types";

export interface ToastOptions {
  message: string;
  /** Drives the container colors and the default icon. */
  type?: "default" | "success" | "error";
  /** Auto-hide delay in ms. Defaults to 4000. */
  duration?: number;
  /** Overrides the icon implied by `type`. */
  icon?: MaterialCommunityIconsGlyphs;
  action?: { label: string; onPress: () => void };
  /**
   * Replaces any queued toast carrying the same id instead of appending one.
   * Use it to keep a repeated event (a retry, a poll) from stacking up.
   */
  id?: string;
}

interface QueuedToast extends ToastOptions {
  key: string;
}

interface ToastApi {
  /** Enqueues a toast and returns its key. */
  show: (options: ToastOptions) => string;
  /** Shorthand for `show({ type: "success" })`. */
  success: (
    message: string,
    options?: Omit<ToastOptions, "message" | "type">,
  ) => string;
  /** Shorthand for `show({ type: "error" })`. */
  error: (
    message: string,
    options?: Omit<ToastOptions, "message" | "type">,
  ) => string;
  /** Dismisses one toast by key, or the whole queue when called bare. */
  hide: (key?: string) => void;
  /** Keys currently queued, head first. */
  queue: string[];
}

const ToastContext = createContext<ToastApi | null>(null);

/**
 * Imperative toasts from anywhere in the tree — no `visible` state to thread
 * through the screen. Requires a `ToastProvider` above the caller.
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return context;
};

let counter = 0;
const nextKey = () => `toast-${++counter}`;

/**
 * Renders one toast at a time from a FIFO queue, so a burst of events plays
 * back in order instead of overwriting itself.
 */
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [queue, setQueue] = useState<QueuedToast[]>([]);

  const show = useCallback((options: ToastOptions) => {
    const key = options.id ?? nextKey();
    setQueue((current) => {
      const withoutSameId = options.id
        ? current.filter((toast) => toast.key !== options.id)
        : current;
      return [...withoutSameId, { ...options, key }];
    });
    return key;
  }, []);

  const hide = useCallback((key?: string) => {
    setQueue((current) =>
      key === undefined ? [] : current.filter((toast) => toast.key !== key),
    );
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message, options) =>
        show({ ...options, message, type: "success" }),
      error: (message, options) => show({ ...options, message, type: "error" }),
      hide,
      queue: queue.map((toast) => toast.key),
    }),
    [show, hide, queue],
  );

  const current = queue[0];

  return (
    <ToastContext.Provider value={api}>
      {children}
      {!!current && (
        // pointerEvents="box-none" keeps the rest of the screen tappable while
        // a toast is on screen; the toast itself still receives presses.
        <View style={styles.host} pointerEvents="box-none">
          <Snackbar
            // Remounting per toast restarts the enter animation and the timer.
            key={current.key}
            visible
            message={current.message}
            type={current.type}
            icon={current.icon}
            duration={current.duration}
            action={current.action}
            onDismiss={() => hide(current.key)}
          />
        </View>
      )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;

const styles = StyleSheet.create({
  host: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
});

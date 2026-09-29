import { useSyncExternalStore } from "react";
import { AccessibilityInfo } from "react-native";

// One read and one subscription for the whole app, however many components ask:
// every mounted ring, drawer or sheet used to query the OS and add a listener
// of its own.
let reduced = false;
let subscription: { remove: () => void } | null = null;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (!subscription) {
    const set = (value: boolean) => {
      if (value === reduced) return;
      reduced = value;
      listeners.forEach((l) => l());
    };
    AccessibilityInfo.isReduceMotionEnabled().then(set, () => {});
    subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      set,
    );
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      subscription?.remove();
      subscription = null;
    }
  };
};

const getSnapshot = () => reduced;

/** Whether the OS asks for reduced motion; follows the setting live. */
export const useReduceMotion = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { ThemeProvider } from "@its/glowup-ui";
import { hapticFeedback } from "@its/glowup-device/haptics";

import { usePersistentState } from "./usePersistentState";

interface HapticsPreference {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const HapticsPreferenceContext = createContext<HapticsPreference>({
  enabled: false,
  setEnabled: () => {},
});

/**
 * The site's ThemeProvider, wired to @its/glowup-device/haptics: every Glowup
 * control on every page answers with the platform's feedback (nothing on web).
 * The reader turns it off on /device/haptics, and the choice persists.
 */
export function HapticThemeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = usePersistentState("haptics", true);
  const value = useMemo(() => ({ enabled, setEnabled }), [enabled, setEnabled]);
  return (
    <HapticsPreferenceContext.Provider value={value}>
      <ThemeProvider
        onInteractionFeedback={enabled ? hapticFeedback : undefined}
      >
        {children}
      </ThemeProvider>
    </HapticsPreferenceContext.Provider>
  );
}

export const useHapticsPreference = () => useContext(HapticsPreferenceContext);

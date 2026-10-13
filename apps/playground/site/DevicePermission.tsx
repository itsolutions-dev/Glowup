import { useState, type ReactNode } from "react";
import { Button, HStack, StatusBadge } from "@its/glowup-ui";
import type { PermissionStatus } from "@its/glowup-device";

const BADGE: Record<
  PermissionStatus,
  { label: string; type: "success" | "error" | "warning" }
> = {
  granted: { label: "Granted", type: "success" },
  undetermined: { label: "Not asked", type: "warning" },
  denied: { label: "Denied", type: "error" },
  unsupported: { label: "Unsupported", type: "warning" },
};

interface DevicePermissionProps {
  status: PermissionStatus;
  canAskAgain: boolean;
  isLoading: boolean;
  request: () => Promise<unknown>;
  openSettings: () => Promise<void>;
  /** The button that shows the OS prompt. */
  requestLabel: string;
  /** Badges after the status (precision, the microphone). */
  children?: ReactNode;
}

/**
 * The status of a @its/glowup-device permission and the one action that can
 * change it: the prompt while the OS still shows it, the settings once not.
 */
export function DevicePermission({
  status,
  canAskAgain,
  isLoading,
  request,
  openSettings,
  requestLabel,
  children,
}: DevicePermissionProps) {
  const [busy, setBusy] = useState(false);
  const badge = BADGE[status];

  const ask = async () => {
    setBusy(true);
    try {
      await request();
    } finally {
      setBusy(false);
    }
  };

  return (
    <HStack spacing="m" align="center" wrap>
      <StatusBadge
        label={isLoading ? "Checking…" : badge.label}
        type={badge.type}
      />
      {children}
      {isLoading ||
      status === "granted" ||
      status === "unsupported" ? null : canAskAgain ? (
        <Button iconName="shield-check-outline" loading={busy} onPress={ask}>
          {requestLabel}
        </Button>
      ) : (
        <Button
          mode="outlined"
          iconName="cog-outline"
          onPress={() => void openSettings().catch(() => {})}
        >
          Open settings
        </Button>
      )}
    </HStack>
  );
}

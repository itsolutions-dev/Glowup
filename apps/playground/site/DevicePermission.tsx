import { useState, type ComponentProps, type ReactNode } from "react";
import { Button, HStack, StatusBadge } from "@its/glowup-ui";
import type { PermissionStatus } from "@its/glowup-device";

/** A device permission, or a notification one (iOS's quiet "provisional" grant). */
type Status = PermissionStatus | "provisional";

const BADGE: Record<
  Status,
  { label: string; type: "success" | "error" | "warning" }
> = {
  granted: { label: "Granted", type: "success" },
  provisional: { label: "Provisional", type: "success" },
  undetermined: { label: "Not asked", type: "warning" },
  denied: { label: "Denied", type: "error" },
  unsupported: { label: "Unsupported", type: "warning" },
};

interface DevicePermissionProps {
  status: Status;
  canAskAgain: boolean;
  isLoading?: boolean;
  request: () => Promise<unknown>;
  /** Where a refused permission is turned back on; none on the web. */
  openSettings?: () => Promise<void>;
  /** The button that shows the OS prompt. */
  requestLabel: string;
  requestIcon?: ComponentProps<typeof Button>["iconName"];
  /** Badges after the status (precision, the microphone). */
  children?: ReactNode;
}

/**
 * The status of a @its/glowup-device permission and the one action that can
 * change it: the prompt while the OS still shows it, the settings once not
 * (where there are settings to open).
 */
export function DevicePermission({
  status,
  canAskAgain,
  isLoading,
  request,
  openSettings,
  requestLabel,
  requestIcon = "shield-check-outline",
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
      status === "provisional" ||
      status === "unsupported" ? null : canAskAgain ? (
        <Button iconName={requestIcon} loading={busy} onPress={ask}>
          {requestLabel}
        </Button>
      ) : openSettings ? (
        <Button
          mode="outlined"
          iconName="cog-outline"
          onPress={() => void openSettings().catch(() => {})}
        >
          Open settings
        </Button>
      ) : null}
    </HStack>
  );
}

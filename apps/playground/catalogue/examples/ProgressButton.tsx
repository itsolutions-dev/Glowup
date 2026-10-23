import { useEffect, useState } from "react";
import {
  ProgressButton,
  Switch,
  Typography,
  VStack,
  type ProgressButtonProps,
  type ProgressButtonStatus,
} from "@its/glowup-ui";

const props: Partial<ProgressButtonProps> = {
  children: "Upload report",
  loadingLabel: "Uploading…",
  successLabel: "Uploaded",
  iconName: "cloud-upload-outline",
};

const STEPS = 10;

export default function ProgressButtonExample() {
  const [status, setStatus] = useState<ProgressButtonStatus>("idle");
  const [step, setStep] = useState(0);
  const [offline, setOffline] = useState(false);

  // The upload: a step every 250 ms, cut short at 60% while offline.
  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(() => {
      if (step === STEPS) setStatus("success");
      else if (offline && step === 6) setStatus("error");
      else setStep(step + 1);
    }, 250);
    return () => clearTimeout(timer);
  }, [status, step, offline]);

  return (
    <VStack spacing="m" align="center">
      <VStack spacing="xs" align="center">
        <Typography variant="titleMedium">Q3 summary.pdf</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          2.4 MB · shared with the finance team
        </Typography>
      </VStack>
      <ProgressButton
        {...props}
        status={status}
        progress={step / STEPS}
        onClick={() => {
          setStep(0);
          setStatus("loading");
        }}
        onSuccessEnd={() => setStatus("idle")}
      />
      <Switch
        label="Simulate a connection error"
        value={offline}
        onChange={setOffline}
      />
    </VStack>
  );
}

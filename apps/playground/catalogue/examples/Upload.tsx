import { useRef, useState } from "react";
import { Platform } from "react-native";
import {
  Button,
  Typography,
  Upload,
  VStack,
  type UploadFile,
  type UploadHandlers,
  type UploadProps,
} from "@its/glowup-ui";

const props: Partial<UploadProps> = {
  label: "Attachments",
  accept: "image/*,.pdf",
  multiple: true,
  maxSize: 5242880,
  helperText: "Images or PDF, up to 5 MB each.",
};

// A file over 2 MB loses its connection once, so there is a Retry to try.
const LARGE = 2097152;

// A phone has no file dialog: the app passes a picker (the device package's
// media picker). This stand-in "picks" one sample file.
const pickSample = async () => [
  { name: "receipt.pdf", size: 1800000, type: "application/pdf" },
];

export default function UploadExample() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [sent, setSent] = useState(false);
  const lostOnce = useRef(new Set<string>());

  // Stands in for a request: ten steps, 150 ms apart, stopping on abort.
  const send = (file: UploadFile, { onProgress, signal }: UploadHandlers) =>
    new Promise<void>((resolve, reject) => {
      let step = 0;
      const stop = (error?: Error) => {
        clearInterval(timer);
        if (error) reject(error);
        else resolve();
      };
      const timer = setInterval(() => {
        step += 1;
        onProgress(step / 10);
        if (file.size > LARGE && step === 6 && !lostOnce.current.has(file.id)) {
          lostOnce.current.add(file.id);
          stop(new Error("The connection was lost."));
        } else if (step === 10) {
          stop();
        }
      }, 150);
      signal.addEventListener("abort", () => stop(new Error("Cancelled")));
    });

  const done = files.filter((file) => file.status === "done").length;
  const busy = files.some((file) => file.status !== "done");

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Contact support</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          Add screenshots or a receipt to help us reproduce the problem.
        </Typography>
      </VStack>
      <Upload
        {...props}
        value={files}
        onChange={(next) => {
          setFiles(next);
          setSent(false);
        }}
        onUpload={send}
        onPick={Platform.OS === "web" ? undefined : pickSample}
      />
      <Button
        disabled={files.length === 0 || busy}
        onClick={() => {
          setFiles([]);
          setSent(true);
        }}
        style={{ alignSelf: "flex-start" }}
      >
        Send request
      </Button>
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {sent
          ? "Request sent. We will reply by email."
          : `${done} of ${files.length} files uploaded.`}
      </Typography>
    </VStack>
  );
}

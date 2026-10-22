import React from "react";
import { Upload, type UploadFile } from "@its/glowup-ui";

const frame: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
  width: 420,
};

const files: UploadFile[] = [
  {
    id: "1",
    name: "q3-report.pdf",
    size: 2_411_724,
    type: "application/pdf",
    status: "done",
    progress: 1,
  },
  {
    id: "2",
    name: "team-photo.png",
    size: 5_345_280,
    type: "image/png",
    status: "uploading",
    progress: 0.42,
  },
  {
    id: "3",
    name: "notes.txt",
    size: 1_536,
    type: "text/plain",
    status: "pending",
  },
  {
    id: "4",
    name: "recording.mp4",
    size: 84_934_656,
    type: "video/mp4",
    status: "error",
    error: "The server closed the connection",
  },
];

/** A dashed area to drop files on, or press to browse. */
export const Dropzone = () => (
  <div style={frame}>
    <Upload multiple />
  </div>
);

export const WithLabelAndLimits = () => (
  <div style={frame}>
    <Upload
      label="Attachments"
      multiple
      accept="image/*,.pdf"
      maxSize={5 * 1024 * 1024}
      maxFiles={4}
      helperText="PDF or images"
    />
  </div>
);

/** `variant="button"` is a plain button; a file can still be dropped on it. */
export const ButtonVariant = () => (
  <div style={frame}>
    <Upload variant="button" prompt="Upload a file" />
    <Upload variant="button" multiple />
  </div>
);

/** A file in each status: done, uploading with its progress, pending, failed with a retry. */
export const FileList = () => (
  <div style={frame}>
    <Upload
      label="Attachments"
      multiple
      defaultValue={files}
      onUpload={async () => {}}
    />
  </div>
);

/** Without `onUpload` files are only collected, for a form to send: no progress, no retry. */
export const CollectOnly = () => (
  <div style={frame}>
    <Upload
      multiple
      defaultValue={[files[0], files[2]].map((f) => ({
        ...f,
        status: "pending" as const,
        progress: undefined,
      }))}
    />
  </div>
);

export const WithError = () => (
  <div style={frame}>
    <Upload label="Contract" error="A signed contract is required" />
  </div>
);

export const Disabled = () => (
  <div style={frame}>
    <Upload label="Attachments" disabled helperText="Uploads are closed" />
    <Upload variant="button" disabled />
    <Upload disabled defaultValue={[files[0]]} />
  </div>
);

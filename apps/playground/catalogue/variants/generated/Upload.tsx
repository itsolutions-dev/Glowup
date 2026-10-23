// GENERATED — do not edit.
// Source: .design-sync/previews/Upload.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Upload, type UploadFile } from "@its/glowup-ui";

const frame: ViewStyle = {
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
  <View style={frame}>
    <Upload multiple />
  </View>
);

export const WithLabelAndLimits = () => (
  <View style={frame}>
    <Upload
      label="Attachments"
      multiple
      accept="image/*,.pdf"
      maxSize={5 * 1024 * 1024}
      maxFiles={4}
      helperText="PDF or images"
    />
  </View>
);

/** `variant="button"` is a plain button; a file can still be dropped on it. */
export const ButtonVariant = () => (
  <View style={frame}>
    <Upload variant="button" prompt="Upload a file" />
    <Upload variant="button" multiple />
  </View>
);

/** A file in each status: done, uploading with its progress, pending, failed with a retry. */
export const FileList = () => (
  <View style={frame}>
    <Upload
      label="Attachments"
      multiple
      defaultValue={files}
      onUpload={async () => {}}
    />
  </View>
);

/** Without `onUpload` files are only collected, for a form to send: no progress, no retry. */
export const CollectOnly = () => (
  <View style={frame}>
    <Upload
      multiple
      defaultValue={[files[0], files[2]].map((f) => ({
        ...f,
        status: "pending" as const,
        progress: undefined,
      }))}
    />
  </View>
);

export const WithError = () => (
  <View style={frame}>
    <Upload label="Contract" error="A signed contract is required" />
  </View>
);

export const Disabled = () => (
  <View style={frame}>
    <Upload label="Attachments" disabled helperText="Uploads are closed" />
    <Upload variant="button" disabled />
    <Upload disabled defaultValue={[files[0]]} />
  </View>
);

export const variants: Variant[] = [
  {
    name: "Dropzone",
    title: "Dropzone",
    description: "A dashed area to drop files on, or press to browse.",
    render: Dropzone,
  },
  {
    name: "WithLabelAndLimits",
    title: "With label and limits",
    render: WithLabelAndLimits,
  },
  {
    name: "ButtonVariant",
    title: "Button variant",
    description:
      '`variant="button"` is a plain button; a file can still be dropped on it.',
    render: ButtonVariant,
  },
  {
    name: "FileList",
    title: "File list",
    description:
      "A file in each status: done, uploading with its progress, pending, failed with a retry.",
    render: FileList,
  },
  {
    name: "CollectOnly",
    title: "Collect only",
    description:
      "Without `onUpload` files are only collected, for a form to send: no progress, no retry.",
    render: CollectOnly,
  },
  {
    name: "WithError",
    title: "With error",
    render: WithError,
  },
  {
    name: "Disabled",
    title: "Disabled",
    render: Disabled,
  },
];

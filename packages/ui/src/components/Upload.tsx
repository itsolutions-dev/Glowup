import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  getStateColor,
  useTheme,
  type Theme,
} from "../providers/ThemeProvider";
import Button from "./Button";
import HelperText from "./HelperText";
import Icons from "./Glyph";
import IconButton from "./IconButton";
import ListItem from "./List/ListItem";
import LinearProgress from "./Progress/LinearProgress";
import Typography from "./Typography";
import { formatBytes, validateFiles } from "./internal/upload";
import type {
  PickedFile,
  UploadFile,
  UploadRejection,
} from "./internal/upload";
import {
  type MaterialCommunityIconsGlyphs,
  type PressableState,
} from "./types";

/** What `Upload` gives an `onUpload` besides the file. */
export interface UploadHandlers {
  /** Reports how far the upload is, from 0 to 1. */
  onProgress: (progress: number) => void;
  /** Aborted when the user cancels or removes the file, or the `Upload` unmounts: stop the request. */
  signal: AbortSignal;
}

export interface UploadProps {
  /** The files in the list. Give it with `onChange` to control the list. */
  value?: UploadFile[];
  /** The files the list starts with, when it is not controlled. */
  defaultValue?: UploadFile[];
  /** Called with the whole list whenever it changes: files added or removed, a status or a progress moved. */
  onChange?: (files: UploadFile[]) => void;
  /**
   * What may be picked, written like the `accept` of an `<input type="file">`:
   * `"image/*,.pdf"`. It filters the web file dialog and is checked on every
   * file added, on every platform (a drop, or what `onPick` returns).
   */
  accept?: string;
  /** Allows several files. Without it a new file replaces the one in the list. Defaults to `false`. */
  multiple?: boolean;
  /** The largest file, in bytes: a bigger one is rejected. */
  maxSize?: number;
  /** How many files the list may hold with `multiple`: the ones past it are rejected. */
  maxFiles?: number;
  disabled?: boolean;
  /** `"dropzone"` is a dashed area to drop files on or press; `"button"` is a plain button (a drop on it still works on web). Defaults to `"dropzone"`. */
  variant?: "dropzone" | "button";
  /**
   * Uploads each new file. Return a promise that resolves when it is done and
   * rejects when it failed; report `onProgress` as it goes and stop on
   * `signal`. The file is listed as `"uploading"` with its progress, then
   * `"done"`, or `"error"` with a retry button. Without it files are only
   * collected (`"pending"`), for you to send with a form.
   */
  onUpload?: (file: UploadFile, handlers: UploadHandlers) => Promise<void>;
  /**
   * Called with the files that were not added (too large, wrong type, past
   * `maxFiles`). Without it the reasons are shown under the field.
   */
  onReject?: (rejections: UploadRejection[]) => void;
  /**
   * Opens a picker and resolves the files chosen (an empty list for none): the
   * app wires `@its/glowup-device/media-picker` or a document picker here. The
   * library imports no picker. On native it is required for the field to be
   * drawn; on web it replaces the browser's file dialog when given.
   */
  onPick?: () => Promise<PickedFile[]>;
  /** A label above the field. */
  label?: string;
  /**
   * What the dropzone or the button says. Defaults to "Drag files here or
   * click to browse" in a web dropzone, else "Choose files" ("Choose a file"
   * without `multiple`).
   */
  prompt?: string;
  /** Supporting text below the field; hidden while an error is shown. */
  helperText?: string;
  /** An error message under the field, in the error colour. */
  error?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

let sequence = 0;
const nextId = () => `upload-${++sequence}`;

const fromBrowser = (file: File): PickedFile => ({
  name: file.name,
  size: file.size,
  type: file.type,
  file,
});

const hasFiles = (event: React.DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes("Files");

const iconFor = (file: UploadFile): MaterialCommunityIconsGlyphs => {
  if (file.type.startsWith("image/")) return "file-image-outline";
  if (file.type.startsWith("video/")) return "file-video-outline";
  if (file.type.startsWith("audio/")) return "file-music-outline";
  if (file.type === "application/pdf") return "file-pdf-box";
  if (file.type.startsWith("text/")) return "file-document-outline";
  return "file-outline";
};

/**
 * Selecting files and, if you give it an `onUpload`, uploading them with a
 * progress bar per file, retry and cancel. On web: a drop target and a file
 * dialog. On native the library has no picker, so the app passes `onPick`
 * (`@its/glowup-device/media-picker`). The list is controlled with `value` and
 * `onChange`, or kept by the component.
 *
 * ```tsx
 * <Upload
 *   label="Attachments"
 *   accept="image/*,.pdf"
 *   multiple
 *   maxSize={5 * 1024 * 1024}
 *   onUpload={async (file, { onProgress, signal }) => {
 *     await send(file.file!, onProgress, signal);
 *   }}
 * />
 * ```
 */
const Upload = ({
  value,
  defaultValue,
  onChange,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  disabled = false,
  variant = "dropzone",
  onUpload,
  onReject,
  onPick,
  label,
  prompt,
  helperText,
  error,
  style,
  testID,
}: UploadProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const web = Platform.OS === "web";

  const [inner, setInner] = useState<UploadFile[]>(defaultValue ?? []);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<UploadRejection[]>([]);
  const files = value ?? inner;

  // What the async parts (an upload finishing, a progress report) read: the
  // list as it is now, and the latest handlers, not the ones of the render that
  // started them.
  const live = useRef({
    files,
    controlled: value !== undefined,
    onChange,
    onUpload,
  });
  useEffect(() => {
    live.current = {
      files,
      controlled: value !== undefined,
      onChange,
      onUpload,
    };
  });
  const controllers = useRef(new Map<string, AbortController>());
  useEffect(() => {
    const running = controllers.current;
    return () => {
      running.forEach((controller) => controller.abort());
      running.clear();
    };
  }, []);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (next: UploadFile[]) => {
    live.current.files = next;
    if (!live.current.controlled) setInner(next);
    live.current.onChange?.(next);
  };
  const patch = (id: string, changes: Partial<UploadFile>) => {
    const current = live.current.files;
    // Gone meanwhile (removed, or cancelled): nothing to update.
    if (!current.some((file) => file.id === id)) return;
    commit(
      current.map((file) => (file.id === id ? { ...file, ...changes } : file)),
    );
  };

  // ponytail: every new file starts at once, no queue. Add a `maxConcurrent`
  // when an app drops hundreds of files on it.
  const run = async (file: UploadFile) => {
    const upload = live.current.onUpload;
    if (!upload) return;
    const controller = new AbortController();
    controllers.current.set(file.id, controller);
    patch(file.id, { status: "uploading", progress: 0, error: undefined });
    try {
      await upload(
        { ...file, status: "uploading", progress: 0, error: undefined },
        {
          signal: controller.signal,
          onProgress: (reported) => {
            const progress = Math.min(1, Math.max(0, reported));
            const current = live.current.files.find((f) => f.id === file.id);
            // Only while it uploads, and only when the percentage moved: a
            // request reports far more often than the bar can show.
            if (
              current?.status === "uploading" &&
              Math.round((current.progress ?? 0) * 100) !==
                Math.round(progress * 100)
            ) {
              patch(file.id, { progress });
            }
          },
        },
      );
      patch(file.id, { status: "done", progress: 1 });
    } catch (reason) {
      // A cancelled upload is already out of the list.
      if (!controller.signal.aborted) {
        patch(file.id, {
          status: "error",
          error:
            reason instanceof Error && reason.message
              ? reason.message
              : "Upload failed",
        });
      }
    } finally {
      controllers.current.delete(file.id);
    }
  };

  const add = (picked: PickedFile[]) => {
    const current = live.current.files;
    const { accepted, rejected: refused } = validateFiles(picked, {
      accept,
      maxSize,
      maxFiles: multiple ? maxFiles : 1,
      count: multiple ? current.length : 0,
    });
    setRejected(refused);
    if (refused.length) onReject?.(refused);
    if (!accepted.length) return;

    const added: UploadFile[] = accepted.map((file) => ({
      ...file,
      id: file.id ?? nextId(),
      status: file.status ?? "pending",
    }));
    if (!multiple) {
      current.forEach((file) => controllers.current.get(file.id)?.abort());
    }
    commit(multiple ? [...current, ...added] : added);
    added
      .filter((file) => file.status === "pending")
      .forEach((file) => void run(file));
  };

  const remove = (id: string) => {
    controllers.current.get(id)?.abort();
    commit(live.current.files.filter((file) => file.id !== id));
  };

  const open = async () => {
    if (disabled) return;
    if (onPick) {
      try {
        add((await onPick()) ?? []);
      } catch {
        // A cancelled or failed pick adds nothing; the picker reports its own errors.
      }
      return;
    }
    inputRef.current?.click();
  };

  const canPick = web || !!onPick;
  if (!canPick && !files.length) return null;

  const single = !multiple;
  const text =
    prompt ??
    (web && variant === "dropzone"
      ? single
        ? "Drag a file here or click to browse"
        : "Drag files here or click to browse"
      : single
        ? "Choose a file"
        : "Choose files");
  const limits = [
    maxSize
      ? `Up to ${formatBytes(maxSize)}${multiple ? " per file" : ""}`
      : "",
    multiple && maxFiles ? `${maxFiles} files at most` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const problem =
    error ??
    (!onReject && rejected.length
      ? [...new Set(rejected.map((rejection) => rejection.message))].join(". ")
      : undefined);

  const trigger =
    variant === "button" ? (
      <Button
        iconName="upload"
        variant="tonal"
        disabled={disabled}
        onClick={() => void open()}
        style={styles.button}
        testID={testID && `${testID}-trigger`}
      >
        {text}
      </Button>
    ) : (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={text}
        accessibilityHint={limits || undefined}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => void open()}
        testID={testID && `${testID}-trigger`}
        style={({ hovered, pressed, focused }: PressableState) => [
          styles.zone,
          (hovered || pressed || focused) && styles.zoneHover,
          dragging && styles.zoneActive,
          !!problem && styles.zoneError,
          disabled && styles.disabled,
        ]}
      >
        <Icons
          name="cloud-upload-outline"
          size={32}
          color={
            dragging ? theme.colors.primary : theme.colors.onSurfaceVariant
          }
        />
        <Typography variant="titleSmall" align="center">
          {text}
        </Typography>
        {!!limits && (
          <Typography
            variant="bodySmall"
            color="onSurfaceVariant"
            align="center"
          >
            {limits}
          </Typography>
        )}
      </Pressable>
    );

  const body = (
    <View style={[styles.root, style]} testID={testID}>
      {!!label && (
        <Typography variant="labelMedium" color="onSurfaceVariant">
          {label}
        </Typography>
      )}
      {canPick && trigger}
      {web && (
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden
          style={{ display: "none" }}
          data-testid={testID && `${testID}-input`}
          onChange={(event) => {
            const picked = Array.from(event.target.files ?? []);
            // So the same file can be picked again.
            event.target.value = "";
            add(picked.map(fromBrowser));
          }}
        />
      )}
      {problem ? (
        <HelperText type="error" padding="none">
          {problem}
        </HelperText>
      ) : helperText ? (
        <HelperText padding="none" disabled={disabled}>
          {helperText}
        </HelperText>
      ) : null}
      {files.length > 0 && (
        <View style={styles.list}>
          {files.map((file) => {
            const percent = Math.round((file.progress ?? 0) * 100);
            const uploading = file.status === "uploading";
            const failed = file.status === "error";
            const status = failed
              ? (file.error ?? "Upload failed")
              : [
                  formatBytes(file.size),
                  uploading
                    ? `Uploading ${percent}%`
                    : file.status === "done"
                      ? "Uploaded"
                      : "",
                ]
                  .filter(Boolean)
                  .join(" · ");
            return (
              <ListItem
                key={file.id}
                icon={iconFor(file)}
                primaryText={file.name}
                secondaryText={
                  <View style={styles.meta}>
                    <Typography
                      variant="bodyMedium"
                      color={failed ? "error" : "onSurfaceVariant"}
                      accessibilityRole={failed ? "alert" : undefined}
                      accessibilityLiveRegion={uploading ? "none" : "polite"}
                    >
                      {status}
                    </Typography>
                    {uploading && (
                      <LinearProgress
                        progress={file.progress ?? 0}
                        decorative
                        height={4}
                      />
                    )}
                  </View>
                }
                action={
                  <View style={styles.actions}>
                    {failed && !!onUpload && (
                      <IconButton
                        icon="refresh"
                        size="large"
                        disabled={disabled}
                        accessibilityLabel={`Retry upload of ${file.name}`}
                        onClick={() => void run(file)}
                      />
                    )}
                    <IconButton
                      icon="close"
                      size="large"
                      disabled={disabled}
                      accessibilityLabel={
                        uploading
                          ? `Cancel upload of ${file.name}`
                          : `Remove ${file.name}`
                      }
                      onClick={() => remove(file.id)}
                    />
                  </View>
                }
              />
            );
          })}
        </View>
      )}
    </View>
  );

  if (!web) return body;
  // The drop target is a real element: `display: contents` keeps it out of the
  // layout, and drag events from everything inside still bubble up to it.
  return (
    <div
      style={{ display: "contents" }}
      onDragOver={(event) => {
        if (!hasFiles(event)) return;
        // Without this the browser opens the dropped file instead.
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDragging(false);
        }
      }}
      onDrop={(event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        setDragging(false);
        if (!disabled) {
          add(Array.from(event.dataTransfer.files).map(fromBrowser));
        }
      }}
    >
      {body}
    </div>
  );
};

export default Upload;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { gap: theme.spacing.xs },
    zone: {
      minHeight: 120,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
      padding: theme.spacing.m,
      borderRadius: theme.shape.large,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: theme.colors.outline,
      backgroundColor: "transparent",
      ...Platform.select({ web: { cursor: "pointer" } }),
    },
    zoneHover: {
      backgroundColor: getStateColor(
        theme.colors.surface,
        theme.colors.primary,
        "hover",
      ),
    },
    zoneActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    zoneError: { borderColor: theme.colors.error },
    disabled: { opacity: 0.38 },
    button: { alignSelf: "flex-start" },
    list: { marginTop: theme.spacing.xs },
    meta: { gap: theme.spacing.xs },
    actions: { flexDirection: "row", alignItems: "center" },
  });

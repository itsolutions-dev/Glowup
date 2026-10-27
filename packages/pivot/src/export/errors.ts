/** Why an export could not be saved: an Expo module the app does not have, or no way to share on this device. */
export class PivotExportError extends Error {
  readonly code: "native-missing" | "unsupported";

  constructor(code: "native-missing" | "unsupported", message: string) {
    super(message);
    this.name = "PivotExportError";
    this.code = code;
  }
}

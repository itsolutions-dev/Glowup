import {
  combinePermissions,
  toPermissionState,
  UNKNOWN,
  UNSUPPORTED,
} from "../core";
import { createSystemSheet } from "../core/systemSheet";

describe("toPermissionState", () => {
  it("maps a granted response", () => {
    expect(
      toPermissionState({
        status: "granted",
        granted: true,
        canAskAgain: true,
      }),
    ).toEqual({ status: "granted", canAskAgain: false });
  });

  it("keeps canAskAgain on a denial", () => {
    expect(
      toPermissionState({
        status: "denied",
        granted: false,
        canAskAgain: false,
      }),
    ).toEqual({ status: "denied", canAskAgain: false });
    expect(
      toPermissionState({
        status: "denied",
        granted: false,
        canAskAgain: true,
      }),
    ).toEqual({ status: "denied", canAskAgain: true });
  });

  it("maps an unasked permission", () => {
    expect(
      toPermissionState({
        status: "undetermined",
        granted: false,
        canAskAgain: true,
      }),
    ).toEqual(UNKNOWN);
  });
});

describe("combinePermissions", () => {
  const granted = { status: "granted", canAskAgain: false } as const;
  const deniedForGood = { status: "denied", canAskAgain: false } as const;
  const deniedAskable = { status: "denied", canAskAgain: true } as const;

  it("is granted only when every part is", () => {
    expect(combinePermissions(granted, granted)).toEqual(granted);
    expect(combinePermissions(granted, UNKNOWN)).toEqual(UNKNOWN);
  });

  it("reports the weakest part", () => {
    expect(combinePermissions(UNKNOWN, deniedAskable).status).toBe("denied");
    expect(combinePermissions(granted, UNSUPPORTED)).toEqual(UNSUPPORTED);
  });

  it("can ask again only if every missing part can", () => {
    expect(combinePermissions(UNKNOWN, deniedAskable).canAskAgain).toBe(true);
    expect(combinePermissions(UNKNOWN, deniedForGood).canAskAgain).toBe(false);
  });

  it("treats no parts as unasked", () => {
    expect(combinePermissions()).toEqual(UNKNOWN);
  });
});

describe("createSystemSheet", () => {
  it("counts a sheet open from the synchronous call until it settles", async () => {
    const sheet = createSystemSheet();
    let finish!: () => void;
    let openWhileCalled: boolean | undefined;
    const running = sheet.run(() => {
      openWhileCalled = sheet.isOpen();
      return new Promise<void>((resolve) => (finish = resolve));
    });
    // Reached synchronously, already counted.
    expect(openWhileCalled).toBe(true);
    const second = sheet.run(async () => "x");
    await expect(second).resolves.toBe("x");
    expect(sheet.isOpen()).toBe(true);
    finish();
    await running;
    expect(sheet.isOpen()).toBe(false);
  });

  it("closes after a failure", async () => {
    const sheet = createSystemSheet();
    await expect(
      sheet.run(() => Promise.reject(new Error("no"))),
    ).rejects.toThrow("no");
    expect(sheet.isOpen()).toBe(false);
  });
});

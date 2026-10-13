import {
  combinePermissions,
  toPermissionState,
  UNKNOWN,
  UNSUPPORTED,
} from "../core";

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

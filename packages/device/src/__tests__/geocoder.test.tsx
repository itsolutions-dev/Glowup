import { renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider } from "..";
import { useGeocoder, type GeocoderAdapter } from "../location";
import {
  buildGeocodedAddress,
  buildGeocodedLocation,
  createMockGeocoderAdapter,
  type MockGeocoderOptions,
} from "../testing";

jest.mock("expo-location", () => ({ LocationAccuracy: {} }));

function wrapperFor(geocoder: GeocoderAdapter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={{ geocoder }}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

async function setup(options?: MockGeocoderOptions) {
  const geocoder = createMockGeocoderAdapter(options);
  const { result } = await renderHook(() => useGeocoder(), {
    wrapper: wrapperFor(geocoder),
  });
  return { geocoder, result };
}

describe("useGeocoder", () => {
  it("geocodes a trimmed address", async () => {
    const { geocoder, result } = await setup();
    const milan = buildGeocodedLocation({ latitude: 45.4642 });
    geocoder.setGeocode([milan]);
    await expect(
      result.current.geocode("  Piazza del Duomo  "),
    ).resolves.toEqual([milan]);
    expect(geocoder.geocodeCalls).toEqual(["Piazza del Duomo"]);
    expect(result.current.isSupported).toBe(true);
  });

  it("reverse-geocodes a point, from a position's coords too", async () => {
    const { geocoder, result } = await setup();
    const address = buildGeocodedAddress({ city: "Milano" });
    geocoder.setReverseGeocode([address]);
    const coords = { latitude: 45.46, longitude: 9.19, accuracy: 5 };
    await expect(result.current.reverseGeocode(coords)).resolves.toEqual([
      address,
    ]);
    expect(geocoder.reverseGeocodeCalls).toEqual([
      { latitude: 45.46, longitude: 9.19 },
    ]);
  });

  it("resolves nothing found as an empty list", async () => {
    const { geocoder, result } = await setup();
    geocoder.setGeocode([]);
    geocoder.setReverseGeocode([]);
    await expect(result.current.geocode("nowhere")).resolves.toEqual([]);
    await expect(
      result.current.reverseGeocode({ latitude: 0, longitude: 0 }),
    ).resolves.toEqual([]);
  });

  it("rejects unsupported without calling the adapter", async () => {
    const { geocoder, result } = await setup({ supported: false });
    expect(result.current.isSupported).toBe(false);
    await expect(result.current.geocode("Roma")).rejects.toMatchObject({
      name: "LocationError",
      code: "unsupported",
    });
    await expect(
      result.current.reverseGeocode({ latitude: 0, longitude: 0 }),
    ).rejects.toMatchObject({ code: "unsupported" });
    expect(geocoder.geocodeCalls).toEqual([]);
    expect(geocoder.reverseGeocodeCalls).toEqual([]);
  });

  it.each([[""], ["   "], [undefined], [42]])(
    "refuses the address %j before the adapter",
    async (address) => {
      const { geocoder, result } = await setup();
      await expect(
        result.current.geocode(address as never),
      ).rejects.toBeInstanceOf(TypeError);
      expect(geocoder.geocodeCalls).toEqual([]);
    },
  );

  it.each([
    [{ latitude: Number.NaN, longitude: 0 }, TypeError],
    [{ latitude: 0, longitude: Infinity }, TypeError],
    [{ latitude: "45", longitude: 9 }, TypeError],
    [null, TypeError],
    [{ latitude: 90.1, longitude: 0 }, RangeError],
    [{ latitude: -90.1, longitude: 0 }, RangeError],
    [{ latitude: 0, longitude: 180.1 }, RangeError],
    [{ latitude: 0, longitude: -180.1 }, RangeError],
  ])("refuses the point %j before the adapter", async (point, type) => {
    const { geocoder, result } = await setup();
    await expect(
      result.current.reverseGeocode(point as never),
    ).rejects.toBeInstanceOf(type);
    expect(geocoder.reverseGeocodeCalls).toEqual([]);
  });

  it("accepts the edges of the globe", async () => {
    const { result } = await setup();
    await expect(
      result.current.reverseGeocode({ latitude: -90, longitude: 180 }),
    ).resolves.toHaveLength(1);
  });

  it("passes the adapter's LocationError through", async () => {
    const { geocoder, result } = await setup();
    geocoder.setGeocode("permission-denied");
    await expect(result.current.geocode("Roma")).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("reports any other failure of a custom adapter as unavailable", async () => {
    const custom: GeocoderAdapter = {
      isSupported: () => true,
      geocode: () => Promise.reject(new Error("HTTP 503")),
      reverseGeocode: () => {
        throw new Error("thrown synchronously");
      },
    };
    const { result } = await renderHook(() => useGeocoder(), {
      wrapper: wrapperFor(custom),
    });
    await expect(result.current.geocode("Roma")).rejects.toMatchObject({
      name: "LocationError",
      code: "unavailable",
      message: "HTTP 503",
    });
    await expect(
      result.current.reverseGeocode({ latitude: 0, longitude: 0 }),
    ).rejects.toMatchObject({ code: "unavailable" });
  });

  it("times out after 15 seconds by default", async () => {
    const { geocoder, result } = await setup();
    geocoder.setGeocode("pending");
    jest.useFakeTimers();
    try {
      const settled = jest.fn();
      const call = result.current.geocode("Roma");
      call.then(settled, settled);
      await jest.advanceTimersByTimeAsync(14_999);
      expect(settled).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(1);
      await expect(call).rejects.toMatchObject({ code: "timeout" });
    } finally {
      jest.useRealTimers();
    }
  });

  it("takes its own timeout", async () => {
    const { geocoder, result } = await setup();
    geocoder.setReverseGeocode("pending");
    await expect(
      result.current.reverseGeocode(
        { latitude: 0, longitude: 0 },
        { timeout: 5 },
      ),
    ).rejects.toEqual(expect.objectContaining({ code: "timeout" }));
  });

  it("keeps its functions stable across renders", async () => {
    const geocoder = createMockGeocoderAdapter();
    const { result, rerender } = await renderHook(() => useGeocoder(), {
      wrapper: wrapperFor(geocoder),
    });
    const first = result.current;
    await rerender({});
    expect(result.current).toBe(first);
  });

  it("is unknown while a static page renders", () => {
    let seen: boolean | null | undefined;
    function Probe() {
      seen = useGeocoder().isSupported;
      return null;
    }
    renderToString(
      <DeviceAdaptersProvider
        adapters={{ geocoder: createMockGeocoderAdapter() }}
      >
        <Probe />
      </DeviceAdaptersProvider>,
    );
    expect(seen).toBeNull();
  });
});

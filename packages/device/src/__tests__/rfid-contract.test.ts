import type { RfidAdapter } from "../rfid";
import {
  createMockRfidAdapter,
  describeRfidAdapterContract,
  type MockRfidOptions,
  type RfidContractHarness,
} from "../testing";

const READER = "00:11:22:33:44:55";

function mockHarness(options: MockRfidOptions = {}): RfidContractHarness {
  const adapter = createMockRfidAdapter({ permission: "granted", ...options });
  return {
    adapter,
    readerId: READER,
    emitTags: (tags) => adapter.emitTags(tags),
    dropConnection: () => adapter.dropConnection(),
    emitLocate: (rssi) => void adapter.emitLocate(rssi),
    pressTrigger: (pressed) => adapter.pressTrigger(pressed),
  };
}

// The mock is the reference adapter: it passes with every optional part,
// and with none.
describeRfidAdapterContract({ describe, it }, () => mockHarness(), {
  name: "the mock, every capability",
});

describeRfidAdapterContract(
  { describe, it },
  () =>
    mockHarness({
      capabilities: {
        locate: false,
        readOnce: false,
        trigger: false,
        discovery: false,
        battery: false,
        readerInfo: false,
        tid: false,
      },
    }),
  { name: "the mock, no optional part" },
);

/** Runs the kit against `harness` and returns the failing tests' messages. */
async function violations(
  setup: () => RfidContractHarness,
): Promise<Record<string, string>> {
  const tests: { name: string; body: () => Promise<void> }[] = [];
  describeRfidAdapterContract(
    {
      describe: (_name, body) => body(),
      it: (name, body) => tests.push({ name, body }),
    },
    setup,
    { timeout: 200 },
  );
  const failures: Record<string, string> = {};
  for (const { name, body } of tests) {
    try {
      await body();
    } catch (error) {
      failures[name] = (error as Error).message;
    }
  }
  return failures;
}

/** The mock with some of its methods replaced. */
function broken(
  change: (adapter: RfidAdapter) => Partial<RfidAdapter>,
  options: MockRfidOptions = {},
) {
  return () => {
    const harness = mockHarness(options);
    // The original methods, before `change` replaces them.
    const original = { ...harness.adapter };
    Object.assign(harness.adapter, change(original));
    return harness;
  };
}

describe("describeRfidAdapterContract", () => {
  it("passes the mock", async () => {
    expect(await violations(() => mockHarness())).toEqual({});
  });

  it("catches an adapter that imports the contract's version", async () => {
    const failures = await violations(
      broken(() => ({ contractVersion: 2 }) as Partial<RfidAdapter>),
    );
    expect(failures["declares the contract it implements"]).toMatch(
      /contractVersion is 2, this kit checks version 1\. Declare it as a number literal/,
    );
  });

  it("catches units left in the vendor's: centi-dBm power, lowercase EPCs, raw RSSI", async () => {
    const failures = await violations(
      broken(
        (adapter) =>
          ({
            powerRange: { min: 500, max: 3000 },
            startInventory: (request, handlers) =>
              adapter.startInventory(request, {
                ...handlers,
                onTags: (reads) =>
                  handlers.onTags(
                    reads.map((read) => ({
                      ...read,
                      epc: read.epc.toLowerCase(),
                      rssi: read.rssi * 10,
                    })),
                  ),
              }),
          }) as Partial<RfidAdapter>,
      ),
    );
    expect(failures["declares the contract it implements"]).toMatch(
      /powerRange.max is 3000: transmit power is dBm/,
    );
    expect(
      failures["reports an inventory's tags in the contract's units"],
    ).toMatch(/onTags\(\) never reported both tags/);
  });

  it("catches reads after a stop and a drop reported without an error", async () => {
    const failures = await violations(
      broken((adapter) => {
        let running: Parameters<RfidAdapter["startInventory"]>[1] | null = null;
        return {
          async startInventory(request, handlers) {
            running = handlers;
            await adapter.startInventory(request, {
              onTags: (reads) => running?.onTags(reads),
              onStop: () => running?.onStop(null),
            });
          },
          // Forgets to detach its listener, and reports the stop.
          async stopInventory() {
            running?.onStop(null);
          },
        };
      }),
    );
    expect(
      failures[
        "stops an inventory: no read and no onStop after stopInventory()"
      ],
    ).toMatch(/after stopInventory\(\) resolved/);
    expect(
      failures["ends an inventory with disconnected when the reader drops"],
    ).toMatch(/must carry RfidError\("disconnected"\), got null/);
  });

  it("catches an adapter that resolves connect() before the reader is ready", async () => {
    const failures = await violations(
      broken((adapter) => ({
        connect(readerId) {
          void adapter.connect(readerId);
          return Promise.resolve();
        },
        getConnection: async () => ({ state: "connecting", readerId: READER }),
      })),
    );
    expect(
      failures["connects, reports the connection and disconnects"],
    ).toMatch(/getConnection\(\) must read disconnected/);
    expect(
      failures["reads and writes the settings in the contract's units"],
    ).toMatch(/connect\(\) resolved but getConnection\(\) reads "connecting"/);
  });

  it("asks the harness for the drivers an optional part needs", async () => {
    const failures = await violations(() => {
      const {
        emitLocate: _locate,
        pressTrigger: _trigger,
        ...rest
      } = mockHarness();
      return rest;
    });
    expect(
      failures["locates one tag natively, in dBm, until stopLocate()"],
    ).toMatch(/the harness needs emitLocate\(\)/);
    expect(failures["hands the trigger over while subscribed"]).toMatch(
      /the harness needs pressTrigger\(\)/,
    );
  });

  it("tears the harness down after a failure too", async () => {
    const teardown = jest.fn();
    await violations(() => ({
      ...broken(() => ({ contractVersion: 9 }) as Partial<RfidAdapter>)(),
      teardown,
    }));
    expect(teardown).toHaveBeenCalledTimes(13);
  });
});

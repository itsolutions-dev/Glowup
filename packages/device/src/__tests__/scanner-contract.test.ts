import type { BarcodeScannerAdapter, BarcodeScannerHandlers } from "../scanner";
import {
  createMockBarcodeScannerAdapter,
  describeBarcodeScannerAdapterContract,
  type BarcodeScannerContractHarness,
  type MockBarcodeScannerOptions,
} from "../testing";

function mockHarness(
  options: MockBarcodeScannerOptions = {},
): BarcodeScannerContractHarness {
  const adapter = createMockBarcodeScannerAdapter(options);
  return {
    adapter,
    emitRead: (read) => void adapter.scan(read),
    pressTrigger: (pressed) => adapter.pressTrigger(pressed),
    takeAway: () => adapter.takeAway(),
  };
}

// The mock is the reference adapter: it passes with every optional part,
// and with none.
describeBarcodeScannerAdapterContract({ describe, it }, () => mockHarness(), {
  name: "the mock, every capability",
});

describeBarcodeScannerAdapterContract(
  { describe, it },
  () => {
    const { adapter, emitRead } = mockHarness({
      softwareTrigger: false,
      scannerInfo: null,
      symbologies: ["code128"],
    });
    return { adapter, emitRead };
  },
  { name: "the mock, no optional part" },
);

/** Runs the kit against `setup` and returns the failing tests' messages. */
async function violations(
  setup: () => BarcodeScannerContractHarness,
): Promise<Record<string, string>> {
  const tests: { name: string; body: () => Promise<void> }[] = [];
  describeBarcodeScannerAdapterContract(
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
  change: (adapter: BarcodeScannerAdapter) => Partial<BarcodeScannerAdapter>,
) {
  return () => {
    const harness = mockHarness();
    const original = {
      open: harness.adapter.open.bind(harness.adapter),
      close: harness.adapter.close.bind(harness.adapter),
    } as BarcodeScannerAdapter;
    Object.assign(harness.adapter, change(original));
    return harness;
  };
}

/** Rewrites each read on its way to the app. */
function rewriting(
  rewrite: (
    read: Parameters<BarcodeScannerHandlers["onRead"]>[0],
  ) => Parameters<BarcodeScannerHandlers["onRead"]>[0],
) {
  return broken((adapter) => ({
    open: (request, handlers) =>
      adapter.open(request, {
        ...handlers,
        onRead: (read) => handlers.onRead(rewrite(read)),
      }),
  }));
}

describe("describeBarcodeScannerAdapterContract", () => {
  it("passes the mock", async () => {
    expect(await violations(() => mockHarness())).toEqual({});
  });

  it("catches an adapter that imports the contract's version", async () => {
    const failures = await violations(
      broken(() => ({ contractVersion: 2 }) as Partial<BarcodeScannerAdapter>),
    );
    expect(failures["declares the contract it implements"]).toMatch(
      /contractVersion is 2, this kit checks version 1\. Declare it as a number literal/,
    );
  });

  it("catches a suffix left on the text and a symbology it cannot name", async () => {
    const failures = await violations(
      rewriting((read) => ({ ...read, data: `${read.data}\n`, aimId: null })),
    );
    expect(failures["delivers each decode once, its text intact"]).toMatch(
      /pass the decoded text on unchanged/,
    );
    const unnamed = await violations(
      rewriting((read) => ({ ...read, aimId: null })),
    );
    expect(unnamed["delivers each decode once, its text intact"]).toMatch(
      /a ean13 read as unknown: give its AIM id/,
    );
  });

  it("catches a listener registered again on every open()", async () => {
    const failures = await violations(
      broken((adapter) => {
        const listeners: BarcodeScannerHandlers[] = [];
        return {
          open: (request, handlers) => {
            listeners.push(handlers);
            return adapter.open(request, {
              ...handlers,
              onRead: (read) => listeners.forEach((l) => l.onRead(read)),
            });
          },
        };
      }),
    );
    expect(
      failures["applies a new request while open, keeping one delivery"],
    ).toMatch(/One decode reached onRead\(\) 2 times/);
  });

  it("catches reads after close() and a close reported to onClose", async () => {
    const failures = await violations(
      broken((adapter) => {
        let running: BarcodeScannerHandlers | null = null;
        return {
          open: (request, handlers) => {
            running = handlers;
            return adapter.open(request, handlers);
          },
          // Forgets to detach its listener, and reports the close.
          close: async () => {
            running?.onClose(null);
          },
        };
      }),
    );
    expect(
      failures["stops reading on close(), and close() is safe to repeat"],
    ).toMatch(/onRead\(\) was called after close\(\) resolved/);
  });

  it("catches a software trigger that works while closed", async () => {
    const failures = await violations(
      broken(() => ({ softwareTrigger: async () => {} })),
    );
    expect(failures["needs the scanner open for the software trigger"]).toMatch(
      /must reject with BarcodeScannerError\(not-open\), got a resolve/,
    );
  });
});

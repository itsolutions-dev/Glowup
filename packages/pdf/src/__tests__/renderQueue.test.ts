import { createRenderQueue } from "../renderQueue";
import type { PdfNative } from "../types";

/** Lets every promise already settled run its handlers. */
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** A native side whose drawings finish when the test says so. */
const makeNative = () => {
  const asked: { index: number; width: number }[] = [];
  const open: {
    index: number;
    done: (image: string) => void;
    fail: (error: Error) => void;
  }[] = [];
  const native = {
    renderPage: (_uri: string, index: number, width: number) => {
      asked.push({ index, width });
      return new Promise<string>((resolve, reject) => {
        open.push({ index, done: resolve, fail: reject });
      });
    },
  } as unknown as PdfNative;
  const finish = async (index: number) => {
    const slot = open.splice(
      open.findIndex((o) => o.index === index),
      1,
    )[0];
    slot.done(`file:///${index}.jpg`);
    await flush();
  };
  return { native, asked, open, finish };
};

const indexes = (asked: { index: number }[]) => asked.map((a) => a.index);

describe("render queue", () => {
  it("gives the module two drawings at a time and starts the next when one ends", async () => {
    const { native, asked, finish } = makeNative();
    const queue = createRenderQueue(native, "file:///a.pdf");
    [0, 1, 2, 3].forEach((i) => queue.render(i, 600));
    expect(indexes(asked)).toEqual([0, 1]);
    await finish(0);
    expect(indexes(asked)).toEqual([0, 1, 2]);
    await finish(1);
    expect(indexes(asked)).toEqual([0, 1, 2, 3]);
  });

  it("draws the page nearest the one being read first, not the one asked first", async () => {
    const { native, asked, finish } = makeNative();
    const queue = createRenderQueue(native, "file:///a.pdf");
    // Two fill the module; these wait, asked in the order of a fling.
    queue.render(0, 600);
    queue.render(1, 600);
    [5, 6, 7, 8].forEach((i) => queue.render(i, 600));
    queue.reading(9); // the reader stopped on page 9 (index 8)
    await finish(0);
    expect(indexes(asked).slice(2)).toEqual([8]);
    await finish(1);
    expect(indexes(asked).slice(3)).toEqual([7]);
  });

  it("prefers the page ahead when two are as near", async () => {
    const { native, asked, finish } = makeNative();
    const queue = createRenderQueue(native, "file:///a.pdf");
    queue.reading(5);
    queue.render(0, 600);
    queue.render(1, 600);
    queue.render(2, 600); // index 2 is two behind page 5 (index 4)
    queue.render(6, 600); // index 6 is two ahead
    await finish(0);
    expect(indexes(asked).slice(2)).toEqual([6]);
  });

  it("does not start a drawing that was withdrawn while it waited", async () => {
    const { native, asked, finish } = makeNative();
    const queue = createRenderQueue(native, "file:///a.pdf");
    queue.render(0, 600);
    queue.render(1, 600);
    const gone = queue.render(2, 600);
    queue.render(3, 600);
    gone.cancel();
    await finish(0);
    expect(indexes(asked)).toEqual([0, 1, 3]);
  });

  it("keeps the result of a withdrawn drawing that had begun, for the next ask", async () => {
    const { native, asked, finish } = makeNative();
    const queue = createRenderQueue(native, "file:///a.pdf");
    const first = queue.render(0, 600);
    first.cancel();
    await finish(0);
    const again = queue.render(0, 600);
    await expect(again.promise).resolves.toBe("file:///0.jpg");
    expect(indexes(asked)).toEqual([0]);
  });

  it("joins a second ask for a drawing already on its way", async () => {
    const { native, asked, finish } = makeNative();
    const queue = createRenderQueue(native, "file:///a.pdf");
    const first = queue.render(0, 600);
    first.cancel();
    const second = queue.render(0, 600);
    expect(indexes(asked)).toEqual([0]);
    await finish(0);
    await expect(second.promise).resolves.toBe("file:///0.jpg");
  });

  it("draws the same page again at another width, and remembers each", async () => {
    const { native, asked, finish } = makeNative();
    const queue = createRenderQueue(native, "file:///a.pdf");
    queue.render(0, 600);
    await finish(0);
    queue.render(0, 1200);
    expect(asked.map((a) => a.width)).toEqual([600, 1200]);
    await finish(0);
    await expect(queue.render(0, 600).promise).resolves.toBe("file:///0.jpg");
    expect(asked).toHaveLength(2);
  });

  it("rejects what failed, does not remember it, and asks again next time", async () => {
    const { native, asked, open } = makeNative();
    const queue = createRenderQueue(native, "file:///a.pdf");
    const request = queue.render(0, 600);
    const failure = expect(request.promise).rejects.toThrow("boom");
    open[0].fail(new Error("boom"));
    await failure;
    await flush();
    queue.render(0, 600);
    expect(indexes(asked)).toEqual([0, 0]);
  });

  it("forgets the oldest drawings beyond its cache size", async () => {
    const { native, asked, finish } = makeNative();
    const queue = createRenderQueue(native, "file:///a.pdf", { cacheSize: 2 });
    for (const i of [0, 1, 2]) {
      queue.render(i, 600);
      await finish(i);
    }
    queue.render(0, 600); // forgotten: drawn again
    queue.render(2, 600); // still remembered
    expect(indexes(asked)).toEqual([0, 1, 2, 0]);
  });
});

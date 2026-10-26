import type { PdfNative } from "./types";

type Waiter = {
  resolve: (uri: string) => void;
  reject: (error: unknown) => void;
};

type Job = {
  key: string;
  index: number;
  width: number;
  waiters: Set<Waiter>;
  running: boolean;
};

/** A drawing asked for. `cancel` withdraws it: a request nobody waits for any more is not started. */
export type RenderRequest = { promise: Promise<string>; cancel: () => void };

export type RenderQueue = {
  render(index: number, width: number): RenderRequest;
  /** The page being read, from 1: the pages nearest to it are drawn first. */
  reading(page: number): void;
};

type Options = {
  /** How many drawings the module is given at once. It draws one at a time; the second keeps it busy. */
  inFlight?: number;
  /** How many finished drawings are remembered, so that scrolling back does not draw them again. */
  cacheSize?: number;
};

/**
 * Stands between the pages and `native.renderPage`. The module cannot stop a drawing that has begun, and a
 * list that mounts pages while it is flung over asks for far more than will ever be seen: asked directly,
 * every one of them was drawn, in the order asked, before the page the reader stopped on. Here a drawing waits
 * in the queue, can be withdrawn while it waits, and is chosen by its distance from the page being read.
 * A finished drawing is kept (its file stays in the module's cache until the document closes).
 */
export const createRenderQueue = (
  native: PdfNative,
  uri: string,
  { inFlight = 2, cacheSize = 60 }: Options = {},
): RenderQueue => {
  const cache = new Map<string, string>();
  // Waiting and running drawings, by what they draw: a second page asking for the same one joins it.
  const jobs = new Map<string, Job>();
  let running = 0;
  let page = 1;

  // Nearest first; on a tie the page ahead, since the reader moves forward more often than back.
  const rank = (job: Job) => {
    const from = page - 1;
    return Math.abs(job.index - from) * 2 + (job.index < from ? 1 : 0);
  };

  const remember = (key: string, image: string) => {
    cache.delete(key);
    cache.set(key, image);
    if (cache.size > cacheSize) {
      cache.delete(cache.keys().next().value as string);
    }
  };

  const pump = () => {
    while (running < inFlight) {
      let best: Job | undefined;
      jobs.forEach((job) => {
        if (!job.running && (!best || rank(job) < rank(best))) best = job;
      });
      if (!best) return;
      start(best);
    }
  };

  const start = (job: Job) => {
    job.running = true;
    running += 1;
    native
      .renderPage(uri, job.index, job.width)
      .then(
        (image) => {
          remember(job.key, image);
          job.waiters.forEach((w) => w.resolve(image));
        },
        (error) => job.waiters.forEach((w) => w.reject(error)),
      )
      .finally(() => {
        jobs.delete(job.key);
        running -= 1;
        pump();
      });
  };

  return {
    reading(next) {
      page = next;
    },
    render(index, width) {
      const key = `${index}|${width}`;
      const done = cache.get(key);
      if (done !== undefined) {
        remember(key, done);
        return { promise: Promise.resolve(done), cancel: () => {} };
      }

      let job = jobs.get(key);
      if (!job) {
        job = { key, index, width, waiters: new Set(), running: false };
        jobs.set(key, job);
      }
      const joined = job;
      let waiter!: Waiter;
      const promise = new Promise<string>((resolve, reject) => {
        waiter = { resolve, reject };
      });
      joined.waiters.add(waiter);
      pump();

      return {
        promise,
        cancel: () => {
          joined.waiters.delete(waiter);
          if (
            !joined.running &&
            joined.waiters.size === 0 &&
            jobs.get(key) === joined
          ) {
            jobs.delete(key);
          }
        },
      };
    },
  };
};

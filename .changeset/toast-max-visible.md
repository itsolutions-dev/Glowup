---
"@its/glowup-ui": minor
---

`ToastProvider` takes `maxVisible` (default `1`, as before): up to that many toasts show together, stacked with a gap (top positions downward, bottom ones upward, the newest nearest the edge), each on its own timer, the rest waiting and appearing in order as slots free.
Fixes `useToast()`: it returned a new object on every enqueue, so an effect depending on it looped and every consumer re-rendered. It is now one object for the provider's life (`toast.queue` is read when accessed and is not reactive). Showing a toast with the `id` of a queued one replaces it in its place and restarts its timer.

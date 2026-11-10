---
"@its/glowup-device": patch
---

RFID, Bluetooth and app lock fixes:

- A `connect()` that times out no longer disconnects the reader a newer `connect()` reached in
  the meantime.
- The stop at the end of a reader search's or a Bluetooth scan's timeout, and the one on going
  to the background, no longer surface as an unhandled rejection when the adapter refuses.
- `useRfidTrigger` handlers may return a mode's promise (`onPress: () => inventory.start()`, as
  documented): its rejection, already in the mode's `error`, is no longer unhandled.
- `useAppLock` locks when the clock went backwards while the app was in the background, where
  it used to skip the lock.

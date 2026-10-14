import { useSyncExternalStore } from "react";

export interface TaskLogEntry {
  id: number;
  task: "trip" | "sites";
  text: string;
  at: number;
}

const LIMIT = 20;

// In memory: what the tasks received since the app started. A real app
// stores or sends it from the handler; a relaunch here starts empty.
let entries: readonly TaskLogEntry[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

function emit(next: readonly TaskLogEntry[]) {
  entries = next;
  listeners.forEach((listener) => listener());
}

export function recordTaskEvent(task: TaskLogEntry["task"], text: string) {
  emit(
    [{ id: nextId++, task, text, at: Date.now() }, ...entries].slice(0, LIMIT),
  );
}

export function clearTaskLog() {
  emit([]);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const NONE: readonly TaskLogEntry[] = [];
const getEntries = () => entries;
const getNoEntries = () => NONE;

/** The newest first; empty while a static page renders. */
export function useTaskLog(): readonly TaskLogEntry[] {
  return useSyncExternalStore(subscribe, getEntries, getNoEntries);
}

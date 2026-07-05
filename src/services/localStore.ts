import { useSyncExternalStore } from "react";
import type { AppState } from "../types";
import { initialAppState } from "../data/demoSeed";

const STORE_KEY = "spencer_barber_shop_state_v1";
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedState: AppState | null = null;

function cloneInitialState(): AppState {
  return JSON.parse(JSON.stringify(initialAppState)) as AppState;
}

export function getAppState(): AppState {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) {
    const seed = cloneInitialState();
    cachedRaw = JSON.stringify(seed);
    cachedState = seed;
    localStorage.setItem(STORE_KEY, cachedRaw);
    return seed;
  }

  if (raw === cachedRaw && cachedState) {
    return cachedState;
  }

  try {
    cachedRaw = raw;
    cachedState = JSON.parse(raw) as AppState;
    return cachedState;
  } catch {
    const seed = cloneInitialState();
    cachedRaw = JSON.stringify(seed);
    cachedState = seed;
    localStorage.setItem(STORE_KEY, cachedRaw);
    return seed;
  }
}

export function saveAppState(state: AppState): void {
  cachedState = state;
  cachedRaw = JSON.stringify(state);
  localStorage.setItem(STORE_KEY, cachedRaw);
  listeners.forEach((listener) => listener());
}

export function mutateAppState(updater: (state: AppState) => AppState): AppState {
  const current = getAppState();
  const next = updater(current);
  saveAppState(next);
  return next;
}

export function resetAppState(): AppState {
  const seed = cloneInitialState();
  saveAppState(seed);
  return seed;
}

export function subscribeAppState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppData(): AppState {
  return useSyncExternalStore(subscribeAppState, getAppState, getAppState);
}

export function exportAppState(): string {
  return JSON.stringify(getAppState(), null, 2);
}

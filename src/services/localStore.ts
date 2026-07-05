import { useSyncExternalStore } from "react";
import type { AppState } from "../types";
import { initialAppState } from "../data/demoSeed";
import { scheduleCloudSync, startCloudSync } from "./cloudSync";

const STORE_KEY = "spencer_barber_shop_state_v1";
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedState: AppState | null = null;
let initialized = false;

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

function writeState(state: AppState, options?: { skipCloudSync?: boolean }): void {
  cachedState = state;
  cachedRaw = JSON.stringify(state);
  localStorage.setItem(STORE_KEY, cachedRaw);
  listeners.forEach((listener) => listener());
  if (!options?.skipCloudSync) {
    scheduleCloudSync(state);
  }
}

export function initializeAppStore(): () => void {
  if (initialized) {
    return () => undefined;
  }

  initialized = true;
  getAppState();

  return startCloudSync({
    applyState(updater) {
      const current = getAppState();
      writeState(updater(current), { skipCloudSync: true });
    }
  });
}

export function saveAppState(state: AppState): void {
  writeState(state);
}

export function mutateAppState(updater: (state: AppState) => AppState): AppState {
  const current = getAppState();
  const next = updater(current);
  writeState(next);
  return next;
}

export function resetAppState(): AppState {
  const seed = cloneInitialState();
  writeState(seed);
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

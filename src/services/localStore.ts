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

function repairState(state: AppState): AppState {
  const seed = cloneInitialState();
  let repaired = false;

  const next: AppState = {
    ...seed,
    ...state,
    business: {
      ...seed.business,
      ...state.business
    },
    paymentSettings: {
      ...seed.paymentSettings,
      ...state.paymentSettings
    },
    users: Array.isArray(state.users) && state.users.length ? state.users : seed.users,
    barbers: Array.isArray(state.barbers) && state.barbers.length ? state.barbers : seed.barbers,
    services: Array.isArray(state.services) && state.services.length ? state.services : seed.services,
    inspiration: Array.isArray(state.inspiration) && state.inspiration.length ? state.inspiration : seed.inspiration,
    queue: Array.isArray(state.queue) ? state.queue : [],
    appointments: Array.isArray(state.appointments) ? state.appointments : [],
    payments: Array.isArray(state.payments) ? state.payments : []
  };

  repaired =
    !Array.isArray(state.users) ||
    state.users.length === 0 ||
    !Array.isArray(state.barbers) ||
    state.barbers.length === 0 ||
    !Array.isArray(state.services) ||
    state.services.length === 0 ||
    !Array.isArray(state.inspiration) ||
    state.inspiration.length === 0;

  if (repaired) {
    console.info("Se restauró información base de la barbería para evitar una pantalla vacía.");
  }

  return next;
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
    const parsed = JSON.parse(raw) as AppState;
    const repaired = repairState(parsed);
    cachedRaw = JSON.stringify(repaired);
    cachedState = repaired;

    if (cachedRaw !== raw) {
      localStorage.setItem(STORE_KEY, cachedRaw);
    }

    return repaired;
  } catch {
    const seed = cloneInitialState();
    cachedRaw = JSON.stringify(seed);
    cachedState = seed;
    localStorage.setItem(STORE_KEY, cachedRaw);
    return seed;
  }
}

function writeState(state: AppState, options?: { skipCloudSync?: boolean }): void {
  const repaired = repairState(state);
  cachedState = repaired;
  cachedRaw = JSON.stringify(repaired);
  localStorage.setItem(STORE_KEY, cachedRaw);
  listeners.forEach((listener) => listener());
  if (!options?.skipCloudSync) {
    scheduleCloudSync(repaired);
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

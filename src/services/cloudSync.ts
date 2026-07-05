import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore
} from "firebase/firestore";
import type { AppState } from "../types";
import { firestoreDb, isFirebaseConfigured } from "../config/firebase";

type CollectionKey = keyof Pick<AppState, "users" | "barbers" | "services" | "queue" | "appointments" | "payments">;
type AppStateUpdater = (state: AppState) => AppState;

const COLLECTION_KEYS: CollectionKey[] = ["users", "barbers", "services", "queue", "appointments", "payments"];

const remoteIds = new Map<CollectionKey, Set<string>>(
  COLLECTION_KEYS.map((key) => [key, new Set<string>()])
);

let initialized = false;
let stopListeners: Array<() => void> = [];
let pendingState: AppState | null = null;
let syncTimer: number | null = null;
let applyRemoteState: ((updater: AppStateUpdater) => void) | null = null;

function collectionPath(key: CollectionKey): string {
  return key;
}

function cloneSet(source?: Set<string>): Set<string> {
  return new Set(source ? Array.from(source) : []);
}

function normalizeDocs<T extends DocumentData>(items: T[]): T[] {
  return items.map((item) => JSON.parse(JSON.stringify(item)) as T);
}

async function syncCollection(db: Firestore, key: CollectionKey, items: Array<{ id: string }>): Promise<void> {
  const batch = writeBatch(db);
  const knownRemoteIds = cloneSet(remoteIds.get(key));
  const nextIds = new Set<string>();

  items.forEach((item) => {
    nextIds.add(item.id);
    batch.set(doc(db, collectionPath(key), item.id), item, { merge: false });
  });

  knownRemoteIds.forEach((id) => {
    if (!nextIds.has(id)) {
      batch.delete(doc(db, collectionPath(key), id));
    }
  });

  await batch.commit();
  remoteIds.set(key, nextIds);
}

async function pushStateToCloud(state: AppState): Promise<void> {
  if (!isFirebaseConfigured || !firestoreDb) return;
  const db = firestoreDb;

  await setDoc(doc(db, "settings", "business"), state.business, { merge: false });
  await setDoc(doc(db, "settings", "payment"), state.paymentSettings, { merge: false });

  for (const key of COLLECTION_KEYS) {
    await syncCollection(db, key, normalizeDocs(state[key] as Array<{ id: string }>));
  }
}

function scheduleFlush(): void {
  if (syncTimer) {
    window.clearTimeout(syncTimer);
  }

  syncTimer = window.setTimeout(() => {
    syncTimer = null;
    const stateToSync = pendingState;
    pendingState = null;
    if (!stateToSync) return;

    pushStateToCloud(stateToSync).catch((error) => {
      console.error("No se pudo sincronizar con Firebase.", error);
    });
  }, 250);
}

export function scheduleCloudSync(state: AppState): void {
  if (!isFirebaseConfigured || !firestoreDb) return;
  pendingState = JSON.parse(JSON.stringify(state)) as AppState;
  scheduleFlush();
}

export function startCloudSync(input: { applyState: (updater: AppStateUpdater) => void }): () => void {
  if (!isFirebaseConfigured || !firestoreDb) {
    return () => undefined;
  }
  const db = firestoreDb;

  applyRemoteState = input.applyState;

  if (initialized) {
    return () => undefined;
  }

  initialized = true;

  const settingsListener = onSnapshot(collection(db, "settings"), (snapshot) => {
    if (!applyRemoteState) return;

    const settings = snapshot.docs.reduce<Record<string, DocumentData>>((accumulator, entry) => {
      accumulator[entry.id] = entry.data();
      return accumulator;
    }, {});

    applyRemoteState((state) => ({
      ...state,
      business: (settings.business as AppState["business"]) || state.business,
      paymentSettings: (settings.payment as AppState["paymentSettings"]) || state.paymentSettings
    }));
  });

  const collectionListeners = COLLECTION_KEYS.map((key) =>
    onSnapshot(collection(db, collectionPath(key)), (snapshot) => {
      remoteIds.set(
        key,
        new Set(snapshot.docs.map((entry) => entry.id))
      );

      if (!applyRemoteState) return;

      const items = snapshot.docs.map((entry) => entry.data()) as AppState[CollectionKey];
      applyRemoteState((state) => ({
        ...state,
        [key]: items
      }));
    })
  );

  stopListeners = [settingsListener, ...collectionListeners];

  return () => {
    stopListeners.forEach((stop) => stop());
    stopListeners = [];
    initialized = false;
  };
}

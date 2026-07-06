import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore
} from "firebase/firestore";
import type { AppState, QueueItem } from "../types";
import { firestoreDb, isFirebaseConfigured } from "../config/firebase";

type CollectionKey = keyof Pick<AppState, "users" | "barbers" | "services" | "inspiration" | "queue" | "appointments" | "payments">;
type AppStateUpdater = (state: AppState) => AppState;

const COLLECTION_KEYS: CollectionKey[] = ["users", "barbers", "services", "inspiration", "queue", "appointments", "payments"];
const PROTECTED_EMPTY_COLLECTIONS: CollectionKey[] = ["users", "barbers", "services", "inspiration"];
const PUBLIC_WRITE_COLLECTIONS: CollectionKey[] = ["queue", "appointments", "payments"];

const remoteIds = new Map<CollectionKey, Set<string>>(
  COLLECTION_KEYS.map((key) => [key, new Set<string>()])
);
const syncedDocHashes = new Map<CollectionKey, Map<string, string>>(
  COLLECTION_KEYS.map((key) => [key, new Map<string, string>()])
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

function toPlain<T>(item: T): T {
  return JSON.parse(JSON.stringify(item)) as T;
}

function serializeDoc(item: unknown): string {
  return JSON.stringify(toPlain(item));
}

function normalizeDocs<T extends DocumentData>(items?: T[]): T[] {
  return (items || []).map((item) => toPlain(item) as T);
}

function isProtectedEmptyCollection(key: CollectionKey): boolean {
  return PROTECTED_EMPTY_COLLECTIONS.includes(key);
}

function logSyncWarning(label: string, error: unknown): void {
  console.warn(`Sincronización parcial omitida: ${label}`, error);
}

function rememberSyncedDoc(key: CollectionKey, id: string, item: unknown): void {
  remoteIds.get(key)?.add(id);
  syncedDocHashes.get(key)?.set(id, serializeDoc(item));
}

export async function syncQueueItemNow(item: QueueItem): Promise<void> {
  if (!isFirebaseConfigured || !firestoreDb) return;

  const plain = toPlain(item);

  try {
    await setDoc(doc(firestoreDb, "queue", plain.id), plain, { merge: false });
    rememberSyncedDoc("queue", plain.id, plain);
  } catch (error) {
    logSyncWarning(`queue/${plain.id}`, error);
  }
}

async function syncCollection(
  db: Firestore,
  key: CollectionKey,
  items: Array<{ id: string }>,
  options?: { deleteMissing?: boolean; onlyChanged?: boolean }
): Promise<void> {
  const batch = writeBatch(db);
  const knownRemoteIds = cloneSet(remoteIds.get(key));
  const knownHashes = syncedDocHashes.get(key) || new Map<string, string>();
  const nextIds = new Set<string>();
  const writtenItems: Array<{ id: string; item: { id: string } }> = [];
  let writes = 0;

  items.forEach((item) => {
    nextIds.add(item.id);
    const nextHash = serializeDoc(item);

    if (options?.onlyChanged && knownRemoteIds.has(item.id) && knownHashes.get(item.id) === nextHash) {
      return;
    }

    batch.set(doc(db, collectionPath(key), item.id), item, { merge: false });
    writtenItems.push({ id: item.id, item });
    writes += 1;
  });

  if (options?.deleteMissing !== false) {
    knownRemoteIds.forEach((id) => {
      if (!nextIds.has(id)) {
        batch.delete(doc(db, collectionPath(key), id));
        writes += 1;
      }
    });
  }

  if (writes === 0) {
    return;
  }

  await batch.commit();
  remoteIds.set(key, nextIds);
  writtenItems.forEach(({ id, item }) => rememberSyncedDoc(key, id, item));
}

async function pushStateToCloud(state: AppState): Promise<void> {
  if (!isFirebaseConfigured || !firestoreDb) return;
  const db = firestoreDb;

  await Promise.allSettled([
    setDoc(doc(db, "settings", "business"), state.business, { merge: false }),
    setDoc(doc(db, "settings", "payment"), state.paymentSettings, { merge: false })
  ]).then((results) => {
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        logSyncWarning(index === 0 ? "settings/business" : "settings/payment", result.reason);
      }
    });
  });

  for (const key of PUBLIC_WRITE_COLLECTIONS) {
    try {
      await syncCollection(db, key, normalizeDocs(state[key] as Array<{ id: string }> | undefined), {
        deleteMissing: false,
        onlyChanged: true
      });
    } catch (error) {
      logSyncWarning(key, error);
    }
  }

  for (const key of COLLECTION_KEYS.filter((entry) => !PUBLIC_WRITE_COLLECTIONS.includes(entry))) {
    try {
      await syncCollection(db, key, normalizeDocs(state[key] as Array<{ id: string }> | undefined));
    } catch (error) {
      logSyncWarning(key, error);
    }
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
  pendingState = toPlain(state);
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
    if (!applyRemoteState || snapshot.empty) return;

    const settings = snapshot.docs.reduce<Record<string, DocumentData>>((accumulator, entry) => {
      accumulator[entry.id] = entry.data();
      return accumulator;
    }, {});

    applyRemoteState((state) => ({
      ...state,
      business: (settings.business as AppState["business"]) || state.business,
      paymentSettings: (settings.payment as AppState["paymentSettings"]) || state.paymentSettings
    }));
  }, (error) => {
    logSyncWarning("listener settings", error);
  });

  const collectionListeners = COLLECTION_KEYS.map((key) =>
    onSnapshot(collection(db, collectionPath(key)), (snapshot) => {
      const ids = new Set(snapshot.docs.map((entry) => entry.id));
      remoteIds.set(key, ids);

      const hashes = new Map<string, string>();
      snapshot.docs.forEach((entry) => {
        hashes.set(entry.id, serializeDoc(entry.data()));
      });
      syncedDocHashes.set(key, hashes);

      if (!applyRemoteState) return;

      if (snapshot.empty && isProtectedEmptyCollection(key)) {
        return;
      }

      const items = snapshot.docs.map((entry) => entry.data()) as AppState[CollectionKey];
      applyRemoteState((state) => ({
        ...state,
        [key]: items
      }));
    }, (error) => {
      logSyncWarning(`listener ${key}`, error);
    })
  );

  stopListeners = [settingsListener, ...collectionListeners];

  return () => {
    stopListeners.forEach((stop) => stop());
    stopListeners = [];
    initialized = false;
  };
}

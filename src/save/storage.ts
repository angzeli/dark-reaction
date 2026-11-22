/**
 * A tiny key–value interface over localStorage that never throws. Private
 * windows, blocked storage and full quotas all degrade to "not saved"
 * instead of crashing the game; if localStorage is unavailable entirely,
 * an in-memory store keeps the current session working.
 */
export interface KV {
  get(key: string): string | null;
  /** Returns false if the write failed (blocked or full). */
  set(key: string, value: string): boolean;
  remove(key: string): void;
  keys(): string[];
  /** True when writes go to real persistent storage. */
  readonly persistent: boolean;
}

export function memoryStorage(): KV {
  const map = new Map<string, string>();
  return {
    persistent: false,
    get: (k) => map.get(k) ?? null,
    set: (k, v) => {
      map.set(k, v);
      return true;
    },
    remove: (k) => void map.delete(k),
    keys: () => [...map.keys()],
  };
}

/** Wrap a Storage (normally window.localStorage) so no call can throw. */
export function wrapStorage(storage: Storage): KV {
  return {
    persistent: true,
    get(k) {
      try {
        return storage.getItem(k);
      } catch {
        return null;
      }
    },
    set(k, v) {
      try {
        storage.setItem(k, v);
        return true;
      } catch {
        return false;
      }
    },
    remove(k) {
      try {
        storage.removeItem(k);
      } catch {
        /* ignore */
      }
    },
    keys() {
      try {
        const out: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i);
          if (k !== null) out.push(k);
        }
        return out;
      } catch {
        return [];
      }
    },
  };
}

/**
 * localStorage if it can at least be read; otherwise memory. A full quota
 * must not hide existing saves, so the probe is a read, not a write: if
 * writes then fail, they report failure and the player is told.
 */
export function browserStorage(): KV {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return memoryStorage();
    storage.getItem('dark-reaction.probe');
    return wrapStorage(storage);
  } catch {
    return memoryStorage();
  }
}

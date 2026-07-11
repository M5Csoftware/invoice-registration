interface StorageResult {
  value: string | null;
}

interface WindowStorage {
  get: (key: string, flag: boolean) => Promise<StorageResult | null>;
  set: (key: string, value: string, flag: boolean) => Promise<void>;
}

declare global {
  interface Window {
    storage?: WindowStorage;
  }
}

const fallbackGet = async (key: string): Promise<StorageResult | null> => {
  try {
    const val = localStorage.getItem(key);
    return { value: val };
  } catch (e) {
    console.error(`localStorage.getItem failed for key ${key}`, e);
    return null;
  }
};

const fallbackSet = async (key: string, value: string): Promise<void> => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error(`localStorage.setItem failed for key ${key}`, e);
  }
};

export const getStorageItem = async (key: string): Promise<string | null> => {
  if (window.storage && typeof window.storage.get === 'function') {
    try {
      const res = await window.storage.get(key, true);
      return res ? res.value : null;
    } catch (e) {
      console.warn(`window.storage.get failed for key ${key}, falling back to localStorage`, e);
    }
  }
  const res = await fallbackGet(key);
  return res ? res.value : null;
};

export const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (window.storage && typeof window.storage.set === 'function') {
    try {
      await window.storage.set(key, value, true);
      return;
    } catch (e) {
      console.warn(`window.storage.set failed for key ${key}, falling back to localStorage`, e);
    }
  }
  await fallbackSet(key, value);
};

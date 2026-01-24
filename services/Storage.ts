
/**
 * Advanced Storage Service with TTL (Time-To-Live) support
 */
export const Storage = {
  /**
   * Save data with an optional expiry in minutes
   */
  set: (key: string, value: any, ttlMinutes?: number) => {
    const item = {
      value,
      expiry: ttlMinutes ? Date.now() + ttlMinutes * 60 * 1000 : null,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  /**
   * Retrieve data, returns null if expired
   */
  get: <T>(key: string): T | null => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      if (item.expiry && Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value as T;
    } catch (e) {
      return null;
    }
  },

  /**
   * Remove specific key
   */
  remove: (key: string) => {
    localStorage.removeItem(key);
  },

  /**
   * Wipe all society-related cache
   */
  clearAll: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith('society_')) localStorage.removeItem(k);
    });
  }
};

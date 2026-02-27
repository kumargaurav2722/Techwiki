export const cacheService = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(`techwiki_${key}`);
    } catch (e) {
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(`techwiki_${key}`, value);
    } catch (e) {
      console.warn("Failed to save to localStorage", e);
    }
  }
};

// Utility helpers to keep UI responsive in E2E/dev environments
// where backend services might be unavailable. When Playwright runs
// (navigator.webdriver === true) or when VITE_E2E_MOCK is set, we
// return lightweight mock data instead of blocking on network calls.

export const isMockEnv = (): boolean => {
  if (typeof window === 'undefined') return false;
  if ((window as any).__E2E_MOCK__ === true) return true;
  if (import.meta.env.VITE_E2E_MOCK === 'true') return true;
  return navigator.webdriver === true;
};

export const withMockFallback = async <T>(fn: () => Promise<T>, fallback: T, options?: { useFallbackOnError?: boolean }): Promise<T> => {
  const shouldMock = isMockEnv();
  if (shouldMock) return fallback;

  const useFallbackOnError = options?.useFallbackOnError ?? false;

  try {
    const result = await Promise.race([
      fn(),
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    return result as T;
  } catch (err) {
    if (useFallbackOnError) {
      console.warn('[mock-fallback] returning mocked data due to error/timeout:', err);
      return fallback;
    }
    throw err;
  }
};

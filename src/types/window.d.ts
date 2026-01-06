/**
 * Window Extensions for Third-Party Libraries
 * Proper TypeScript declarations for global window objects
 */

interface GoogleTagManager {
  (command: 'event', eventName: string, params?: Record<string, string | number | boolean>): void;
  (command: 'set', key: string, value: Record<string, unknown> | string): void;
  (command: 'config', trackingId: string, params?: Record<string, unknown>): void;
}

interface MixpanelPeople {
  set(properties: Record<string, string | number | boolean>): void;
  set_once(properties: Record<string, string | number | boolean>): void;
  increment(property: string, by?: number): void;
}

interface Mixpanel {
  track(eventName: string, properties?: Record<string, string | number | boolean>): void;
  identify(userId: string): void;
  alias(alias: string, original?: string): void;
  people: MixpanelPeople;
  register(properties: Record<string, string | number | boolean>): void;
  reset(): void;
}

interface ChromePerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface Performance extends globalThis.Performance {
  memory?: ChromePerformanceMemory;
}

interface Window {
  gtag?: GoogleTagManager;
  mixpanel?: Mixpanel;
  __E2E_MOCK__?: boolean;
  performance: Performance;
}

declare global {
  interface Window {
    gtag?: GoogleTagManager;
    mixpanel?: Mixpanel;
    __E2E_MOCK__?: boolean;
  }
}

export {};

/**
 * Advanced State Management System
 * Provides centralized state management with subscriptions and persistence
 */

export type StateListener<T> = (state: T) => void;
export type StateMiddleware<T> = (action: any, state: T) => void;
export type Reducer<T, A> = (state: T, action: A) => T;

export interface StoreOptions<T> {
  devTools?: boolean;
  persist?: boolean;
  persistKey?: string;
  middleware?: StateMiddleware<T>[];
  maxHistory?: number;
}

export interface Action {
  type: string;
  payload?: any;
  meta?: Record<string, any>;
}

/**
 * Advanced Store with subscriptions
 */
export class Store<T> {
  private state: T;
  private listeners: Set<StateListener<T>> = new Set();
  private middleware: StateMiddleware<T>[] = [];
  private devTools: boolean = false;
  private persist: boolean = false;
  private persistKey: string = 'app_store';
  private history: T[] = [];
  private maxHistory: number = 50;
  private currentHistoryIndex: number = -1;

  constructor(initialState: T, options?: StoreOptions<T>) {
    this.state = initialState;
    this.devTools = options?.devTools ?? false;
    this.persist = options?.persist ?? false;
    this.persistKey = options?.persistKey ?? 'app_store';
    this.middleware = options?.middleware ?? [];
    this.maxHistory = options?.maxHistory ?? 50;

    if (this.persist) {
      this.restoreState();
    } else {
      this.addToHistory(initialState);
    }

    // Setup dev tools
    if (this.devTools && typeof window !== 'undefined') {
      this.setupDevTools();
    }
  }

  /**
   * Get current state
   */
  getState(): T {
    return this.state;
  }

  /**
   * Update state
   */
  setState(newState: T | ((prevState: T) => T)): void {
    const nextState = typeof newState === 'function'
      ? (newState as (prevState: T) => T)(this.state)
      : newState;

    if (this.state === nextState) {
      return; // No change
    }

    this.state = nextState;
    this.addToHistory(nextState);

    // Persist if enabled
    if (this.persist) {
      this.persistState();
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateListener<T>): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to specific field changes
   */
  subscribeToField<K extends keyof T>(
    field: K,
    listener: (value: T[K]) => void
  ): () => void {
    const wrappedListener = (state: T) => {
      listener(state[field]);
    };

    return this.subscribe(wrappedListener);
  }

  /**
   * Dispatch action (for use with reducer pattern)
   */
  dispatch(reducer: Reducer<T, any>, action: Action): void {
    // Run middleware
    for (const mw of this.middleware) {
      mw(action, this.state);
    }

    // Reduce state
    const nextState = reducer(this.state, action);
    this.setState(nextState);
  }

  /**
   * Get history
   */
  getHistory(): T[] {
    return [...this.history];
  }

  /**
   * Undo to previous state
   */
  undo(): boolean {
    if (this.currentHistoryIndex > 0) {
      this.currentHistoryIndex--;
      this.state = this.history[this.currentHistoryIndex];
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Redo to next state
   */
  redo(): boolean {
    if (this.currentHistoryIndex < this.history.length - 1) {
      this.currentHistoryIndex++;
      this.state = this.history[this.currentHistoryIndex];
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Can undo?
   */
  canUndo(): boolean {
    return this.currentHistoryIndex > 0;
  }

  /**
   * Can redo?
   */
  canRedo(): boolean {
    return this.currentHistoryIndex < this.history.length - 1;
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [this.state];
    this.currentHistoryIndex = 0;
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Add state to history
   */
  private addToHistory(state: T): void {
    // Remove future history if we're not at the end
    if (this.currentHistoryIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentHistoryIndex + 1);
    }

    this.history.push(state);
    this.currentHistoryIndex++;

    // Enforce max history
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentHistoryIndex--;
    }
  }

  /**
   * Persist state to localStorage
   */
  private persistState(): void {
    try {
      localStorage.setItem(this.persistKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to persist state:', error);
    }
  }

  /**
   * Restore state from localStorage
   */
  private restoreState(): void {
    try {
      const stored = localStorage.getItem(this.persistKey);
      if (stored) {
        this.state = JSON.parse(stored);
        this.addToHistory(this.state);
      } else {
        this.addToHistory(this.state);
      }
    } catch (error) {
      console.warn('Failed to restore state:', error);
      this.addToHistory(this.state);
    }
  }

  /**
   * Setup dev tools integration
   */
  private setupDevTools(): void {
    if (typeof window === 'undefined') return;

    const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
    if (!devTools) return;

    const enhancer = devTools({
      name: 'Store',
      trace: true,
      traceLimit: 25,
    });

    // This is a simplified integration
    console.log('[Store] DevTools initialized');
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    listenerCount: number;
    historySize: number;
    currentHistoryIndex: number;
  } {
    return {
      listenerCount: this.listeners.size,
      historySize: this.history.length,
      currentHistoryIndex: this.currentHistoryIndex,
    };
  }

  /**
   * Reset to initial state
   */
  reset(initialState: T): void {
    this.state = initialState;
    this.history = [initialState];
    this.currentHistoryIndex = 0;
    this.notifyListeners();

    if (this.persist) {
      this.persistState();
    }
  }
}

/**
 * Store factory
 */
export class StoreFactory {
  private stores: Map<string, Store<any>> = new Map();

  /**
   * Create or get store
   */
  create<T>(
    name: string,
    initialState: T,
    options?: StoreOptions<T>
  ): Store<T> {
    if (this.stores.has(name)) {
      return this.stores.get(name) as Store<T>;
    }

    const store = new Store(initialState, options);
    this.stores.set(name, store);
    return store;
  }

  /**
   * Get store by name
   */
  get<T>(name: string): Store<T> | null {
    return (this.stores.get(name) as Store<T>) || null;
  }

  /**
   * Delete store
   */
  delete(name: string): boolean {
    return this.stores.delete(name);
  }

  /**
   * Get all stores
   */
  getAll(): Map<string, Store<any>> {
    return new Map(this.stores);
  }
}

/**
 * Combiner for multiple reducers
 */
export class CombinedReducer<T extends Record<string, any>> {
  private reducers: Map<keyof T, Reducer<any, any>> = new Map();

  /**
   * Add reducer for a slice of state
   */
  addReducer<K extends keyof T>(key: K, reducer: Reducer<T[K], any>): this {
    this.reducers.set(key, reducer);
    return this;
  }

  /**
   * Combine reducers into single reducer
   */
  combine(): Reducer<T, any> {
    const reducers = this.reducers;

    return (state: T, action: Action): T => {
      let newState = { ...state };
      let hasChanged = false;

      for (const [key, reducer] of reducers) {
        const oldSlice = state[key];
        const newSlice = reducer(oldSlice, action);

        if (oldSlice !== newSlice) {
          (newState as any)[key] = newSlice;
          hasChanged = true;
        }
      }

      return hasChanged ? newState : state;
    };
  }
}

/**
 * Global store factory instance
 */
export const storeFactory = new StoreFactory();

/**
 * Create a simple store
 */
export function createStore<T>(
  initialState: T,
  options?: StoreOptions<T>
): Store<T> {
  return new Store(initialState, options);
}

/**
 * Create combined reducer
 */
export function combineReducers<T extends Record<string, any>>(): CombinedReducer<T> {
  return new CombinedReducer<T>();
}

export default {
  Store,
  StoreFactory,
  CombinedReducer,
  storeFactory,
  createStore,
  combineReducers,
};

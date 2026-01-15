/**
 * Enhanced Context Provider Utilities (TSX implementation)
 * Provides wrappers and helpers for creating robust context providers
 */

import React, { ReactNode, useCallback, useRef, useEffect } from 'react';
import { TypedError, normalizeError } from './errorHandling';

/**
 * Error boundary for context providers
 */
export class ContextErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Context Provider Error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: '20px', color: 'red' }}>
            <h2>Context Provider Error</h2>
            <p>{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Context value hook with error handling
 */
export function useContextValue<T>(defaultValue: T) {
  const [value, setValue] = React.useState<T>(defaultValue);
  const [error, setError] = React.useState<TypedError | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const update = useCallback(async (updater: T | ((prev: T) => T | Promise<T>)) => {
    setIsLoading(true);
    setError(null);

    try {
      if (typeof updater === 'function') {
        const result = await (updater as any)(value);
        setValue(result);
      } else {
        setValue(updater);
      }
    } catch (err) {
      const typedError = normalizeError(err);
      setError(typedError);
      throw typedError;
    } finally {
      setIsLoading(false);
    }
  }, [value]);

  const reset = useCallback(() => {
    setValue(defaultValue);
    setError(null);
  }, [defaultValue]);

  return { value, setValue, error, isLoading, update, reset };
}

/**
 * Debounced context update
 */
export function useDebouncedContextValue<T>(
  defaultValue: T,
  delayMs: number = 500
) {
  const { value, setValue, error, isLoading, update, reset } = useContextValue(defaultValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedUpdate = useCallback((updater: T | ((prev: T) => T | Promise<T>)) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      update(updater);
    }, delayMs);
  }, [delayMs, update]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { value, setValue, error, isLoading, update: debouncedUpdate, reset };
}

/**
 * Create a context with proper typing and utilities
 */
export function createContext<T>(
  defaultValue: T
): {
  Provider: React.FC<{ children: ReactNode; value?: T }>;
  useContext: () => [T, (value: T) => void];
  Consumer: React.Consumer<T>;
} {
  const context = React.createContext<T | undefined>(defaultValue);

  const Provider: React.FC<{ children: ReactNode; value?: T }> = ({ children, value = defaultValue }) => (
    <ContextErrorBoundary>
      <context.Provider value={value}>{children}</context.Provider>
    </ContextErrorBoundary>
  );

  const useContextHook = (): [T, (value: T) => void] => {
    const value = React.useContext(context as React.Context<T | undefined>);
    if (value === undefined) {
      throw new Error('useContext must be used within Provider');
    }

    return [
      value,
      (newValue: T) => {
        // This is a placeholder - actual implementation depends on your use case
        // You might want to dispatch an action or update state
      },
    ];
  };

  return {
    Provider,
    useContext: useContextHook,
    Consumer: context.Consumer,
  };
}

/**
 * Higher-order component for wrapping components with context
 */
export function withContextProvider<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  ContextProvider: React.ComponentType<{ children: ReactNode }>,
  displayName?: string
) {
  const Wrapper: React.FC<P> = (props) => (
    <ContextProvider>
      <Component {...props} />
    </ContextProvider>
  );

  if (displayName) {
    Wrapper.displayName = displayName;
  }

  return Wrapper;
}

/**
 * Context selector hook for performance optimization
 */
export function useContextSelector<T, S>(
  context: React.Context<T>,
  selector: (value: T) => S
): S {
  const value = React.useContext(context as React.Context<T | undefined>);
  
  if (value === undefined) {
    throw new Error('useContextSelector must be used within Provider');
  }

  return React.useMemo(() => selector(value as T), [value, selector]);
}

/**
 * Multiple context consumer
 */
export function useMultipleContexts<T extends readonly React.Context<any>[]>(
  ...contexts: T
): { [K in keyof T]: T[K] extends React.Context<infer U> ? U : never } {
  const values = contexts.map((context) => React.useContext(context));

  contexts.forEach((context, index) => {
    if (values[index] === undefined) {
      throw new Error(`Context at index ${index} is not available`);
    }
  });

  return values as any;
}

/**
 * Async context value loader
 */
export function useAsyncContextValue<T>(
  loader: () => Promise<T>,
  defaultValue: T,
  dependencies: React.DependencyList = []
) {
  const [value, setValue] = React.useState<T>(defaultValue);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<TypedError | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    let isMounted = true;

    loader()
      .then((result) => {
        if (isMounted) {
          setValue(result);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          const typedError = normalizeError(err);
          setError(typedError);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { value, isLoading, error };
}

/**
 * Context with localStorage persistence
 */
export function usePersistedContextValue<T>(
  key: string,
  defaultValue: T,
  options?: {
    serializer?: (value: T) => string;
    deserializer?: (value: string) => T;
  }
) {
  const [value, setValue] = React.useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const deserializer = options?.deserializer || ((v) => JSON.parse(v));
        return deserializer(stored);
      }
    } catch (error) {
      console.error(`Failed to load persisted context value for key "${key}":`, error);
    }
    return defaultValue;
  });

  const update = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next = typeof newValue === 'function' ? (newValue as any)(prev) : newValue;

      try {
        const serializer = options?.serializer || ((v) => JSON.stringify(v));
        localStorage.setItem(key, serializer(next));
      } catch (error) {
        console.error(`Failed to persist context value for key "${key}":`, error);
      }

      return next;
    });
  }, [key, options]);

  const clear = useCallback(() => {
    setValue(defaultValue);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to clear persisted context value for key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return { value, update, clear };
}

/**
 * Provider composition utility
 */
export function composeProviders(
  ...providers: Array<React.ComponentType<{ children: ReactNode }>>
) {
  return ({ children }: { children: ReactNode }) => {
    return providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children as React.ReactElement
    );
  };
}

export default {
  ContextErrorBoundary,
  useContextValue,
  useDebouncedContextValue,
  createContext,
  withContextProvider,
  useContextSelector,
  useMultipleContexts,
  useAsyncContextValue,
  usePersistedContextValue,
  composeProviders,
};

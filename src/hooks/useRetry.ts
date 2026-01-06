import { useState, useCallback } from 'react';

export interface RetryConfig {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
    shouldRetry?: (error: Error) => boolean;
}

export interface RetryState {
    isLoading: boolean;
    error: Error | null;
    retryCount: number;
}

const defaultConfig: Required<RetryConfig> = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    onRetry: () => { },
    shouldRetry: (error: Error) => {
        // Retry on network errors and 5xx server errors
        const message = error.message.toLowerCase();
        return (
            message.includes('network') ||
            message.includes('fetch') ||
            message.includes('timeout') ||
            message.includes('500') ||
            message.includes('502') ||
            message.includes('503') ||
            message.includes('504')
        );
    }
};

/**
 * Hook for automatic retry logic with exponential backoff
 */
export function useRetry<T>(config: RetryConfig = {}) {
    const [state, setState] = useState<RetryState>({
        isLoading: false,
        error: null,
        retryCount: 0
    });

    const finalConfig = { ...defaultConfig, ...config };

    const calculateDelay = (attempt: number): number => {
        const delay = finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt);
        return Math.min(delay, finalConfig.maxDelay);
    };

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const executeWithRetry = useCallback(
        async (fn: () => Promise<T>): Promise<T> => {
            setState({ isLoading: true, error: null, retryCount: 0 });

            let lastError: Error | null = null;
            let attempt = 0;

            while (attempt <= finalConfig.maxRetries) {
                try {
                    const result = await fn();
                    setState({ isLoading: false, error: null, retryCount: attempt });
                    return result;
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));

                    // Check if we should retry this error
                    if (!finalConfig.shouldRetry(lastError)) {
                        setState({ isLoading: false, error: lastError, retryCount: attempt });
                        throw lastError;
                    }

                    // Check if we've exhausted retries
                    if (attempt >= finalConfig.maxRetries) {
                        setState({ isLoading: false, error: lastError, retryCount: attempt });
                        throw lastError;
                    }

                    // Call retry callback
                    finalConfig.onRetry(attempt + 1, lastError);

                    // Wait before retrying with exponential backoff
                    const delay = calculateDelay(attempt);
                    console.log(`Retry attempt ${attempt + 1}/${finalConfig.maxRetries} after ${delay}ms`, lastError);
                    await sleep(delay);

                    attempt++;
                    setState(prev => ({ ...prev, retryCount: attempt }));
                }
            }

            // Should never reach here, but TypeScript needs it
            throw lastError || new Error('Unknown error');
        },
        [finalConfig]
    );

    const reset = useCallback(() => {
        setState({ isLoading: false, error: null, retryCount: 0 });
    }, []);

    return {
        executeWithRetry,
        reset,
        ...state
    };
}

/**
 * Wrapper function for simple retry without hooks
 */
export async function retry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = {}
): Promise<T> {
    const finalConfig = { ...defaultConfig, ...config };
    let lastError: Error | null = null;
    let attempt = 0;

    const calculateDelay = (attempt: number): number => {
        const delay = finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt);
        return Math.min(delay, finalConfig.maxDelay);
    };

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    while (attempt <= finalConfig.maxRetries) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (!finalConfig.shouldRetry(lastError) || attempt >= finalConfig.maxRetries) {
                throw lastError;
            }

            finalConfig.onRetry(attempt + 1, lastError);
            const delay = calculateDelay(attempt);
            await sleep(delay);
            attempt++;
        }
    }

    throw lastError || new Error('Unknown error');
}

/**
 * Decorator for class methods
 */
export function withRetry(config: RetryConfig = {}) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            return retry(() => originalMethod.apply(this, args), config);
        };

        return descriptor;
    };
}

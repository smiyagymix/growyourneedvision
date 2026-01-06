/**
 * Sentry Configuration
 * Error tracking and performance monitoring for production
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development';
const RELEASE_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initializeSentry() {
    // Only initialize in production or when DSN is configured
    if (!SENTRY_DSN) {
        console.log('Sentry DSN not configured - error tracking disabled');
        return;
    }

    try {
        Sentry.init({
            dsn: SENTRY_DSN,
            environment: ENVIRONMENT,
            release: `grow-your-need@${RELEASE_VERSION}`,
            
            // Integrations
            integrations: [
                new BrowserTracing({
                    // Trace navigation and route changes
                    routingInstrumentation: Sentry.reactRouterV6Instrumentation(
                        React.useEffect,
                        // @ts-ignore - React Router hooks
                        window.location,
                        // @ts-ignore
                        window.history
                    ),
                }),
                new Sentry.Replay({
                    maskAllText: true,
                    blockAllMedia: true,
                }),
            ],

            // Performance Monitoring
            tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1), // 10% of transactions
            
            // Session Replay
            replaysSessionSampleRate: 0.1, // 10% of sessions
            replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

            // Filtering
            beforeSend(event, hint) {
                // Filter out non-error exceptions
                if (event.exception) {
                    const error = hint.originalException;
                    
                    // Ignore navigation cancellation errors
                    if (error && typeof error === 'object' && 'message' in error) {
                        const message = String(error.message);
                        if (message.includes('cancelled') || message.includes('aborted')) {
                            return null;
                        }
                    }
                }

                // Add user context if available
                const userStr = localStorage.getItem('pocketbase_auth');
                if (userStr) {
                    try {
                        const authData = JSON.parse(userStr);
                        if (authData.model) {
                            event.user = {
                                id: authData.model.id,
                                email: authData.model.email,
                                username: authData.model.name,
                                role: authData.model.role,
                            };
                        }
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }

                return event;
            },

            // Ignore specific errors
            ignoreErrors: [
                // Browser extensions
                'top.GLOBALS',
                'chrome-extension://',
                'moz-extension://',
                // Network errors
                'NetworkError',
                'Network request failed',
                'Failed to fetch',
                // React Query auto-cancellation
                'Query was cancelled',
                'AbortError',
            ],

            // Sanitize data
            beforeBreadcrumb(breadcrumb) {
                // Remove sensitive data from breadcrumbs
                if (breadcrumb.category === 'console') {
                    return null; // Don't send console logs
                }
                if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
                    // Remove auth headers
                    if (breadcrumb.data?.headers) {
                        delete breadcrumb.data.headers.Authorization;
                        delete breadcrumb.data.headers.authorization;
                    }
                }
                return breadcrumb;
            },
        });

        console.log('✓ Sentry initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Sentry:', error);
    }
}

/**
 * Capture exception with additional context
 */
export function captureException(error: Error, context?: Record<string, any>) {
    if (!SENTRY_DSN) return;

    Sentry.captureException(error, {
        extra: context,
        tags: {
            component: context?.component || 'unknown',
            feature: context?.feature || 'unknown',
        },
    });
}

/**
 * Capture message with severity level
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
    if (!SENTRY_DSN) return;

    Sentry.captureMessage(message, {
        level,
        extra: context,
    });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: { id: string; email?: string; name?: string; role?: string } | null) {
    if (!SENTRY_DSN) return;

    if (user) {
        Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.name,
            role: user.role,
        });
    } else {
        Sentry.setUser(null);
    }
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    if (!SENTRY_DSN) return;

    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
    });
}

/**
 * Start transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
    if (!SENTRY_DSN) return null;

    return Sentry.startTransaction({
        name,
        op,
    });
}

/**
 * Measure async operation performance
 */
export async function measurePerformance<T>(
    name: string,
    operation: () => Promise<T>,
    context?: Record<string, any>
): Promise<T> {
    if (!SENTRY_DSN) {
        return operation();
    }

    const transaction = startTransaction(name, 'function');
    const startTime = performance.now();

    try {
        const result = await operation();
        const duration = performance.now() - startTime;

        // Log slow operations (>2 seconds)
        if (duration > 2000) {
            captureMessage(`Slow operation: ${name}`, 'warning', {
                ...context,
                duration,
            });
        }

        return result;
    } catch (error) {
        captureException(error as Error, {
            ...context,
            operation: name,
        });
        throw error;
    } finally {
        transaction?.finish();
    }
}

/**
 * Create error boundary fallback component
 */
export function createErrorFallback(componentName: string) {
    return function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Something went wrong</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{componentName}</p>
                        </div>
                    </div>

                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded">
                        <p className="text-sm text-red-800 dark:text-red-300 font-mono">{error.message}</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={resetError}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Go Home
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                        This error has been reported to our team
                    </p>
                </div>
            </div>
        );
    };
}

export default Sentry;

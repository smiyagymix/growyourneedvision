/**
 * Owner Dashboard Error Boundary
 * 
 * Sentry-integrated error boundary for Owner-specific components
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import * as SentryReact from '@sentry/react';
import { captureException } from '../../lib/sentry';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetKeys?: any[];
    componentName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    eventId: string | null;
}

export class OwnerErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            eventId: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const { onError, componentName } = this.props;

        // Log to Sentry and get event ID
        const eventId = SentryReact.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack
                }
            },
            tags: {
                errorBoundary: 'owner',
                component: componentName || 'unknown'
            },
            level: 'error'
        }) as string;

        this.setState({
            errorInfo,
            eventId: eventId || null
        });

        // Call custom error handler
        if (onError) {
            onError(error, errorInfo);
        }

        console.error('[OwnerErrorBoundary] Error caught:', error, errorInfo);
    }

    componentDidUpdate(prevProps: Props) {
        // Reset error state if resetKeys change
        if (this.state.hasError && this.props.resetKeys) {
            const hasChanged = this.props.resetKeys.some(
                (key, index) => key !== prevProps.resetKeys?.[index]
            );

            if (hasChanged) {
                this.resetError();
            }
        }
    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            eventId: null
        });
    };

    handleReportFeedback = () => {
        const { eventId } = this.state;
        if (eventId && typeof SentryReact.showReportDialog === 'function') {
            SentryReact.showReportDialog({ eventId });
        }
    };

    render() {
        if (this.state.hasError) {
            const { fallback } = this.props;

            if (fallback) {
                return fallback;
            }

            return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
                            Something went wrong
                        </h1>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                            We're sorry, but an unexpected error occurred in the Owner dashboard. 
                            Our team has been automatically notified and we're working on a fix.
                        </p>

                        {/* Error Details (Development only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <h3 className="font-semibold text-red-900 dark:text-red-400 mb-2">
                                    Error Details (Development Mode)
                                </h3>
                                <p className="text-sm text-red-800 dark:text-red-300 font-mono mb-2">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <details className="text-xs text-red-700 dark:text-red-400 mt-2">
                                        <summary className="cursor-pointer font-semibold mb-1">
                                            Component Stack
                                        </summary>
                                        <pre className="whitespace-pre-wrap overflow-auto max-h-48 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        {/* Event ID */}
                        {this.state.eventId && (
                            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-900 dark:text-blue-300">
                                    <strong>Error ID:</strong>{' '}
                                    <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded font-mono">
                                        {this.state.eventId}
                                    </code>
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                    Please include this ID when contacting support
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.resetError}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Try Again
                            </button>

                            <a
                                href="/admin"
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Home className="w-5 h-5" />
                                Go to Dashboard
                            </a>

                            {this.state.eventId && (
                                <button
                                    onClick={this.handleReportFeedback}
                                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                                >
                                    Report Issue
                                </button>
                            )}
                        </div>

                        {/* Contact Support */}
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Need immediate help?{' '}
                                <a
                                    href="mailto:support@growyourneed.com"
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Contact Support
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook for programmatic error handling
 */
export const useOwnerErrorHandler = () => {
    const [error, setError] = React.useState<Error | null>(null);

    React.useEffect(() => {
        if (error) {
            captureException(error, {
                errorSource: 'hook',
                errorBoundary: 'owner'
            });
        }
    }, [error]);

    return {
        error,
        setError,
        clearError: () => setError(null),
        handleError: (err: Error | unknown) => {
            if (err instanceof Error) {
                setError(err);
            } else {
                setError(new Error(String(err)));
            }
        }
    };
};

/**
 * Higher-order component to wrap Owner components with error boundary
 */
export function withOwnerErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    componentName?: string
) {
    return function WrappedComponent(props: P) {
        return (
            <OwnerErrorBoundary componentName={componentName || Component.displayName || Component.name}>
                <Component {...props} />
            </OwnerErrorBoundary>
        );
    };
}

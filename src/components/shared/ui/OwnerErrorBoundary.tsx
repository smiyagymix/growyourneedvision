/**
 * Owner-specific Error Boundary
 * Wraps Owner dashboard components with Sentry integration
 */

import React from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { addBreadcrumb, captureException } from '../../../lib/sentry';

interface Props {
    children: React.ReactNode;
    componentName: string;
    fallbackMode?: 'full' | 'inline';
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class OwnerErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`Error in ${this.props.componentName}:`, error, errorInfo);

        // Capture to Sentry with component context
        captureException(error, {
            component: this.props.componentName,
            componentStack: errorInfo.componentStack,
            feature: 'owner-dashboard',
        });

        // Add breadcrumb for debugging
        addBreadcrumb('Component Error', 'error', {
            component: this.props.componentName,
            errorMessage: error.message,
        });

        this.setState({
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = () => {
        window.location.href = '/admin';
    };

    render() {
        if (this.state.hasError) {
            const { fallbackMode = 'full', componentName } = this.props;
            const { error, errorInfo } = this.state;

            // Inline fallback for widget errors
            if (fallbackMode === 'inline') {
                return (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                                    {componentName} Error
                                </h3>
                                <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                                    {error?.message || 'An unexpected error occurred'}
                                </p>
                                <button
                                    onClick={this.handleReset}
                                    className="text-sm px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            // Full page fallback for major errors
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold mb-1">Owner Dashboard Error</h1>
                                    <p className="text-red-100">Component: {componentName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Error Details */}
                        <div className="p-6 space-y-4">
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">Error Message</h3>
                                <p className="text-sm text-red-700 dark:text-red-400 font-mono">
                                    {error?.message || 'Unknown error'}
                                </p>
                            </div>

                            {errorInfo && process.env.NODE_ENV === 'development' && (
                                <details className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                    <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white mb-2">
                                        Component Stack (Development Only)
                                    </summary>
                                    <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto mt-2">
                                        {errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}

                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">What happened?</h3>
                                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                                    <li>The {componentName} component encountered an unexpected error</li>
                                    <li>This error has been automatically reported to our development team</li>
                                    <li>Your data is safe and no information was lost</li>
                                    <li>You can try refreshing the component or return to the dashboard</li>
                                </ul>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={this.handleReset}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Try Again
                                </button>
                                <button
                                    onClick={this.handleGoHome}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                                >
                                    <Home className="w-5 h-5" />
                                    Dashboard Home
                                </button>
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                                Error ID: {Date.now().toString(36)} • Reported at {new Date().toLocaleTimeString()}
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
 * Higher-order component to wrap Owner components with error boundary
 */
export function withOwnerErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    componentName: string,
    fallbackMode: 'full' | 'inline' = 'full'
) {
    return function WrappedComponent(props: P) {
        return (
            <OwnerErrorBoundary componentName={componentName} fallbackMode={fallbackMode}>
                <Component {...props} />
            </OwnerErrorBoundary>
        );
    };
}

/**
 * Sentry Error Boundary (alternative using Sentry's built-in)
 */
export const SentryOwnerErrorBoundary = Sentry.withErrorBoundary(
    ({ children }: { children: React.ReactNode }) => <>{children}</>,
    {
        fallback: ({ error, resetError }) => (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Something went wrong</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Owner Dashboard</p>
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
                            onClick={() => window.location.href = '/admin'}
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
        ),
        showDialog: false,
    }
);

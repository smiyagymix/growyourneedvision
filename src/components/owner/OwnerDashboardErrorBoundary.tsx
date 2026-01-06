import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, Button, Icon } from '../shared/ui/CommonUI';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    dashboardName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    retryCount: number;
}

/**
 * Owner Dashboard Error Boundary
 * Catches errors in owner dashboard components and provides graceful fallback
 */
export class OwnerDashboardErrorBoundary extends Component<Props, State> {
    private maxRetries = 3;

    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console
        console.error('Owner Dashboard Error:', error, errorInfo);

        // Update state with error details
        this.setState({
            error,
            errorInfo
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Send to external error tracking (Sentry, etc.)
        this.reportErrorToService(error, errorInfo);
    }

    reportErrorToService(error: Error, errorInfo: ErrorInfo) {
        // Integration with error tracking service
        if (typeof window !== 'undefined' && (window as any).Sentry) {
            (window as any).Sentry.captureException(error, {
                contexts: {
                    react: {
                        componentStack: errorInfo.componentStack
                    }
                },
                tags: {
                    dashboard: this.props.dashboardName || 'unknown'
                }
            });
        }

        // Also log to backend audit system
        if (import.meta.env.PROD) {
            fetch('/api/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack,
                    dashboard: this.props.dashboardName,
                    timestamp: new Date().toISOString()
                })
            }).catch(err => console.error('Failed to report error:', err));
        }
    }

    handleRetry = () => {
        const { retryCount } = this.state;

        if (retryCount < this.maxRetries) {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                retryCount: retryCount + 1
            });
        } else {
            alert('Maximum retry attempts reached. Please refresh the page or contact support.');
        }
    };

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
                    <Card className="max-w-2xl w-full p-8">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Icon name="ExclamationTriangleIcon" className="w-10 h-10 text-red-600 dark:text-red-400" />
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                {this.props.dashboardName ? `${this.props.dashboardName} Error` : 'Dashboard Error'}
                            </h1>

                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Something went wrong while loading this dashboard. This error has been automatically reported to our team.
                            </p>

                            {/* Error Details (Dev Mode Only) */}
                            {import.meta.env.DEV && this.state.error && (
                                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
                                    <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
                                        {this.state.error.message}
                                    </p>
                                    {this.state.error.stack && (
                                        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-40">
                                            {this.state.error.stack}
                                        </pre>
                                    )}
                                </div>
                            )}

                            {/* Retry Info */}
                            {this.state.retryCount > 0 && (
                                <p className="text-sm text-orange-600 dark:text-orange-400 mb-4">
                                    Retry attempt {this.state.retryCount} of {this.maxRetries}
                                </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-center">
                                {this.state.retryCount < this.maxRetries && (
                                    <Button
                                        name="retry-dashboard"
                                        variant="primary"
                                        onClick={this.handleRetry}
                                    >
                                        <Icon name="ArrowPathIcon" className="w-5 h-5 mr-2" />
                                        Try Again
                                    </Button>
                                )}

                                <Button
                                    name="refresh-page"
                                    variant="outline"
                                    onClick={() => window.location.reload()}
                                >
                                    <Icon name="ArrowPathIcon" className="w-5 h-5 mr-2" />
                                    Refresh Page
                                </Button>

                                <Button
                                    name="go-home"
                                    variant="ghost"
                                    onClick={() => window.location.href = '/owner'}
                                >
                                    <Icon name="HomeIcon" className="w-5 h-5 mr-2" />
                                    Go Home
                                </Button>
                            </div>

                            {/* Support Info */}
                            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    If this problem persists, please contact support with error ID:
                                </p>
                                <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mt-2">
                                    {this.state.error ? this.state.error.message.substring(0, 50) : 'Unknown Error'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook-based wrapper for functional components
export const withOwnerErrorBoundary = (
    Component: React.ComponentType<any>,
    dashboardName?: string
) => {
    return (props: any) => (
        <OwnerDashboardErrorBoundary dashboardName={dashboardName}>
            <Component {...props} />
        </OwnerDashboardErrorBoundary>
    );
};

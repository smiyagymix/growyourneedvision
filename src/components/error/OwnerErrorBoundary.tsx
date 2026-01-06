/**
 * Owner Dashboard Error Boundary
 * Specialized error boundary with recovery strategies for Owner components
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { captureException } from '../../lib/sentry';
import { logger } from '../../utils/logger';
import { Button, Icon } from '../shared/ui/CommonUI';

interface Props {
    children: ReactNode;
    componentName?: string;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    attemptedRecovery: boolean;
}

export class OwnerErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            attemptedRecovery: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const { componentName } = this.props;

        logger.error(
            `Owner Component Error: ${componentName || 'Unknown'}`,
            error,
            {
                component: componentName,
                action: 'render',
                errorInfo: errorInfo.componentStack,
            }
        );

        captureException(error, {
            tags: {
                component: componentName || 'OwnerComponent',
                boundary: 'OwnerErrorBoundary',
            },
            extra: {
                componentStack: errorInfo.componentStack,
            },
        });

        this.setState({ errorInfo });
    }

    handleRecovery = () => {
        const { onReset } = this.props;

        // Attempt automatic recovery
        this.setState(
            {
                hasError: false,
                error: null,
                errorInfo: null,
                attemptedRecovery: true,
            },
            () => {
                if (onReset) {
                    onReset();
                }
            }
        );
    };

    handleRefresh = () => {
        window.location.reload();
    };

    render() {
        const { hasError, error, attemptedRecovery } = this.state;
        const { children, fallback, componentName } = this.props;

        if (hasError && error) {
            if (fallback) {
                return fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-red-200 dark:border-red-800">
                        <div className="text-center mb-6">
                            <Icon
                                name="ExclamationTriangleIcon"
                                className="w-16 h-16 text-red-500 mx-auto mb-4"
                            />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Component Error
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                {componentName
                                    ? `The ${componentName} component encountered an error.`
                                    : 'A component encountered an unexpected error.'}
                            </p>
                        </div>

                        {import.meta.env.DEV && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <p className="text-sm font-mono text-red-900 dark:text-red-100 break-words">
                                    {error.message}
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {!attemptedRecovery && (
                                <Button
                                    onClick={this.handleRecovery}
                                    className="w-full"
                                    variant="primary"
                                >
                                    <Icon name="ArrowPathIcon" className="w-5 h-5 mr-2" />
                                    Try Again
                                </Button>
                            )}

                            <Button
                                onClick={this.handleRefresh}
                                className="w-full"
                                variant="secondary"
                            >
                                <Icon name="ArrowsRightLeftIcon" className="w-5 h-5 mr-2" />
                                Refresh Page
                            </Button>

                            <Button
                                onClick={() => (window.location.href = '/owner')}
                                className="w-full"
                                variant="outline"
                            >
                                <Icon name="HomeIcon" className="w-5 h-5 mr-2" />
                                Back to Dashboard
                            </Button>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Error has been logged and will be investigated.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return children;
    }
}

/**
 * HOC to wrap Owner components with error boundary
 */
export function withOwnerErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    componentName?: string
) {
    return (props: P) => (
        <OwnerErrorBoundary componentName={componentName || Component.displayName || Component.name}>
            <Component {...props} />
        </OwnerErrorBoundary>
    );
}

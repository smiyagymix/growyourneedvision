import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/Logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class VideoEditorErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        logger.error('Video Editor Error', error, {
            componentStack: errorInfo.componentStack,
        });

        this.props.onError?.(error, errorInfo);

        // Send to analytics if available
        if (typeof window !== 'undefined' && 'gtag' in window) {
            (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.('event', 'exception', {
                description: error.message,
                fatal: true,
            });
        }
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex items-center justify-center min-h-[400px] p-8">
                    <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                                    Something went wrong
                                </h3>
                                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                                    {this.state.error?.message || 'An unexpected error occurred in the video editor'}
                                </p>
                                <button
                                    onClick={() => this.setState({ hasError: false, error: null })}
                                    className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from './CommonUI';

interface Props {
    children: ReactNode;
    title?: string;
}

interface State {
    hasError: boolean;
}

export class WidgetErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Widget error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 text-center">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
                        <Icon name="ExclamationTriangleIcon" className="w-5 h-5 text-red-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                        {this.props.title || 'Widget Error'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        This content failed to load.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

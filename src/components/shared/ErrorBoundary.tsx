
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Automatic reporting in production
    if (import.meta.env.PROD) {
      supportTicketService.createTicket({
        subject: `System Crash: ${error.message}`,
        description: `Error: ${error.stack}\n\nComponent Stack: ${errorInfo.componentStack}`,
        priority: 'High',
        category: 'Technical',
        status: 'Open'
      }).catch(err => console.error("Failed to auto-report error", err));
    }
  }

  private handleReportError = async () => {
    try {
      await supportTicketService.createTicket({
        subject: `User-Reported Error: ${this.state.error?.message}`,
        description: `Visual Crash Report\nError: ${this.state.error?.stack}`,
        priority: 'Medium',
        category: 'Technical',
        status: 'Open'
      });
      alert("Thank you. Our technical team has been notified.");
    } catch (err) {
      alert("Failed to send report. Please try again later.");
    }
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 rounded-xl bg-red-50 border border-red-100 text-center m-4">
          <h2 className="text-lg font-bold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-sm text-red-600 mb-4">The application encountered an unexpected error.</p>
          <pre className="text-xs text-left bg-red-100 p-2 rounded mb-4 overflow-auto max-h-32">{this.state.error?.toString()}</pre>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={this.handleReportError}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition-colors"
            >
              Report Issue
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import * as Sentry from "@sentry/react";

/**
 * Standardized Error Handling Service
 * Provides consistent error handling across the platform
 */

export type ErrorDetails = Record<string, string | number | boolean | null | undefined | object>;

export class AppError extends Error {
    constructor(
        public message: string,
        public code: string,
        public statusCode: number = 500,
        public userMessage?: string,
        public details?: ErrorDetails
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: ErrorDetails) {
        super(message, 'VALIDATION_ERROR', 400, 'Please check your input', details);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication failed') {
        super(message, 'AUTH_ERROR', 401, 'Please log in to continue');
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'Access denied') {
        super(message, 'AUTHORIZATION_ERROR', 403, 'You do not have permission to perform this action');
        this.name = 'AuthorizationError';
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 'NOT_FOUND', 404, `The requested ${resource.toLowerCase()} was not found`);
        this.name = 'NotFoundError';
    }
}

export class NetworkError extends AppError {
    constructor(message: string = 'Network error') {
        super(message, 'NETWORK_ERROR', 0, 'Unable to connect. Please check your internet connection');
        this.name = 'NetworkError';
    }
}

interface PocketBaseError {
    status: number;
    message: string;
    data: Record<string, unknown>;
    isAbort?: boolean;
    name?: string;
    code?: string;
}

class ErrorHandler {
    /**
     * Handle any error and return standardized error object
     */
    handle(error: unknown): AppError {
        // Already an AppError
        if (error instanceof AppError) {
            this.log(error);
            return error;
        }

        // PocketBase ClientResponseError
        if (this.isPocketBaseError(error)) {
            return this.handlePocketBaseError(error);
        }

        // Network errors
        if (this.isNetworkError(error)) {
            const message = error instanceof Error ? error.message : 'Network error';
            const networkError = new NetworkError(message);
            this.log(networkError);
            return networkError;
        }

        // Generic error
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        const appError = new AppError(
            message,
            'UNKNOWN_ERROR',
            500,
            'Something went wrong. Please try again'
        );
        this.log(appError);
        return appError;
    }

    private isPocketBaseError(error: unknown): error is PocketBaseError {
        return typeof error === 'object' && error !== null && 'status' in error;
    }

    private toErrorDetails(data: Record<string, unknown>): ErrorDetails {
        const details: ErrorDetails = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null || typeof value === 'object') {
                details[key] = value as string | number | boolean | null | object;
            }
        }
        return details;
    }

    /**
     * Handle PocketBase specific errors
     */
    private handlePocketBaseError(error: PocketBaseError): AppError {
        const status = error.status || 500;
        const message = error.message || 'Request failed';
        const data = error.data || {};

        // Authentication errors
        if (status === 401) {
            return new AuthenticationError(message);
        }

        // Authorization errors
        if (status === 403) {
            return new AuthorizationError(message);
        }

        // Not found
        if (status === 404) {
            return new NotFoundError((data.resource as string) || 'Resource');
        }

        // Validation errors
        if (status === 400) {
            return new ValidationError(message, this.toErrorDetails(data));
        }

        // Server errors
        return new AppError(
            message,
            `HTTP_${status}`,
            status,
            'An error occurred while processing your request'
        );
    }

    /**
     * Check if error is a network error
     */
    isNetworkError(error: unknown): boolean {
        if (typeof error !== 'object' || error === null) return false;
        const e = error as Record<string, unknown>;
        
        return (
            e.status === 0 ||
            e.isAbort === true ||
            e.name === 'AbortError' ||
            (typeof e.message === 'string' && (e.message.includes('fetch failed') || e.message.includes('Network request failed')))
        );
    }

    /**
     * Check if error is an authentication error
     */
    isAuthError(error: unknown): boolean {
        if (error instanceof AuthenticationError) return true;
        if (typeof error !== 'object' || error === null) return false;
        const e = error as Record<string, unknown>;
        
        return (
            e.status === 401 ||
            e.code === 'AUTH_ERROR'
        );
    }

    /**
     * Check if error is a validation error
     */
    isValidationError(error: unknown): boolean {
        if (error instanceof ValidationError) return true;
        if (typeof error !== 'object' || error === null) return false;
        const e = error as Record<string, unknown>;

        return (
            e.status === 400 ||
            e.code === 'VALIDATION_ERROR'
        );
    }

    /**
     * Log error (can be extended to send to error tracking service)
     */
    private log(error: AppError): void {
        // Always log to console, but with different verbosity based on environment
        if (process.env.NODE_ENV === 'development') {
            console.error('[ErrorHandler]', {
                name: error.name,
                code: error.code,
                message: error.message,
                userMessage: error.userMessage,
                statusCode: error.statusCode,
                details: error.details
            });
        } else {
            // Production logging: minimal info to avoid leaking sensitive details
            console.error('[ErrorHandler]', `${error.name}: ${error.message} (Code: ${error.code})`);
        }

        // Future integration: Sentry or other error tracking
        Sentry.captureException(error);
    }

    /**
     * Get user-friendly error message
     */
    getUserMessage(error: unknown): string {
        const appError = this.handle(error);
        return appError.userMessage || appError.message;
    }
}

export const errorHandler = new ErrorHandler();

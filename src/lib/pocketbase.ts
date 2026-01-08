/**
 * Type-Safe PocketBase Client
 * Provides centralized PocketBase instance with environment configuration
 */

import PocketBase from 'pocketbase';
import env from '../config/environment';
import { Result, Ok, Err } from './types';
import { AppError, NetworkError } from '../services/errorHandler';

/**
 * Initialize PocketBase client with environment configuration
 */
function createPocketBaseClient(): PocketBase {
    const url = env.get('pocketbaseUrl');
    
    if (!url) {
        throw new AppError(
            'PocketBase URL not configured',
            'CONFIG_ERROR',
            500,
            'Please configure VITE_POCKETBASE_URL environment variable'
        );
    }

    const pb = new PocketBase(url);
    
    // Disable auto-cancellation for dashboard with many parallel requests
    pb.autoCancellation(false);
    
    return pb;
}

/**
 * Singleton PocketBase instance
 */
const pb = createPocketBaseClient();

/**
 * Type-safe PocketBase client wrapper
 */
export class PocketBaseClient {
    private client: PocketBase;

    constructor() {
        this.client = pb;
    }

    /**
     * Get raw PocketBase instance (use sparingly)
     */
    getRawClient(): PocketBase {
        return this.client;
    }

    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean {
        return this.client.authStore.isValid;
    }

    /**
     * Get current user with type safety
     */
    getCurrentUser<T extends Record<string, unknown> = Record<string, unknown>>(): T | null {
        const model = this.client.authStore.model;
        if (!model) return null;
        return model as T;
    }

    /**
     * Get auth token
     */
    getAuthToken(): string {
        return this.client.authStore.token;
    }

    /**
     * Clear auth
     */
    clearAuth(): void {
        this.client.authStore.clear();
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<Result<{ status: string; version: string }, AppError>> {
        try {
            const response = await fetch(`${env.get('pocketbaseUrl')}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) {
                return Err(new AppError(
                    `Health check failed: ${response.statusText}`,
                    'HEALTH_CHECK_FAILED',
                    response.status
                ));
            }

            const data = await response.json() as { status: string; version: string };
            return Ok(data);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return Err(new NetworkError('Health check timeout'));
            }
            return Err(new NetworkError(error instanceof Error ? error.message : 'Health check failed'));
        }
    }
}

/**
 * Singleton PocketBase client instance
 */
export const pocketBaseClient = new PocketBaseClient();

/**
 * Default export for backward compatibility
 */
export default pb;

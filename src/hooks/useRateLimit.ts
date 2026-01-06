/**
 * useRateLimit Hook
 * Client-side rate limiting for API calls and user actions
 */

import { useCallback, useRef } from 'react';
import { checkRateLimit, type RateLimiterConfig } from '../utils/rateLimiting';
import { useToast } from './useToast';

interface UseRateLimitOptions {
  maxRequests: number;
  windowMs: number;
  key: string;
  showToast?: boolean;
}

interface UseRateLimitReturn {
  checkLimit: () => boolean;
  executeIfAllowed: <T>(fn: () => T | Promise<T>) => Promise<T | null>;
  isRateLimited: () => boolean;
}

/**
 * Hook for rate limiting user actions and API calls
 * 
 * @example
 * const { executeIfAllowed } = useRateLimit({
 *   maxRequests: 5,
 *   windowMs: 60000, // 5 requests per minute
 *   key: 'api:sendMessage',
 *   showToast: true
 * });
 * 
 * const handleSubmit = () => {
 *   executeIfAllowed(async () => {
 *     await sendMessage(content);
 *   });
 * };
 */
export function useRateLimit(options: UseRateLimitOptions): UseRateLimitReturn {
  const { maxRequests, windowMs, key, showToast = true } = options;
  const { addToast } = useToast();
  const configRef = useRef<RateLimiterConfig>({ maxRequests, windowMs, key });

  // Update config if options change
  configRef.current = { maxRequests, windowMs, key };

  const checkLimit = useCallback((): boolean => {
    const allowed = checkRateLimit(configRef.current);
    
    if (!allowed && showToast) {
      const waitTime = Math.ceil(windowMs / 1000);
      addToast(
        `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`,
        'warning'
      );
    }
    
    return allowed;
  }, [windowMs, showToast, addToast]);

  const executeIfAllowed = useCallback(async <T,>(
    fn: () => T | Promise<T>
  ): Promise<T | null> => {
    if (!checkLimit()) {
      return null;
    }
    
    try {
      return await fn();
    } catch (error) {
      throw error; // Re-throw to let caller handle
    }
  }, [checkLimit]);

  const isRateLimited = useCallback((): boolean => {
    return !checkRateLimit(configRef.current);
  }, []);

  return {
    checkLimit,
    executeIfAllowed,
    isRateLimited,
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const RateLimitPresets = {
  // API calls
  API_SEARCH: { maxRequests: 10, windowMs: 10000, key: 'api:search' }, // 10 per 10s
  API_CREATE: { maxRequests: 5, windowMs: 60000, key: 'api:create' }, // 5 per minute
  API_UPDATE: { maxRequests: 10, windowMs: 60000, key: 'api:update' }, // 10 per minute
  API_DELETE: { maxRequests: 3, windowMs: 60000, key: 'api:delete' }, // 3 per minute
  
  // User actions
  MESSAGE_SEND: { maxRequests: 5, windowMs: 60000, key: 'user:sendMessage' }, // 5 per minute
  FILE_UPLOAD: { maxRequests: 3, windowMs: 60000, key: 'user:uploadFile' }, // 3 per minute
  FORM_SUBMIT: { maxRequests: 10, windowMs: 60000, key: 'user:submitForm' }, // 10 per minute
  
  // AI features
  AI_GENERATE: { maxRequests: 3, windowMs: 60000, key: 'ai:generate' }, // 3 per minute
  AI_CHAT: { maxRequests: 10, windowMs: 60000, key: 'ai:chat' }, // 10 per minute
};

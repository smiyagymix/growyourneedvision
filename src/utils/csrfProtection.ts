/**
 * CSRF (Cross-Site Request Forgery) Protection Utilities
 * 
 * Provides token generation, validation, and middleware for CSRF protection
 */

/**
 * Generate a cryptographically secure random token
 * @param length - Token length in bytes (default: 32)
 * @returns Base64 encoded token string
 */
export function generateCsrfToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    // Convert to base64
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Store CSRF token in sessionStorage
 * @param token - CSRF token to store
 */
export function storeCsrfToken(token: string): void {
    try {
        sessionStorage.setItem('csrf_token', token);
        sessionStorage.setItem('csrf_token_timestamp', Date.now().toString());
    } catch (error) {
        console.error('Failed to store CSRF token:', error);
    }
}

/**
 * Retrieve CSRF token from sessionStorage
 * @param maxAge - Maximum token age in milliseconds (default: 1 hour)
 * @returns CSRF token or null if expired/missing
 */
export function getCsrfToken(maxAge: number = 3600000): string | null {
    try {
        const token = sessionStorage.getItem('csrf_token');
        const timestamp = sessionStorage.getItem('csrf_token_timestamp');
        
        if (!token || !timestamp) return null;
        
        const age = Date.now() - parseInt(timestamp, 10);
        if (age > maxAge) {
            // Token expired, clear it
            clearCsrfToken();
            return null;
        }
        
        return token;
    } catch (error) {
        console.error('Failed to retrieve CSRF token:', error);
        return null;
    }
}

/**
 * Get or create CSRF token
 * Creates new token if none exists or if expired
 * @returns Valid CSRF token
 */
export function getOrCreateCsrfToken(): string {
    let token = getCsrfToken();
    
    if (!token) {
        token = generateCsrfToken();
        storeCsrfToken(token);
    }
    
    return token;
}

/**
 * Clear CSRF token from storage
 */
export function clearCsrfToken(): void {
    try {
        sessionStorage.removeItem('csrf_token');
        sessionStorage.removeItem('csrf_token_timestamp');
    } catch (error) {
        console.error('Failed to clear CSRF token:', error);
    }
}

/**
 * Add CSRF token to request headers
 * @param headers - Existing headers object
 * @returns Headers with CSRF token added
 */
export function addCsrfHeader(headers: Record<string, string> = {}): Record<string, string> {
    const token = getOrCreateCsrfToken();
    
    return {
        ...headers,
        'X-CSRF-Token': token,
    };
}

/**
 * Add CSRF token to FormData
 * @param formData - FormData object to add token to
 * @returns FormData with CSRF token field added
 */
export function addCsrfToFormData(formData: FormData): FormData {
    const token = getOrCreateCsrfToken();
    formData.append('csrf_token', token);
    return formData;
}

/**
 * Add CSRF token to URL query parameters
 * @param url - URL string or URL object
 * @returns URL with CSRF token query parameter
 */
export function addCsrfToUrl(url: string | URL): string {
    const urlObj = typeof url === 'string' ? new URL(url, window.location.origin) : url;
    const token = getOrCreateCsrfToken();
    
    urlObj.searchParams.set('csrf_token', token);
    return urlObj.toString();
}

/**
 * Validate CSRF token from request
 * @param token - Token to validate
 * @returns True if token is valid
 */
export function validateCsrfToken(token: string): boolean {
    const storedToken = getCsrfToken();
    
    if (!storedToken || !token) return false;
    
    // Timing-safe comparison to prevent timing attacks
    if (token.length !== storedToken.length) return false;
    
    let result = 0;
    for (let i = 0; i < token.length; i++) {
        result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
    }
    
    return result === 0;
}

/**
 * Rotate CSRF token (generate new one)
 * Should be called after sensitive operations or periodically
 */
export function rotateCsrfToken(): string {
    clearCsrfToken();
    const newToken = generateCsrfToken();
    storeCsrfToken(newToken);
    return newToken;
}

/**
 * Fetch wrapper with automatic CSRF token injection
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Fetch promise
 */
export async function csrfFetch(url: string | URL, options: RequestInit = {}): Promise<Response> {
    const method = options.method?.toUpperCase() || 'GET';
    
    // Only add CSRF token for state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const headers = new Headers(options.headers);
        
        if (!headers.has('X-CSRF-Token')) {
            const token = getOrCreateCsrfToken();
            headers.set('X-CSRF-Token', token);
        }
        
        options.headers = headers;
    }
    
    return fetch(url, options);
}

/**
 * React hook for CSRF protection
 * Provides token and utilities for form submission
 */
export function useCsrf() {
    const token = getOrCreateCsrfToken();
    
    return {
        token,
        addToHeaders: (headers?: Record<string, string>) => addCsrfHeader(headers),
        addToFormData: (formData: FormData) => addCsrfToFormData(formData),
        addToUrl: (url: string | URL) => addCsrfToUrl(url),
        validate: (tokenToValidate: string) => validateCsrfToken(tokenToValidate),
        rotate: () => rotateCsrfToken(),
        fetch: csrfFetch,
    };
}

/**
 * Higher-order function to wrap API calls with CSRF protection
 * @param apiCall - Original API function
 * @returns Wrapped function with CSRF protection
 */
export function withCsrfProtection<T extends (...args: any[]) => Promise<any>>(
    apiCall: T
): T {
    return (async (...args: Parameters<T>) => {
        // Ensure token exists before API call
        getOrCreateCsrfToken();
        return apiCall(...args);
    }) as T;
}

/**
 * CSRF-protected form submission helper
 * @param formElement - HTML form element
 * @param onSubmit - Submit handler function
 * @returns Form submit event handler
 */
export function csrfFormSubmit(
    formElement: HTMLFormElement,
    onSubmit: (formData: FormData) => Promise<void>
) {
    return async (event: Event) => {
        event.preventDefault();
        
        const formData = new FormData(formElement);
        addCsrfToFormData(formData);
        
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('CSRF-protected form submission failed:', error);
            throw error;
        }
    };
}

/**
 * Initialize CSRF protection on page load
 * Call this in App.tsx or main entry point
 */
export function initializeCsrfProtection(): void {
    // Generate initial token
    getOrCreateCsrfToken();
    
    // Rotate token on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Check if token is expired and rotate if needed
            const token = getCsrfToken();
            if (!token) {
                rotateCsrfToken();
            }
        }
    });
    
    // Rotate token periodically (every 30 minutes)
    setInterval(() => {
        rotateCsrfToken();
    }, 1800000); // 30 minutes
}

/**
 * CSRF-protected axios interceptor configuration
 * Use this if using axios instead of fetch
 */
export const csrfAxiosInterceptor = {
    request: (config: any) => {
        const method = config.method?.toUpperCase();
        
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            const token = getOrCreateCsrfToken();
            config.headers = config.headers || {};
            config.headers['X-CSRF-Token'] = token;
        }
        
        return config;
    },
    
    requestError: (error: any) => {
        return Promise.reject(error);
    },
};

export default {
    generateCsrfToken,
    getCsrfToken,
    getOrCreateCsrfToken,
    clearCsrfToken,
    addCsrfHeader,
    addCsrfToFormData,
    addCsrfToUrl,
    validateCsrfToken,
    rotateCsrfToken,
    csrfFetch,
    useCsrf,
    withCsrfProtection,
    csrfFormSubmit,
    initializeCsrfProtection,
    csrfAxiosInterceptor,
};

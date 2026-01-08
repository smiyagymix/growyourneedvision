/**
 * AI Service Types
 * Proper types for AI context and requests
 */

export interface AIContextData {
    userId?: string;
    tenantId?: string;
    conversationId?: string;
    previousMessages?: string[];
    userPreferences?: Record<string, string | number | boolean>;
    [key: string]: string | number | boolean | string[] | Record<string, string | number | boolean> | undefined;
}

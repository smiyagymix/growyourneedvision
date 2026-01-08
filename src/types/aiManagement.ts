/**
 * AI Management Types
 * Proper types for AI configuration and management
 */

export type AIConfigValue = string | number | boolean | string[] | number[] | AIConfigObject;

export interface AIConfigObject {
    [key: string]: AIConfigValue;
}

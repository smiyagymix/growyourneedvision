/**
 * A/B Testing Types
 * Proper types for A/B test variant configurations
 */

export interface VariantConfig {
    featureFlag?: boolean;
    color?: string;
    layout?: string;
    text?: string;
    price?: number;
    discount?: number;
    [key: string]: string | number | boolean | undefined;
}

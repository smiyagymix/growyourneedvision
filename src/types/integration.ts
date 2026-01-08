/**
 * Integration Types
 * Proper types for third-party integrations
 */

export interface EmailIntegrationConfig {
    host?: string;
    port?: number;
    secure?: boolean;
    from_email?: string;
    from_name?: string;
    username?: string;
    password?: string;
    api_key?: string;
}

export interface AnalyticsIntegrationConfig {
    tracking_id?: string;
    measurement_id?: string;
    project_token?: string;
    api_key?: string;
    [key: string]: string | number | boolean | undefined;
}

export interface PaymentIntegrationConfig {
    mode?: 'live' | 'test';
    webhook_url?: string;
    api_key?: string;
    public_key?: string;
    secret_key?: string;
    [key: string]: string | number | boolean | undefined;
}

export interface StorageIntegrationConfig {
    endpoint?: string;
    bucket?: string;
    region?: string;
    access_key?: string;
    secret_key?: string;
    [key: string]: string | number | boolean | undefined;
}

export type IntegrationConfigData = 
    | EmailIntegrationConfig 
    | AnalyticsIntegrationConfig 
    | PaymentIntegrationConfig 
    | StorageIntegrationConfig;

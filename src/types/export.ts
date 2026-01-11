/**
 * Export Types
 * Proper types for data exports
 */

export interface ExportMetadata {
    exportedBy?: string;
    exportedAt?: string;
    source?: string;
    version?: string;
    filters?: {
        dateRange?: {
            start: string;
            end: string;
        };
        status?: string[];
        [key: string]: string | string[] | { start: string; end: string } | undefined;
    };
    [key: string]: any;
}

export type ExportRow = (string | number | boolean | null)[];

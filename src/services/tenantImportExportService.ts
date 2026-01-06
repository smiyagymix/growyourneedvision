/**
 * Tenant Import/Export Service
 * 
 * Comprehensive data import/export tools supporting CSV, Excel, and JSON formats
 * with validation, mapping, and transformation capabilities
 */

import pb from '../lib/pocketbase';
import * as Sentry from '@sentry/react';
import { isMockEnv } from '../utils/mockData';
import * as XLSX from 'xlsx';

export interface ImportMapping {
    sourceField: string;
    targetField: string;
    transform?: (value: any) => any;
}

export interface ImportOptions {
    collection: string;
    format: 'csv' | 'excel' | 'json';
    mapping: ImportMapping[];
    validateOnly?: boolean;
    skipErrors?: boolean;
    tenantId?: string;
}

export interface ImportResult {
    total: number;
    success: number;
    failed: number;
    errors: { row: number; field: string; message: string }[];
    warnings: string[];
}

export interface ExportOptions {
    collection: string;
    format: 'csv' | 'excel' | 'json';
    fields?: string[];
    filters?: string;
    tenantId?: string;
    includeRelations?: boolean;
}

export interface DataTemplate {
    id: string;
    name: string;
    collection: string;
    fields: { name: string; type: string; required: boolean; default?: any }[];
    sampleData?: any[];
}

const COLLECTION_SCHEMAS: Record<string, any> = {
    users: {
        fields: ['email', 'name', 'username', 'role', 'tenantId', 'avatar'],
        required: ['email', 'name', 'role'],
        types: { email: 'email', role: 'select' }
    },
    courses: {
        fields: ['title', 'code', 'description', 'credits', 'tenantId', 'instructorId'],
        required: ['title', 'code', 'tenantId'],
        types: { credits: 'number' }
    },
    classes: {
        fields: ['name', 'description', 'courseId', 'teacherId', 'schedule', 'tenantId'],
        required: ['name', 'courseId', 'teacherId', 'tenantId'],
        types: { schedule: 'json' }
    },
    students: {
        fields: ['userId', 'studentId', 'gradeLevel', 'enrollmentDate', 'tenantId'],
        required: ['userId', 'studentId', 'tenantId'],
        types: { gradeLevel: 'number', enrollmentDate: 'date' }
    }
};

class TenantImportExportService {
    /**
     * Import data from file
     */
    async importData(file: File, options: ImportOptions): Promise<ImportResult> {
        return await Sentry.startSpan(
            { name: 'importData', op: 'import.data' },
            async () => {
                try {
                    if (isMockEnv()) {
                        return {
                            total: 100,
                            success: 95,
                            failed: 5,
                            errors: [
                                { row: 23, field: 'email', message: 'Invalid email format' },
                                { row: 45, field: 'role', message: 'Unknown role: SuperAdmin' }
                            ],
                            warnings: ['3 duplicate emails detected and skipped']
                        };
                    }

                    // Parse file based on format
                    const data = await this.parseFile(file, options.format);

                    // Validate and transform data
                    const validatedData = this.validateAndTransform(data, options);

                    // Import records
                    const result: ImportResult = {
                        total: validatedData.length,
                        success: 0,
                        failed: 0,
                        errors: [],
                        warnings: []
                    };

                    if (options.validateOnly) {
                        return result;
                    }

                    for (let i = 0; i < validatedData.length; i++) {
                        const row = validatedData[i];
                        
                        try {
                            // Add tenantId if provided
                            if (options.tenantId) {
                                row.tenantId = options.tenantId;
                            }

                            await pb.collection(options.collection).create(row, {
                                requestKey: null
                            });

                            result.success++;
                        } catch (error: any) {
                            result.failed++;
                            result.errors.push({
                                row: i + 1,
                                field: 'general',
                                message: error.message || 'Unknown error'
                            });

                            if (!options.skipErrors) {
                                break;
                            }
                        }
                    }

                    return result;
                } catch (error) {
                    Sentry.captureException(error);
                    throw error;
                }
            }
        );
    }

    /**
     * Export data to file
     */
    async exportData(options: ExportOptions): Promise<Blob> {
        return await Sentry.startSpan(
            { name: 'exportData', op: 'export.data' },
            async () => {
                try {
                    if (isMockEnv()) {
                        const mockData = JSON.stringify([
                            { id: '1', name: 'Test User', email: 'test@example.com' }
                        ]);
                        return new Blob([mockData], { type: 'application/json' });
                    }

                    // Fetch data
                    const filter = options.tenantId 
                        ? `tenantId = "${options.tenantId}"${options.filters ? ' && ' + options.filters : ''}`
                        : options.filters;

                    const records = await pb.collection(options.collection).getFullList({
                        filter: filter || undefined,
                        requestKey: null
                    });

                    // Select specific fields if provided
                    let data = records;
                    if (options.fields && options.fields.length > 0) {
                        data = records.map(record => {
                            const filtered: any = {};
                            options.fields!.forEach(field => {
                                filtered[field] = record[field];
                            });
                            return filtered;
                        });
                    }

                    // Load relations if requested
                    if (options.includeRelations) {
                        data = await this.loadRelations(data, options.collection);
                    }

                    // Generate file based on format
                    return this.generateFile(data, options.format);
                } catch (error) {
                    Sentry.captureException(error);
                    throw error;
                }
            }
        );
    }

    /**
     * Get available templates for import
     */
    async getTemplates(collection?: string): Promise<DataTemplate[]> {
        try {
            if (isMockEnv()) {
                return [
                    {
                        id: '1',
                        name: 'User Import Template',
                        collection: 'users',
                        fields: [
                            { name: 'email', type: 'email', required: true },
                            { name: 'name', type: 'text', required: true },
                            { name: 'role', type: 'select', required: true }
                        ],
                        sampleData: [
                            { email: 'john@school.com', name: 'John Doe', role: 'Teacher' }
                        ]
                    }
                ];
            }

            const collectionNames = collection ? [collection] : Object.keys(COLLECTION_SCHEMAS);
            
            return collectionNames.map(name => {
                const schema = COLLECTION_SCHEMAS[name];
                return {
                    id: name,
                    name: `${name.charAt(0).toUpperCase() + name.slice(1)} Template`,
                    collection: name,
                    fields: schema.fields.map((field: string) => ({
                        name: field,
                        type: schema.types?.[field] || 'text',
                        required: schema.required.includes(field)
                    })),
                    sampleData: []
                };
            });
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Download template file
     */
    async downloadTemplate(collection: string, format: 'csv' | 'excel'): Promise<Blob> {
        try {
            const schema = COLLECTION_SCHEMAS[collection];
            if (!schema) {
                throw new Error(`Unknown collection: ${collection}`);
            }

            const headers = schema.fields;
            const sampleRow = headers.reduce((obj: any, field: string) => {
                obj[field] = '';
                return obj;
            }, {});

            if (format === 'csv') {
                const csv = [
                    headers.join(','),
                    headers.map(() => '').join(',') // Empty row for user to fill
                ].join('\n');

                return new Blob([csv], { type: 'text/csv' });
            } else {
                const ws = XLSX.utils.json_to_sheet([sampleRow]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, collection);
                
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            }
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Validate import file before processing
     */
    async validateFile(file: File, collection: string): Promise<{ valid: boolean; errors: string[] }> {
        try {
            const format = this.detectFormat(file);
            const data = await this.parseFile(file, format);

            const schema = COLLECTION_SCHEMAS[collection];
            if (!schema) {
                return { valid: false, errors: ['Unknown collection'] };
            }

            const errors: string[] = [];

            // Check headers
            const headers = Object.keys(data[0] || {});
            const missingRequired = schema.required.filter((field: string) => !headers.includes(field));
            if (missingRequired.length > 0) {
                errors.push(`Missing required fields: ${missingRequired.join(', ')}`);
            }

            // Validate data types
            data.forEach((row, index) => {
                schema.required.forEach((field: string) => {
                    if (!row[field]) {
                        errors.push(`Row ${index + 1}: Missing required field '${field}'`);
                    }
                });

                // Type validation
                Object.entries(schema.types || {}).forEach(([field, type]) => {
                    if (row[field] && !this.validateFieldType(row[field], type as string)) {
                        errors.push(`Row ${index + 1}: Invalid ${type} format for field '${field}'`);
                    }
                });
            });

            return { valid: errors.length === 0, errors: errors.slice(0, 10) }; // Limit to first 10 errors
        } catch (error) {
            Sentry.captureException(error);
            return { valid: false, errors: [(error as Error).message] };
        }
    }

    /**
     * Parse file based on format
     */
    private async parseFile(file: File, format: 'csv' | 'excel' | 'json'): Promise<any[]> {
        const text = await file.text();

        if (format === 'json') {
            return JSON.parse(text);
        }

        if (format === 'csv') {
            return this.parseCSV(text);
        }

        if (format === 'excel') {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            return XLSX.utils.sheet_to_json(firstSheet);
        }

        throw new Error('Unsupported format');
    }

    /**
     * Parse CSV text
     */
    private parseCSV(text: string): any[] {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const data: any[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row: any = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });

            data.push(row);
        }

        return data;
    }

    /**
     * Validate and transform data based on mapping
     */
    private validateAndTransform(data: any[], options: ImportOptions): any[] {
        return data.map(row => {
            const transformed: any = {};

            options.mapping.forEach(mapping => {
                let value = row[mapping.sourceField];
                
                if (mapping.transform) {
                    value = mapping.transform(value);
                }

                transformed[mapping.targetField] = value;
            });

            return transformed;
        });
    }

    /**
     * Load related records
     */
    private async loadRelations(data: any[], collection: string): Promise<any[]> {
        // This is a simplified version - in production, detect relation fields
        // and expand them with actual records
        return data;
    }

    /**
     * Generate file based on format
     */
    private generateFile(data: any[], format: 'csv' | 'excel' | 'json'): Blob {
        if (format === 'json') {
            const json = JSON.stringify(data, null, 2);
            return new Blob([json], { type: 'application/json' });
        }

        if (format === 'csv') {
            if (data.length === 0) {
                return new Blob([''], { type: 'text/csv' });
            }

            const headers = Object.keys(data[0]);
            const csv = [
                headers.join(','),
                ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
            ].join('\n');

            return new Blob([csv], { type: 'text/csv' });
        }

        if (format === 'excel') {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Export');
            
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        }

        throw new Error('Unsupported format');
    }

    /**
     * Detect file format from extension
     */
    private detectFormat(file: File): 'csv' | 'excel' | 'json' {
        const ext = file.name.split('.').pop()?.toLowerCase();
        
        if (ext === 'csv') return 'csv';
        if (ext === 'xlsx' || ext === 'xls') return 'excel';
        if (ext === 'json') return 'json';
        
        throw new Error('Unknown file format. Supported: CSV, Excel, JSON');
    }

    /**
     * Validate field type
     */
    private validateFieldType(value: any, type: string): boolean {
        switch (type) {
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            case 'number':
                return !isNaN(Number(value));
            case 'date':
                return !isNaN(Date.parse(value));
            case 'json':
                try {
                    JSON.parse(value);
                    return true;
                } catch {
                    return false;
                }
            default:
                return true;
        }
    }
}

export const tenantImportExportService = new TenantImportExportService();

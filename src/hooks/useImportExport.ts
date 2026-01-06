/**
 * Tenant Import/Export Hook
 * 
 * React Query hook for data import/export operations
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { tenantImportExportService, ImportOptions, ExportOptions } from '../services/tenantImportExportService';
import { useToast } from './useToast';

export const useImportExport = () => {
    const { addToast } = useToast();

    // Get templates
    const {
        data: templates,
        isLoading: isLoadingTemplates
    } = useQuery({
        queryKey: ['importTemplates'],
        queryFn: () => tenantImportExportService.getTemplates()
    });

    // Import data mutation
    const importData = useMutation({
        mutationFn: ({ file, options }: { file: File; options: ImportOptions }) =>
            tenantImportExportService.importData(file, options),
        onSuccess: (result) => {
            if (result.failed === 0) {
                addToast(`Successfully imported ${result.success} records`, 'success');
            } else {
                addToast(
                    `Imported ${result.success} records with ${result.failed} errors`,
                    'warning'
                );
            }
        },
        onError: (error: any) => {
            addToast(error.message || 'Import failed', 'error');
        }
    });

    // Export data mutation
    const exportData = useMutation({
        mutationFn: (options: ExportOptions) =>
            tenantImportExportService.exportData(options),
        onSuccess: (blob, variables) => {
            // Trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${variables.collection}_export.${variables.format === 'excel' ? 'xlsx' : variables.format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            addToast('Export completed successfully', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Export failed', 'error');
        }
    });

    // Download template mutation
    const downloadTemplate = useMutation({
        mutationFn: ({ collection, format }: { collection: string; format: 'csv' | 'excel' }) =>
            tenantImportExportService.downloadTemplate(collection, format),
        onSuccess: (blob, variables) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${variables.collection}_template.${variables.format === 'excel' ? 'xlsx' : 'csv'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            addToast('Template downloaded', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to download template', 'error');
        }
    });

    // Validate file mutation
    const validateFile = useMutation({
        mutationFn: ({ file, collection }: { file: File; collection: string }) =>
            tenantImportExportService.validateFile(file, collection),
        onSuccess: (result) => {
            if (result.valid) {
                addToast('File validation passed', 'success');
            } else {
                addToast(`Validation failed: ${result.errors.join(', ')}`, 'error');
            }
        },
        onError: (error: any) => {
            addToast(error.message || 'Validation failed', 'error');
        }
    });

    return {
        templates,
        importData,
        exportData,
        downloadTemplate,
        validateFile,
        isLoadingTemplates,
        isImporting: importData.isPending,
        isExporting: exportData.isPending,
        isDownloading: downloadTemplate.isPending,
        isValidating: validateFile.isPending
    };
};

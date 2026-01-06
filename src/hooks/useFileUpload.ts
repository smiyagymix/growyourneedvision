import { useState, useCallback } from 'react';
import {
    UploadedFile,
    UseFileUploadOptions,
    UseFileUploadReturn,
    validateFile,
} from '../types/file';

/**
 * File Upload Hook
 * Manages file upload state and operations
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
    const {
        maxSize,
        maxFiles = 1,
        acceptedTypes,
        onUpload,
        autoUpload = false,
    } = options;

    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Generate unique ID for file
     */
    const generateId = useCallback(() => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    /**
     * Create preview URL for images
     */
    const createPreview = useCallback((file: File): string | undefined => {
        if (file.type.startsWith('image/')) {
            return URL.createObjectURL(file);
        }
        return undefined;
    }, []);

    /**
     * Add files to upload queue
     */
    const addFiles = useCallback((newFiles: FileList | File[]) => {
        setError(null);
        const fileArray = Array.from(newFiles);

        // Check max files limit
        if (files.length + fileArray.length > maxFiles) {
            setError(`Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed`);
            return;
        }

        // Validate and prepare files
        const validatedFiles: UploadedFile[] = [];

        for (const file of fileArray) {
            const validation = validateFile(file, { maxSize, acceptedTypes });

            if (!validation.valid) {
                setError(validation.error || 'Invalid file');
                continue;
            }

            validatedFiles.push({
                id: generateId(),
                file,
                preview: createPreview(file),
                progress: 0,
                status: 'pending',
            });
        }

        setFiles(prev => [...prev, ...validatedFiles]);

        // Auto upload if enabled
        if (autoUpload && onUpload && validatedFiles.length > 0) {
            uploadFiles();
        }
    }, [files.length, maxFiles, maxSize, acceptedTypes, autoUpload, onUpload, generateId, createPreview]);

    /**
     * Remove file from queue
     */
    const removeFile = useCallback((id: string) => {
        setFiles(prev => {
            const updated = prev.filter(f => f.id !== id);
            // Revoke object URL to free memory
            const removed = prev.find(f => f.id === id);
            if (removed?.preview) {
                URL.revokeObjectURL(removed.preview);
            }
            return updated;
        });
    }, []);

    /**
     * Upload files
     */
    const uploadFiles = useCallback(async () => {
        if (!onUpload || files.length === 0) return;

        setIsUploading(true);
        setError(null);

        try {
            // Update status to uploading
            setFiles(prev => prev.map(f => ({
                ...f,
                status: 'uploading' as const,
                progress: 0,
            })));

            // Extract File objects
            const fileObjects = files.map(f => f.file);

            // Call upload handler
            await onUpload(fileObjects);

            // Mark as success
            setFiles(prev => prev.map(f => ({
                ...f,
                status: 'success' as const,
                progress: 100,
            })));

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed';
            setError(errorMessage);

            // Mark as error
            setFiles(prev => prev.map(f => ({
                ...f,
                status: 'error' as const,
                error: errorMessage,
            })));
        } finally {
            setIsUploading(false);
        }
    }, [files, onUpload]);

    /**
     * Clear all files
     */
    const clearFiles = useCallback(() => {
        // Revoke all preview URLs
        files.forEach(f => {
            if (f.preview) {
                URL.revokeObjectURL(f.preview);
            }
        });
        setFiles([]);
        setError(null);
    }, [files]);

    /**
     * Calculate overall progress
     */
    const progress = files.length > 0
        ? files.reduce((sum, f) => sum + f.progress, 0) / files.length
        : 0;

    return {
        files,
        addFiles,
        removeFile,
        uploadFiles,
        clearFiles,
        isUploading,
        error,
        progress,
    };
}

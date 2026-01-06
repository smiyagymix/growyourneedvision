/**
 * File Upload Types
 * TypeScript interfaces for file upload system
 */

export interface UploadedFile {
    id: string;
    file: File;
    preview?: string;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    url?: string;
}

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

export interface FileUploaderProps {
    onUpload: (files: File[]) => Promise<void> | void;
    accept?: string;
    maxSize?: number;
    maxFiles?: number;
    showPreview?: boolean;
    label?: string;
    helperText?: string;
    disabled?: boolean;
    className?: string;
}

export interface UseFileUploadOptions {
    maxSize?: number;
    maxFiles?: number;
    acceptedTypes?: string[];
    onUpload?: (files: File[]) => Promise<void>;
    autoUpload?: boolean;
}

export interface UseFileUploadReturn {
    files: UploadedFile[];
    addFiles: (newFiles: FileList | File[]) => void;
    removeFile: (id: string) => void;
    uploadFiles: () => Promise<void>;
    clearFiles: () => void;
    isUploading: boolean;
    error: string | null;
    progress: number;
}

// File type constants
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
export const ALLOWED_SPREADSHEET_TYPES = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
export const ALLOWED_ARCHIVE_TYPES = ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'];

export const FILE_SIZE_LIMITS = {
    image: 5 * 1024 * 1024,      // 5MB
    document: 10 * 1024 * 1024,  // 10MB
    video: 50 * 1024 * 1024,     // 50MB
    archive: 20 * 1024 * 1024,   // 20MB
    default: 10 * 1024 * 1024,   // 10MB
};

export const FILE_TYPE_LABELS: Record<string, string> = {
    'image/png': 'PNG Image',
    'image/jpeg': 'JPEG Image',
    'image/jpg': 'JPG Image',
    'image/gif': 'GIF Image',
    'image/webp': 'WebP Image',
    'application/pdf': 'PDF Document',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'text/plain': 'Text File',
    'application/vnd.ms-excel': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
    'text/csv': 'CSV File',
    'application/zip': 'ZIP Archive',
};

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

/**
 * Validate file
 */
export function validateFile(
    file: File,
    options: {
        maxSize?: number;
        acceptedTypes?: string[];
    } = {}
): FileValidationResult {
    const { maxSize, acceptedTypes } = options;

    // Check file size
    if (maxSize && file.size > maxSize) {
        return {
            valid: false,
            error: `File size exceeds maximum (${formatFileSize(maxSize)})`
        };
    }

    // Check file type
    if (acceptedTypes && acceptedTypes.length > 0) {
        const isTypeAllowed = acceptedTypes.some(type => {
            if (type.includes('*')) {
                // Handle wildcards like "image/*"
                const [mainType] = type.split('/');
                return file.type.startsWith(mainType + '/');
            }
            return file.type === type || file.name.endsWith(type);
        });

        if (!isTypeAllowed) {
            return {
                valid: false,
                error: 'File type not supported'
            };
        }
    }

    return { valid: true };
}

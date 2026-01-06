import React, { useState, useCallback, useRef } from 'react';
import { fileUploadService } from '../../services/fileUploadService';
import { Button, Icon } from './ui/CommonUI';

export interface FileUploadProps {
    onUpload: (files: File[]) => void | Promise<void>;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in MB
    maxFiles?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
    disabled?: boolean;
    className?: string;
    children?: React.ReactNode;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    onUpload,
    accept = '*',
    multiple = false,
    maxSize = 10, // 10MB default
    maxFiles = 5,
    allowedTypes = [],
    allowedExtensions = [],
    disabled = false,
    className = '',
    children
}) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setErrors([]);

        if (files.length === 0) return;

        // Validate file count
        if (multiple && files.length > maxFiles) {
            setErrors([`Maximum ${maxFiles} files allowed`]);
            return;
        }

        // Validate each file
        const validationResult = fileUploadService.validateFiles(files, {
            maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
            allowedTypes,
            allowedExtensions
        });

        if (!validationResult.valid) {
            setErrors(validationResult.errors);
            return;
        }

        setSelectedFiles(files);
    }, [multiple, maxFiles, maxSize, allowedTypes, allowedExtensions]);

    const handleUpload = useCallback(async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setErrors([]);

        try {
            await onUpload(selectedFiles);
            setSelectedFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            setErrors([error instanceof Error ? error.message : 'Upload failed']);
        } finally {
            setUploading(false);
        }
    }, [selectedFiles, onUpload]);

    const handleRemoveFile = useCallback((index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleBrowse = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
            />

            {/* Upload area */}
            <div
                onClick={handleBrowse}
                className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gyn-blue-medium hover:bg-blue-50/50'}
          ${errors.length > 0 ? 'border-red-300 bg-red-50/50' : 'border-gray-300'}
        `}
            >
                {children || (
                    <>
                        <Icon name="CloudArrowUp" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700 mb-1">
                            Click to browse or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                            {allowedExtensions.length > 0
                                ? `Allowed: ${allowedExtensions.join(', ')}`
                                : accept !== '*'
                                    ? `Allowed: ${accept}`
                                    : 'Any file type'}
                            {' • '}
                            Max {maxSize}MB
                            {multiple && ` • Up to ${maxFiles} files`}
                        </p>
                    </>
                )}
            </div>

            {/* Error messages */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    {errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-600 flex items-center gap-2">
                            <Icon name="ExclamationCircle" className="w-4 h-4" />
                            {error}
                        </p>
                    ))}
                </div>
            )}

            {/* Selected files list */}
            {selectedFiles.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                        Selected Files ({selectedFiles.length})
                    </p>
                    {selectedFiles.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Icon name="Document" className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoveFile(index)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                disabled={uploading}
                            >
                                <Icon name="XMarkIcon" className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    ))}

                    {/* Upload button */}
                    <Button
                        variant="primary"
                        onClick={handleUpload}
                        disabled={uploading || disabled}
                        isLoading={uploading}
                        leftIcon={<Icon name="CloudArrowUp" className="w-4 h-4" />}
                        className="w-full"
                    >
                        {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default FileUpload;

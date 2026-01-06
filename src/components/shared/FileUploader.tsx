import React, { useRef, useState, DragEvent } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { FileUploaderProps, formatFileSize } from '../../types/file';
import { Icon } from './ui/CommonUI';

/**
 * FileUploader Component
 * Drag-and-drop file uploader with preview
 */
export const FileUploader: React.FC<FileUploaderProps> = ({
    onUpload,
    accept = '*/*',
    maxSize,
    maxFiles = 1,
    showPreview = true,
    label = 'Upload Files',
    helperText,
    disabled = false,
    className = '',
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const {
        files,
        addFiles,
        removeFile,
        uploadFiles,
        isUploading,
        error,
        progress,
    } = useFileUpload({
        maxSize,
        maxFiles,
        acceptedTypes: accept.split(',').map(t => t.trim()),
        onUpload: onUpload as any,
        autoUpload: true,
    });

    /**
     * Handle file input change
     */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
        }
    };

    /**
     * Handle drag over
     */
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    };

    /**
     * Handle drag leave
     */
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    /**
     * Handle drop
     */
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    /**
     * Trigger file input click
     */
    const handleClick = () => {
        if (!disabled && inputRef.current) {
            inputRef.current.click();
        }
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Upload Zone */}
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
          ${error ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''}
        `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={maxFiles > 1}
                    onChange={handleFileChange}
                    disabled={disabled}
                    className="hidden"
                />

                <div className="flex flex-col items-center gap-3">
                    {/* Icon */}
                    <div className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${isDragging ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'}
          `}>
                        <Icon
                            name="CloudArrowUp"
                            className={`w-6 h-6 ${isDragging ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                        />
                    </div>

                    {/* Label */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Drag and drop or{' '}
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                                browse
                            </span>
                        </p>
                    </div>

                    {/* Helper Text */}
                    {helperText && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {helperText}
                        </p>
                    )}
                </div>

                {/* Upload Progress */}
                {isUploading && (
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Uploading... {Math.round(progress)}%
                        </p>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-3 flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Icon name="ExclamationCircle" className="w-4 h-4" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Selected Files ({files.length})
                    </p>

                    {files.map(uploadedFile => (
                        <div
                            key={uploadedFile.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                            {/* Preview or Icon */}
                            {showPreview && uploadedFile.preview ? (
                                <img
                                    src={uploadedFile.preview}
                                    alt={uploadedFile.file.name}
                                    className="w-12 h-12 rounded object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <Icon name="Document" className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                </div>
                            )}

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                    {uploadedFile.file.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatFileSize(uploadedFile.file.size)}
                                </p>

                                {/* Progress for individual file */}
                                {uploadedFile.status === 'uploading' && (
                                    <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                        <div
                                            className="bg-blue-600 h-1 rounded-full transition-all"
                                            style={{ width: `${uploadedFile.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Status Icon */}
                            <div className="flex items-center gap-2">
                                {uploadedFile.status === 'success' && (
                                    <Icon name="CheckCircle" className="w-5 h-5 text-green-600 dark:text-green-400" />
                                )}
                                {uploadedFile.status === 'error' && (
                                    <Icon name="XCircle" className="w-5 h-5 text-red-600 dark:text-red-400" />
                                )}

                                {/* Remove Button */}
                                {uploadedFile.status !== 'uploading' && (
                                    <button
                                        onClick={() => removeFile(uploadedFile.id)}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                        disabled={isUploading}
                                    >
                                        <Icon name="Trash" className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

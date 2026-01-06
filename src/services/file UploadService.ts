import pb from '../lib/pocketbase';
import type { RecordModel } from 'pocketbase';

/**
 * File Upload Service
 * Handles file uploads to PocketBase
 */
class FileUploadService {
    /**
     * Upload single file to a PocketBase collection
     */
    async uploadToCollection(
        collection: string,
        recordId: string,
        fieldName: string,
        file: File
    ): Promise<RecordModel> {
        try {
            const formData = new FormData();
            formData.append(fieldName, file);

            const record = await pb.collection(collection).update(recordId, formData);
            return record;
        } catch (error) {
            console.error('File upload error:', error);
            throw new Error('Failed to upload file');
        }
    }

    /**
     * Upload multiple files to a PocketBase collection
     */
    async uploadMultiple(
        collection: string,
        recordId: string,
        fieldName: string,
        files: File[]
    ): Promise<RecordModel> {
        try {
            const formData = new FormData();
            files.forEach(file => formData.append(fieldName, file));

            const record = await pb.collection(collection).update(recordId, formData);
            return record;
        } catch (error) {
            console.error('Multiple file upload error:', error);
            throw new Error('Failed to upload files');
        }
    }

    /**
     * Delete file from a PocketBase record
     */
    async deleteFile(
        collection: string,
        recordId: string,
        fieldName: string,
        filename: string
    ): Promise<void> {
        try {
            // Get current record
            const record = await pb.collection(collection).getOne(recordId);
            const currentFiles = record[fieldName];

            if (Array.isArray(currentFiles)) {
                // Remove the specific file from array
                const updatedFiles = currentFiles.filter(f => f !== filename);
                await pb.collection(collection).update(recordId, {
                    [fieldName]: updatedFiles
                });
            } else {
                // Single file field - set to null
                await pb.collection(collection).update(recordId, {
                    [fieldName]: null
                });
            }
        } catch (error) {
            console.error('File delete error:', error);
            throw new Error('Failed to delete file');
        }
    }

    /**
     * Get file URL from PocketBase
     */
    getFileUrl(
        record: RecordModel,
        filename: string,
        queryParams?: Record<string, string>
    ): string {
        return pb.files.getUrl(record, filename, queryParams);
    }

    /**
     * Get thumbnail URL for images
     */
    getThumbnailUrl(
        record: RecordModel,
        filename: string,
        size: string = '100x100'
    ): string {
        return this.getFileUrl(record, filename, {
            thumb: size
        });
    }

    /**
     * Download file
     */
    async downloadFile(url: string, filename: string): Promise<void> {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(objectUrl);
        } catch (error) {
            console.error('File download error:', error);
            throw new Error('Failed to download file');
        }
    }
}

export const fileUploadService = new FileUploadService();

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3/R2 client
// Supports AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces, etc.
const s3Client = new S3Client({
    endpoint: import.meta.env.VITE_STORAGE_ENDPOINT || 'http://localhost:9090',
    region: import.meta.env.VITE_STORAGE_REGION || 'auto', // 'auto' for R2
    credentials: {
        accessKeyId: import.meta.env.VITE_STORAGE_ACCESS_KEY || '',
        secretAccessKey: import.meta.env.VITE_STORAGE_SECRET_KEY || '',
    },
    forcePathStyle: true, // Required for MinIO, usually safe for others
});

const BUCKET_NAME = import.meta.env.VITE_STORAGE_BUCKET || 'growyourneed-files';

export const storageService = {
    /**
     * Upload file to S3/R2 storage
     */
    async uploadFile(file: File, path: string) {
        // If no credentials, throw error in production
        if (!import.meta.env.VITE_STORAGE_ACCESS_KEY) {
            console.error("Storage Service: No credentials found.");
            throw new Error("Storage credentials missing");
        }

        try {
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: path,
                Body: file,
                ContentType: file.type,
            });

            await s3Client.send(command);

            // Construct public URL
            // For R2/S3, this might need a custom domain or public bucket URL
            const publicUrl = import.meta.env.VITE_STORAGE_PUBLIC_URL 
                ? `${import.meta.env.VITE_STORAGE_PUBLIC_URL}/${path}`
                : `${import.meta.env.VITE_STORAGE_ENDPOINT}/${BUCKET_NAME}/${path}`;

            return {
                url: publicUrl,
                key: path,
            };
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    },

    /**
     * Get a temporary signed URL for viewing/downloading a file
     */
    async getSignedUrl(key: string, expiresIn: number = 3600) {
        if (!import.meta.env.VITE_STORAGE_ACCESS_KEY) {
             return '#';
        }

        try {
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            });
            return await getSignedUrl(s3Client, command, { expiresIn });
        } catch (error) {
            console.error("Error generating signed URL:", error);
            return '';
        }
    },

    /**
     * Delete file from storage
     */
    async deleteFile(key: string) {
        if (!import.meta.env.VITE_STORAGE_ACCESS_KEY) return;

        try {
            const command = new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            });
            await s3Client.send(command);
        } catch (error) {
            console.error("Error deleting file:", error);
            throw error;
        }
    }
};

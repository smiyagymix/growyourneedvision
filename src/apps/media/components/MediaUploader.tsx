import React, { useState } from 'react';
import { Button, Icon } from '../../../components/shared/ui/CommonUI';
import { storageService } from '../../../services/storageService';
import pb from '../../../lib/pocketbase';

interface MediaUploaderProps {
    type: 'logo' | 'background-image' | 'background-video' | 'audio';
    currentUrl: string | null;
    onUploadComplete: (url: string) => void;
    onRemove: () => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
    type,
    currentUrl,
    onUploadComplete,
    onRemove,
}) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const getAcceptedTypes = (): string => {
        switch (type) {
            case 'logo':
            case 'background-image':
                return 'image/jpeg,image/png,image/gif,image/webp';
            case 'background-video':
                return 'video/mp4,video/webm,video/quicktime';
            case 'audio':
                return 'audio/mpeg,audio/wav,audio/ogg';
            default:
                return '*/*';
        }
    };

    const getMaxSize = (): number => {
        switch (type) {
            case 'logo':
                return 5 * 1024 * 1024; // 5MB
            case 'background-image':
                return 10 * 1024 * 1024; // 10MB
            case 'background-video':
                return 50 * 1024 * 1024; // 50MB
            case 'audio':
                return 20 * 1024 * 1024; // 20MB
            default:
                return 10 * 1024 * 1024;
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file size
        if (file.size > getMaxSize()) {
            alert(`File size exceeds maximum allowed size of ${getMaxSize() / 1024 / 1024}MB`);
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            // Upload to MinIO
            const bucket = 'video-assets';
            const filename = `${Date.now()}-${file.name}`;
            // Fixed: uploadFile takes (file, path) and returns { url, key }
            const uploadResult = await storageService.uploadFile(file, filename);

            clearInterval(progressInterval);
            setProgress(100);

            // Also store reference in PocketBase for tracking
            await pb.collection('media_uploads').create({
                type,
                filename,
                url: uploadResult.url,
                size: file.size,
                uploaded_by: pb.authStore.model?.id,
            });

            onUploadComplete(uploadResult.url);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const getLabel = (): string => {
        switch (type) {
            case 'logo':
                return 'Upload Logo';
            case 'background-image':
                return 'Upload Background Image';
            case 'background-video':
                return 'Upload Background Video';
            case 'audio':
                return 'Upload Audio Track';
            default:
                return 'Upload';
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <label className="flex-1">
                    <input
                        type="file"
                        accept={getAcceptedTypes()}
                        onChange={handleFileSelect}
                        disabled={uploading}
                        className="hidden"
                    />
                    <Button
                        variant={currentUrl ? 'outline' : 'primary'}
                        size="sm"
                        icon="ArrowUpTrayIcon"
                        disabled={uploading}
                        onClick={() => { }}
                        className="w-full pointer-events-none"
                    >
                        {uploading ? `Uploading... ${progress}%` : getLabel()}
                    </Button>
                </label>
                {currentUrl && (
                    <Button
                        variant="ghost"
                        size="sm"
                        icon="TrashIcon"
                        onClick={onRemove}
                        className="text-red-500"
                        title="Remove"
                    />
                )}
            </div>

            {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {currentUrl && type !== 'audio' && (
                <div className="relative w-full h-20 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                    {type === 'background-video' ? (
                        <video
                            src={currentUrl}
                            className="w-full h-full object-cover"
                            muted
                        />
                    ) : (
                        <img
                            src={currentUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
            )}

            {currentUrl && type === 'audio' && (
                <audio src={currentUrl} controls className="w-full" />
            )}
        </div>
    );
};

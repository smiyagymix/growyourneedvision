import { useState, useCallback } from 'react';

interface MediaItem {
    type: 'logo' | 'background-image' | 'background-video' | 'audio';
    url: string;
    filename: string;
    size: number;
}

interface UseMediaManagerReturn {
    media: Record<string, MediaItem | null>;
    addMedia: (type: string, item: MediaItem) => void;
    removeMedia: (type: string) => void;
    clearAllMedia: () => void;
    hasMedia: (type: string) => boolean;
}

export const useMediaManager = (): UseMediaManagerReturn => {
    const [media, setMedia] = useState<Record<string, MediaItem | null>>({
        logo: null,
        'background-image': null,
        'background-video': null,
        audio: null,
    });

    const addMedia = useCallback((type: string, item: MediaItem) => {
        setMedia(prev => ({
            ...prev,
            [type]: item,
        }));
    }, []);

    const removeMedia = useCallback((type: string) => {
        setMedia(prev => ({
            ...prev,
            [type]: null,
        }));
    }, []);

    const clearAllMedia = useCallback(() => {
        setMedia({
            logo: null,
            'background-image': null,
            'background-video': null,
            audio: null,
        });
    }, []);

    const hasMedia = useCallback((type: string): boolean => {
        return media[type] !== null;
    }, [media]);

    return {
        media,
        addMedia,
        removeMedia,
        clearAllMedia,
        hasMedia,
    };
};

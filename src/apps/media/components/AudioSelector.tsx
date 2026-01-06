import React, { useState } from 'react';
import { Button, Icon, Card } from '../../../components/shared/ui/CommonUI';
import { MediaUploader } from './MediaUploader';

interface AudioTrack {
    id: string;
    name: string;
    url: string;
    duration: number;
    category: 'upbeat' | 'calm' | 'corporate' | 'educational';
}

// Pre-defined audio library
const AUDIO_LIBRARY: AudioTrack[] = [
    {
        id: 'upbeat-1',
        name: 'Upbeat Energy',
        url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
        duration: 30,
        category: 'upbeat',
    },
    {
        id: 'calm-1',
        name: 'Peaceful Morning',
        url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_2016f7c31d.mp3',
        duration: 42,
        category: 'calm',
    },
    {
        id: 'corporate-1',
        name: 'Professional Success',
        url: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe25f21.mp3',
        duration: 35,
        category: 'corporate',
    },
    {
        id: 'educational-1',
        name: 'Learning Loop',
        url: 'https://cdn.pixabay.com/download/audio/2022/06/07/audio_c2c2b0e923.mp3',
        duration: 28,
        category: 'educational',
    },
];

interface AudioSelectorProps {
    currentAudioUrl: string | null;
    onAudioSelect: (url: string) => void;
    onAudioRemove: () => void;
}

export const AudioSelector: React.FC<AudioSelectorProps> = ({
    currentAudioUrl,
    onAudioSelect,
    onAudioRemove,
}) => {
    const [showLibrary, setShowLibrary] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('all');

    const filteredTracks = AUDIO_LIBRARY.filter(
        track => filterCategory === 'all' || track.category === filterCategory
    );

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Button
                    variant={showLibrary ? 'ghost' : 'outline'}
                    size="sm"
                    onClick={() => setShowLibrary(false)}
                    className="flex-1"
                >
                    Upload Audio
                </Button>
                <Button
                    variant={showLibrary ? 'outline' : 'ghost'}
                    size="sm"
                    onClick={() => setShowLibrary(true)}
                    className="flex-1"
                >
                    Audio Library
                </Button>
            </div>

            {!showLibrary ? (
                <MediaUploader
                    type="audio"
                    currentUrl={currentAudioUrl}
                    onUploadComplete={onAudioSelect}
                    onRemove={onAudioRemove}
                />
            ) : (
                <Card className="p-4 space-y-4 max-h-96 overflow-y-auto">
                    {/* Category Filter */}
                    <div className="flex gap-2 flex-wrap">
                        {['all', 'upbeat', 'calm', 'corporate', 'educational'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterCategory === cat
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Track List */}
                    <div className="space-y-2">
                        {filteredTracks.map(track => (
                            <div
                                key={track.id}
                                className={`p-3 rounded-lg border transition-all ${currentAudioUrl === track.url
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                            {track.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {track.duration}s • {track.category}
                                        </p>
                                    </div>
                                    <Button
                                        variant={currentAudioUrl === track.url ? 'primary' : 'outline'}
                                        size="sm"
                                        onClick={() =>
                                            currentAudioUrl === track.url
                                                ? onAudioRemove()
                                                : onAudioSelect(track.url)
                                        }
                                    >
                                        {currentAudioUrl === track.url ? 'Selected' : 'Select'}
                                    </Button>
                                </div>
                                <audio src={track.url} controls className="w-full" />
                            </div>
                        ))}
                    </div>

                    {filteredTracks.length === 0 && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                            No tracks found in this category
                        </p>
                    )}
                </Card>
            )}
        </div>
    );
};

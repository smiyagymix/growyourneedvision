import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { VideoProject, VideoTrack, VideoClip, ClipType } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface VideoState {
    project: VideoProject;
    currentFrame: number;
    isPlaying: boolean;
    selectedClipId: string | null;
    scale: number; // Zoom level for timeline
}

type Action =
    | { type: 'SET_PROJECT'; payload: VideoProject }
    | { type: 'SET_CURRENT_FRAME'; payload: number }
    | { type: 'TOGGLE_PLAYBACK'; payload: boolean }
    | { type: 'SELECT_CLIP'; payload: string | null }
    | { type: 'ADD_TRACK'; payload: VideoTrack }
    | { type: 'ADD_CLIP'; payload: { trackId: string; clip: VideoClip } }
    | { type: 'UPDATE_CLIP'; payload: { clipId: string; updates: Partial<VideoClip> } }
    | { type: 'REMOVE_CLIP'; payload: string }
    | { type: 'SET_SCALE'; payload: number };

const initialState: VideoState = {
    project: {
        id: 'default',
        name: 'Untitled Project',
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 300, // 10 seconds
        backgroundColor: '#000000',
        tracks: [
            { id: 'track-1', type: 'main', name: 'Main Track', clips: [] },
            { id: 'track-2', type: 'overlay', name: 'Overlay', clips: [] },
            { id: 'track-3', type: 'audio', name: 'Audio', clips: [] },
        ],
    },
    currentFrame: 0,
    isPlaying: false,
    selectedClipId: null,
    scale: 1,
};

const videoReducer = (state: VideoState, action: Action): VideoState => {
    switch (action.type) {
        case 'SET_PROJECT':
            return { ...state, project: action.payload };
        case 'SET_CURRENT_FRAME':
            return { ...state, currentFrame: Math.max(0, Math.min(state.project.durationInFrames, action.payload)) };
        case 'TOGGLE_PLAYBACK':
            return { ...state, isPlaying: action.payload };
        case 'SELECT_CLIP':
            return { ...state, selectedClipId: action.payload };
        case 'ADD_TRACK':
            return {
                ...state,
                project: {
                    ...state.project,
                    tracks: [...state.project.tracks, action.payload],
                },
            };
        case 'ADD_CLIP':
            return {
                ...state,
                project: {
                    ...state.project,
                    tracks: state.project.tracks.map(track =>
                        track.id === action.payload.trackId
                            ? { ...track, clips: [...track.clips, action.payload.clip] }
                            : track
                    ),
                },
            };
        case 'UPDATE_CLIP':
            return {
                ...state,
                project: {
                    ...state.project,
                    tracks: state.project.tracks.map(track => ({
                        ...track,
                        clips: track.clips.map(clip =>
                            clip.id === action.payload.clipId
                                ? { ...clip, ...action.payload.updates }
                                : clip
                        ),
                    })),
                },
            };
        case 'REMOVE_CLIP':
            return {
                ...state,
                project: {
                    ...state.project,
                    tracks: state.project.tracks.map(track => ({
                        ...track,
                        clips: track.clips.filter(clip => clip.id !== action.payload),
                    })),
                },
            };
        case 'SET_SCALE':
            return { ...state, scale: action.payload };
        default:
            return state;
    }
};

const VideoContext = createContext<{
    state: VideoState;
    dispatch: React.Dispatch<Action>;
    actions: {
        play: () => void;
        pause: () => void;
        seek: (frame: number) => void;
        addClip: (trackId: string, clip: Omit<VideoClip, 'id'>) => void;
        updateClip: (clipId: string, updates: Partial<VideoClip>) => void;
        removeClip: (clipId: string) => void;
        selectClip: (clipId: string | null) => void;
    };
} | null>(null);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(videoReducer, initialState);

    const actions = {
        play: useCallback(() => dispatch({ type: 'TOGGLE_PLAYBACK', payload: true }), []),
        pause: useCallback(() => dispatch({ type: 'TOGGLE_PLAYBACK', payload: false }), []),
        seek: useCallback((frame: number) => dispatch({ type: 'SET_CURRENT_FRAME', payload: frame }), []),
        addClip: useCallback((trackId: string, clip: Omit<VideoClip, 'id'>) => {
            const newClip: VideoClip = { ...clip, id: generateId() };
            dispatch({ type: 'ADD_CLIP', payload: { trackId, clip: newClip } });
        }, []),
        updateClip: useCallback((clipId: string, updates: Partial<VideoClip>) => {
            dispatch({ type: 'UPDATE_CLIP', payload: { clipId, updates } });
        }, []),
        removeClip: useCallback((clipId: string) => {
            dispatch({ type: 'REMOVE_CLIP', payload: clipId });
        }, []),
        selectClip: useCallback((clipId: string | null) => {
            dispatch({ type: 'SELECT_CLIP', payload: clipId });
        }, []),
    };

    return (
        <VideoContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideoStore = () => {
    const context = useContext(VideoContext);
    if (!context) {
        throw new Error('useVideoStore must be used within a VideoProvider');
    }
    return context;
};

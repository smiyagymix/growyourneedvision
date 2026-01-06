export type ClipType = 'video' | 'image' | 'text' | 'audio';

export interface VideoClip {
    id: string;
    type: ClipType;
    startFrame: number;
    durationInFrames: number;
    trackId: string;
    content: string; // URL or text
    props: Record<string, any>; // x, y, width, height, style, etc.
    name?: string;
}

export interface VideoTrack {
    id: string;
    type: 'main' | 'overlay' | 'audio';
    name: string;
    clips: VideoClip[];
    isMuted?: boolean;
    isHidden?: boolean;
}

export interface VideoProject {
    id: string;
    name: string;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    tracks: VideoTrack[];
    backgroundColor: string;
}

export type TemplateType = 'educational' | 'corporate' | 'minimal';

export interface BaseVideoProps {
    title: string;
    subtitle: string;
    primaryColor: string;
    backgroundColor: string;
    logoUrl: string | null;
    backgroundImageUrl: string | null;
    backgroundVideoUrl: string | null;
    audioUrl: string | null;
    audioVolume: number;
    audioStartFrom: number;
}

export interface EducationalProps extends BaseVideoProps {
    lessonNumber: string;
    subject: string;
}

export interface CorporateProps extends BaseVideoProps {
    companyName: string;
    tagline: string;
}

export interface MinimalProps extends BaseVideoProps {
    accentPosition: 'top' | 'bottom' | 'center';
}

export interface MediaUploadState {
    logoUrl: string | null;
    backgroundImageUrl: string | null;
    backgroundVideoUrl: string | null;
    audioUrl: string | null;
}

export interface AudioTrackData {
    url: string;
    volume: number;
    startFrom: number;
    loopAudio: boolean;
}

export interface ExportSettings {
    format: 'mp4' | 'gif' | 'webm';
    quality: 'low' | 'medium' | 'high';
}

export interface VideoEditorState {
    // Template
    templateType: TemplateType;

    // Content
    title: string;
    subtitle: string;

    // Styling
    primaryColor: string;
    backgroundColor: string;

    // Template-specific
    lessonNumber: string;
    subject: string;
    companyName: string;
    tagline: string;
    accentPosition: 'top' | 'bottom' | 'center';

    // Media
    logoUrl: string | null;
    backgroundImageUrl: string | null;
    backgroundVideoUrl: string | null;
    audioUrl: string | null;

    // Audio settings
    volume: number;
    audioStartFrom: number;
    loopAudio: boolean;

    // Video settings
    durationInFrames: number;
    fps: 30 | 60;

    // Export
    exportFormat: 'mp4' | 'gif' | 'webm';
    exporting: boolean;
}

import React, { useState } from 'react';
import { Player } from '@remotion/player';
import { Card, Button, Input, Icon } from '../../components/shared/ui/CommonUI';
import { MyVideo } from './VideoTemplate';
import { EducationalTemplate } from './templates/EducationalTemplate';
import { CorporateTemplate } from './templates/CorporateTemplate';
import { MinimalTemplate } from './templates/MinimalTemplate';
import { MediaUploader } from './components/MediaUploader';
import { AudioSelector } from './components/AudioSelector';
import { Timeline } from './components/Timeline';
import { useVideoExport } from './hooks/useVideoExport';
import { VideoExportService } from './services/exportService';
import { TemplateType, VideoEditorState } from './templates/types';

const TEMPLATE_COMPONENTS = {
    educational: EducationalTemplate,
    corporate: CorporateTemplate,
    minimal: MinimalTemplate,
};

export const VideoEditor: React.FC = () => {
    const [state, setState] = useState<VideoEditorState>({
        // Template
        templateType: 'educational',

        // Content
        title: 'Welcome',
        subtitle: 'Get Started Today',

        // Styling
        primaryColor: '#3b82f6',
        backgroundColor: '#0f172a',

        // Template-specific
        lessonNumber: '1',
        subject: 'Introduction',
        companyName: 'Company Name',
        tagline: 'Excellence in Innovation',
        accentPosition: 'center',

        // Media
        logoUrl: null,
        backgroundImageUrl: null,
        backgroundVideoUrl: null,
        audioUrl: null,

        // Audio settings
        volume: 0.5,
        audioStartFrom: 0,
        loopAudio: true,

        // Video settings
        durationInFrames: 150,
        fps: 30,

        // Export
        exportFormat: 'mp4',
        exporting: false,
    });


    const [activeTab, setActiveTab] = useState<'content' | 'media' | 'settings' | 'export'>('content');

    const { exportVideo, exporting, progress, error, result } = useVideoExport();

    const updateState = (updates: Partial<VideoEditorState>): void => {
        setState(prev => ({ ...prev, ...updates }));
    };

    const getTemplateProps = () => {
        const baseProps = {
            title: state.title,
            subtitle: state.subtitle,
            primaryColor: state.primaryColor,
            backgroundColor: state.backgroundColor,
            logoUrl: state.logoUrl,
            backgroundImageUrl: state.backgroundImageUrl,
            backgroundVideoUrl: state.backgroundVideoUrl,
            audioUrl: state.audioUrl,
            audioVolume: state.volume,
            audioStartFrom: state.audioStartFrom,
        };

        switch (state.templateType) {
            case 'educational':
                return {
                    ...baseProps,
                    lessonNumber: state.lessonNumber,
                    subject: state.subject,
                };
            case 'corporate':
                return {
                    ...baseProps,
                    companyName: state.companyName,
                    tagline: state.tagline,
                };
            case 'minimal':
                return {
                    ...baseProps,
                    accentPosition: state.accentPosition,
                };
        }
    };

    const handleExport = async (): Promise<void> => {
        await exportVideo({
            compositionId: 'PromoVideo',
            outputFormat: state.exportFormat,
            quality: 'high',
            inputProps: getTemplateProps(),
        });
    };

    const handleDownload = async (url: string, format: string): Promise<void> => {
        await VideoExportService.downloadVideo(url, `video-${Date.now()}.${format}`);
    };

    const handleSaveProject = async (): Promise<void> => {
        const projectData = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            state: getTemplateProps(),
            settings: {
                durationInFrames: state.durationInFrames,
                fps: state.fps,
                templateType: state.templateType
            }
        };
        await VideoExportService.downloadCompositionJson(projectData, `project-${Date.now()}.json`);
    };

    const TemplateComponent = TEMPLATE_COMPONENTS[state.templateType];

    return (
        <div className="h-full flex flex-col gap-6 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced Video Editor</h1>
                <div className="flex gap-2">
                    <Button
                        icon="ArrowDownTrayIcon"
                        variant="secondary"
                        onClick={handleSaveProject}
                    >
                        Save Project
                    </Button>
                    <Button
                        icon="Film"
                        variant="primary"
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        {exporting ? `Exporting... ${Math.round(progress)}%` : 'Export Video'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Preview Player */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center aspect-video">
                        <Player
                            component={TemplateComponent as any}
                            inputProps={getTemplateProps() as any}
                            durationInFrames={state.durationInFrames}
                            compositionWidth={1920}
                            compositionHeight={1080}
                            fps={state.fps}
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                            controls
                            loop
                        />
                    </div>

                    {/* Timeline */}
                    <Timeline
                        currentFrame={0}
                        durationInFrames={state.durationInFrames}
                        fps={state.fps}
                        onSeek={(frame) => { /* Frame seeking handled by player */ }}
                    />
                </div>

                {/* Controls Sidebar */}
                <Card className="p-6 space-y-6 overflow-y-auto">
                    {/* Template Selector */}
                    <div className="space-y-3">
                        <h2 className="text-lg font-bold border-b pb-2">Template</h2>
                        <div className="grid grid-cols-3 gap-2">
                            {(['educational', 'corporate', 'minimal'] as TemplateType[]).map(template => (
                                <button
                                    key={template}
                                    onClick={() => updateState({ templateType: template })}
                                    className={`p-3 rounded-lg border text-xs font-medium transition-all ${state.templateType === template
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                        }`}
                                >
                                    {template.charAt(0).toUpperCase() + template.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 border-b">
                        {(['content', 'media', 'settings', 'export'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-2 px-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Content Tab */}
                    {activeTab === 'content' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                <Input
                                    value={state.title}
                                    onChange={(e) => updateState({ title: e.target.value })}
                                    placeholder="Enter title..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subtitle</label>
                                <Input
                                    value={state.subtitle}
                                    onChange={(e) => updateState({ subtitle: e.target.value })}
                                    placeholder="Enter subtitle..."
                                />
                            </div>

                            {/* Template-specific fields */}
                            {state.templateType === 'educational' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Subject</label>
                                        <Input
                                            value={state.subject}
                                            onChange={(e) => updateState({ subject: e.target.value })}
                                            placeholder="e.g., Mathematics"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Lesson Number</label>
                                        <Input
                                            value={state.lessonNumber}
                                            onChange={(e) => updateState({ lessonNumber: e.target.value })}
                                            placeholder="e.g., 1"
                                        />
                                    </div>
                                </>
                            )}

                            {state.templateType === 'corporate' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Company Name</label>
                                        <Input
                                            value={state.companyName}
                                            onChange={(e) => updateState({ companyName: e.target.value })}
                                            placeholder="Enter company name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Tagline</label>
                                        <Input
                                            value={state.tagline}
                                            onChange={(e) => updateState({ tagline: e.target.value })}
                                            placeholder="Enter tagline"
                                        />
                                    </div>
                                </>
                            )}

                            {state.templateType === 'minimal' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Accent Position</label>
                                    <select
                                        value={state.accentPosition}
                                        onChange={(e) => updateState({ accentPosition: e.target.value as 'top' | 'bottom' | 'center' })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                    >
                                        <option value="top">Top</option>
                                        <option value="center">Center</option>
                                        <option value="bottom">Bottom</option>
                                    </select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Primary Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={state.primaryColor}
                                        onChange={(e) => updateState({ primaryColor: e.target.value })}
                                        className="h-10 w-10 rounded cursor-pointer"
                                    />
                                    <Input
                                        value={state.primaryColor}
                                        onChange={(e) => updateState({ primaryColor: e.target.value })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Background Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={state.backgroundColor}
                                        onChange={(e) => updateState({ backgroundColor: e.target.value })}
                                        className="h-10 w-10 rounded cursor-pointer"
                                    />
                                    <Input
                                        value={state.backgroundColor}
                                        onChange={(e) => updateState({ backgroundColor: e.target.value })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Media Tab */}
                    {activeTab === 'media' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Logo</label>
                                <MediaUploader
                                    type="logo"
                                    currentUrl={state.logoUrl}
                                    onUploadComplete={(url) => updateState({ logoUrl: url })}
                                    onRemove={() => updateState({ logoUrl: null })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Background Image</label>
                                <MediaUploader
                                    type="background-image"
                                    currentUrl={state.backgroundImageUrl}
                                    onUploadComplete={(url) => updateState({ backgroundImageUrl: url })}
                                    onRemove={() => updateState({ backgroundImageUrl: null })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Background Video</label>
                                <MediaUploader
                                    type="background-video"
                                    currentUrl={state.backgroundVideoUrl}
                                    onUploadComplete={(url) => updateState({ backgroundVideoUrl: url })}
                                    onRemove={() => updateState({ backgroundVideoUrl: null })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Audio Track</label>
                                <AudioSelector
                                    currentAudioUrl={state.audioUrl}
                                    onAudioSelect={(url) => updateState({ audioUrl: url })}
                                    onAudioRemove={() => updateState({ audioUrl: null })}
                                />
                            </div>

                            {state.audioUrl && (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium">Audio Volume</label>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {Math.round(state.volume * 100)}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={state.volume * 100}
                                            onChange={(e) => updateState({ volume: parseInt(e.target.value) / 100 })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium">Start Position</label>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {(state.audioStartFrom / state.fps).toFixed(1)}s
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max={state.durationInFrames}
                                            value={state.audioStartFrom}
                                            onChange={(e) => updateState({ audioStartFrom: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Duration (seconds)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="30"
                                        max="900"
                                        step="30"
                                        value={state.durationInFrames}
                                        onChange={(e) => updateState({ durationInFrames: parseInt(e.target.value) })}
                                        className="flex-1"
                                    />
                                    <span className="text-sm font-mono w-16 text-right">
                                        {(state.durationInFrames / state.fps).toFixed(1)}s
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Frame Rate (FPS)</label>
                                <select
                                    value={state.fps}
                                    onChange={(e) => updateState({ fps: parseInt(e.target.value) as 30 | 60 })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                >
                                    <option value="30">30 FPS</option>
                                    <option value="60">60 FPS</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t text-xs text-gray-500 space-y-1">
                                <p>Resolution: 1920x1080 (Full HD)</p>
                                <p>Total Frames: {state.durationInFrames}</p>
                            </div>
                        </div>
                    )}

                    {/* Export Tab */}
                    {activeTab === 'export' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Export Format</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['mp4', 'gif', 'webm'] as const).map(format => (
                                        <button
                                            key={format}
                                            onClick={() => updateState({ exportFormat: format })}
                                            className={`p-2 rounded-lg border text-xs font-medium transition-all ${state.exportFormat === format
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                                }`}
                                        >
                                            {format.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {exporting && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Exporting...</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-full rounded-full transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {result && (
                                <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Export Complete!</p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            icon="ArrowDownTrayIcon"
                                            onClick={() => handleDownload(result.minioUrl, state.exportFormat)}
                                            className="flex-1"
                                        >
                                            Download
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigator.clipboard.writeText(result.minioUrl)}
                                        >
                                            Copy URL
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

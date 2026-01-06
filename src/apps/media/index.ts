// Engines
export { TransitionEngine } from './engines/TransitionEngine';
export { EffectsEngine } from './engines/EffectsEngine';
export { KeyframeEngine } from './engines/KeyframeEngine';
export { ColorGradingEngine, COLOR_PRESETS } from './engines/ColorGradingEngine';

// Managers
export { SceneManager } from './managers/SceneManager';
export { AssetLibrary, assetLibrary } from './managers/AssetLibrary';
export { CacheManager, videoCache, templateCache, assetCache } from './managers/CacheManager';
export { ProjectVersionControl, versionControl } from './managers/ProjectVersionControl';

// Processors
export { BatchProcessor, batchProcessor } from './processors/BatchProcessor';

// Optimizers
export { RenderOptimizer } from './optimizers/RenderOptimizer';
export { PreviewOptimizer } from './optimizers/PreviewOptimizer';

// Monitors
export { PerformanceMonitor, performanceMonitor } from './monitors/PerformanceMonitor';

// Plugins
export { PluginSystem, pluginSystem } from './plugins/PluginSystem';

// Analytics
export { AnalyticsEngine, analytics } from './analytics/AnalyticsEngine';

// Presets
export { EXPORT_PRESETS, ExportPresetManager, exportPresetManager } from './presets/ExportPresets';
export { MOTION_PRESETS, MotionPresetsManager } from './presets/MotionPresets';

// Components
export { TextOverlay, TextOverlayManager } from './components/TextOverlay';
export { Timeline } from './components/Timeline';
export { MediaUploader } from './components/MediaUploader';
export { AudioSelector } from './components/AudioSelector';
export { ParticleSystem } from './components/ParticleSystem';
export { AudioWaveform, VolumeIndicator } from './components/AudioVisualization';
export { SubtitleTrack, SubtitleManager } from './components/SubtitleSystem';
export { Shape, ShapeOverlay, ShapeLibrary } from './components/ShapeOverlay';
export { TimelineMarkers, MarkerManager } from './components/TimelineMarkers';
export { GridOverlay, SafeZoneOverlay, SAFE_ZONES } from './components/GridSystem';
export { ExportQueue } from './components/ExportQueue';

// Filters
export { VIDEO_FILTERS, FilterEngine } from './filters/VideoFilters';

// Audio
export { AudioMixer, audioMixer } from './audio/AudioMixer';

// Utils
export { CompositionUtils } from './utils/CompositionUtils';
export { KeyboardShortcuts, keyboardShortcuts, DEFAULT_SHORTCUTS } from './utils/KeyboardShortcuts';
export { ThumbnailGenerator } from './utils/ThumbnailGenerator';
export { VideoTrimmer } from './utils/VideoTrimmer';

// Builders
export { TemplateBuilder, TEMPLATE_CONFIGS } from './builders/TemplateBuilder';

// Editors
export { MetadataEditor } from './editors/MetadataEditor';

// Hooks
export { useMediaManager } from './hooks/useMediaManager';
export { useTemplateState } from './hooks/useTemplateState';
export { useVideoExport } from './hooks/useVideoExport';
export { useUndoRedo } from './hooks/useUndoRedo';
export { useColorPicker, COLOR_PALETTES } from './hooks/useColorPicker';
export { useHotkeys, HotkeyManager, DEFAULT_HOTKEYS } from './hooks/useHotkeys';

// Services
export { VideoExportService } from './services/exportService';

// Templates
export { EducationalTemplate } from './templates/EducationalTemplate';
export { CorporateTemplate } from './templates/CorporateTemplate';
export { MinimalTemplate } from './templates/MinimalTemplate';

// Types
export type * from './templates/types';

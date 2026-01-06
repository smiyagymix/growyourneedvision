import React, { useState, useRef } from 'react';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import {
    useAllIntelligenceFiles,
    useUploadIntelligenceFile,
    useDeleteIntelligenceFile,
    useReprocessIntelligenceFile,
    useOverallIntelligenceStats
} from '../../hooks/useAIIntelligence';
import { INTELLIGENCE_LEVELS } from '../../services/aiIntelligenceService';
import { useToast } from '../../hooks/useToast';

const AIIntelligenceLevels: React.FC = () => {
    const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
    const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const { data: allFiles, isLoading, error } = useAllIntelligenceFiles();
    const { data: stats } = useOverallIntelligenceStats();
    const uploadMutation = useUploadIntelligenceFile();
    const deleteMutation = useDeleteIntelligenceFile();
    const reprocessMutation = useReprocessIntelligenceFile();

    const handleFileSelect = async (level: 1 | 2 | 3 | 4 | 5, event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        try {
            await uploadMutation.mutateAsync({ level, file });
            // Clear the input
            if (fileInputRefs.current[level]) {
                fileInputRefs.current[level]!.value = '';
            }
        } catch (error) {
            alert('Failed to upload file');
        }
    };

    const handleDelete = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await deleteMutation.mutateAsync(fileId);
        } catch (error) {
            alert('Failed to delete file');
        }
    };

    const handleReprocess = async (fileId: string) => {
        try {
            await reprocessMutation.mutateAsync(fileId);
            alert('File reprocessing started');
        } catch (error) {
            alert('Failed to reprocess file');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready': return 'success';
            case 'processing': return 'warning';
            case 'error': return 'danger';
            default: return 'neutral';
        }
    };

    const getFilesByLevel = (level: number) => {
        return allFiles?.filter(f => f.level === level) || [];
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
                <p className="text-red-800 dark:text-red-200">Failed to load intelligence files. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Intelligence Levels</h2>
                <p className="text-sm text-gray-500 mt-1">Configure the 5-level intelligence framework for AI responses</p>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                        <Icon name="DocumentTextIcon" className="w-8 h-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-gray-600">Total Files</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_files || 0}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                        <Icon name="CubeIcon" className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-gray-600">Total Tokens</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {(stats?.total_tokens || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-gradient-to-r from-green-50 to-white dark:from-green-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                        <Icon name="CheckCircleIcon" className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-sm text-gray-600">Active Levels</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {Object.values(stats?.levels || {}).filter(l => l.files > 0).length} / 5
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Intelligence Levels */}
            <div className="space-y-3">
                {INTELLIGENCE_LEVELS.map((level) => {
                    const files = getFilesByLevel(level.level);
                    const isExpanded = expandedLevel === level.level;
                    const levelStats = stats?.levels[level.level];

                    return (
                        <Card key={level.level} className="overflow-hidden">
                            {/* Level Header */}
                            <div
                                className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                onClick={() => setExpandedLevel(isExpanded ? null : level.level)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                            {level.level}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{level.name}</h3>
                                            <p className="text-sm text-gray-600">{level.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">{files.length} files</p>
                                            <p className="text-xs text-gray-500">{(levelStats?.tokens || 0).toLocaleString()} tokens</p>
                                        </div>
                                        <Icon
                                            name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                                            className="w-6 h-6 text-gray-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Level Content */}
                            {isExpanded && (
                                <div className="p-5 border-t bg-gray-50 dark:bg-gray-800/30">
                                    {/* Example Files */}
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Example files:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {level.examples.map((example, idx) => (
                                                <span key={idx} className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                                                    {example}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Upload Button */}
                                    <div className="mb-4">
                                        <input
                                            ref={(el) => { fileInputRefs.current[level.level] = el; }}
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => handleFileSelect(level.level as any, e)}
                                            accept=".pdf,.txt,.md,.docx,.doc"
                                        />
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => fileInputRefs.current[level.level]?.click()}
                                            disabled={uploadMutation.isPending}
                                        >
                                            <Icon name="ArrowUpTrayIcon" className="w-4 h-4 mr-2" />
                                            {uploadMutation.isPending ? 'Uploading...' : 'Upload File'}
                                        </Button>
                                    </div>

                                    {/* Files List */}
                                    {files.length > 0 ? (
                                        <div className="space-y-2">
                                            {files.map((file) => (
                                                <Card key={file.id} className="p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <Icon name="DocumentIcon" className="w-5 h-5 text-gray-500" />
                                                            <div className="flex-1">
                                                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                                                    {file.file_name}
                                                                </p>
                                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                                    <span>{formatFileSize(file.file_size)}</span>
                                                                    {file.token_count && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>{file.token_count.toLocaleString()} tokens</span>
                                                                        </>
                                                                    )}
                                                                    <span>•</span>
                                                                    <span>{new Date(file.created).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={getStatusColor(file.status)}>
                                                                {file.status}
                                                            </Badge>
                                                            {file.status === 'error' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleReprocess(file.id)}
                                                                    disabled={reprocessMutation.isPending}
                                                                >
                                                                    <Icon name="ArrowPathIcon" className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDelete(file.id)}
                                                                disabled={deleteMutation.isPending}
                                                            >
                                                                <Icon name="TrashIcon" className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    {file.error_message && (
                                                        <p className="text-xs text-red-600 mt-2">{file.error_message}</p>
                                                    )}
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No files uploaded yet</p>
                                    )}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Info Alert */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <div className="flex gap-3">
                    <Icon name="InformationCircleIcon" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-blue-900 dark:text-blue-100">Intelligence Framework</p>
                        <p className="text-blue-700 dark:text-blue-200">
                            Files are automatically processed to extract text, calculate tokens, and prepare for AI context.
                            Processing may take 30-60 seconds depending on file size.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AIIntelligenceLevels;

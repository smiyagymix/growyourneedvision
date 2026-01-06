/**
 * AI Intelligence Service
 * Manages the 5-level intelligence framework for AI responses
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { RecordModel } from 'pocketbase';
import { auditLog } from './auditLogger';

export interface IntelligenceFile extends RecordModel {
    id: string;
    level: 1 | 2 | 3 | 4 | 5;
    file_name: string;
    file_path: string;
    file_size: number;
    status: 'uploaded' | 'processing' | 'ready' | 'error';
    token_count?: number;
    chunk_count?: number;
    embedding_status?: 'pending' | 'processing' | 'complete' | 'error';
    metadata?: {
        content_type?: string;
        pages?: number;
        language?: string;
        encoding?: string;
        checksum?: string;
        [key: string]: unknown;
    };
    error_message?: string;
    processed_at?: string;
    created: string;
    updated: string;
}

export interface IntelligenceLevelInfo {
    level: number;
    name: string;
    description: string;
    examples: string[];
    priority: number;
    maxTokens: number;
}

export interface FileUploadResult {
    success: boolean;
    file?: IntelligenceFile;
    error?: string;
}

export interface ProcessingProgress {
    fileId: string;
    status: IntelligenceFile['status'];
    progress: number;
    currentStep?: string;
}

export const INTELLIGENCE_LEVELS: IntelligenceLevelInfo[] = [
    {
        level: 1,
        name: 'Basic Knowledge Base',
        description: 'Company information, FAQs, general documentation',
        examples: ['company_info.pdf', 'faq_document.txt', 'about_us.md'],
        priority: 5,
        maxTokens: 50000
    },
    {
        level: 2,
        name: 'Product Documentation',
        description: 'User manuals, API docs, feature specifications',
        examples: ['user_manual.pdf', 'api_reference.md', 'feature_specs.docx'],
        priority: 4,
        maxTokens: 100000
    },
    {
        level: 3,
        name: 'Internal Knowledge',
        description: 'Internal processes, policies, team guidelines',
        examples: ['policies.pdf', 'workflows.md', 'guidelines.txt'],
        priority: 3,
        maxTokens: 75000
    },
    {
        level: 4,
        name: 'User Context',
        description: 'User preferences, history, personalization data',
        examples: ['user_profiles.json', 'preferences.csv', 'interaction_history.txt'],
        priority: 2,
        maxTokens: 25000
    },
    {
        level: 5,
        name: 'Real-time Data',
        description: 'Live data feeds, current metrics, dynamic content',
        examples: ['current_metrics.json', 'live_inventory.csv', 'realtime_stats.txt'],
        priority: 1,
        maxTokens: 10000
    }
];

const SUPPORTED_FILE_TYPES = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
];

const MOCK_FILES: IntelligenceFile[] = [
    {
        id: 'intel-1',
        collectionId: 'mock',
        collectionName: 'ai_intelligence_files',
        level: 1,
        file_name: 'company_overview.pdf',
        file_path: '/uploads/intelligence/level1/company_overview.pdf',
        file_size: 2450000,
        status: 'ready',
        token_count: 12500,
        chunk_count: 45,
        embedding_status: 'complete',
        metadata: {
            content_type: 'application/pdf',
            pages: 28,
            language: 'en'
        },
        processed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'intel-2',
        collectionId: 'mock',
        collectionName: 'ai_intelligence_files',
        level: 1,
        file_name: 'faq.md',
        file_path: '/uploads/intelligence/level1/faq.md',
        file_size: 45000,
        status: 'ready',
        token_count: 3200,
        chunk_count: 12,
        embedding_status: 'complete',
        metadata: {
            content_type: 'text/markdown',
            language: 'en'
        },
        processed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'intel-3',
        collectionId: 'mock',
        collectionName: 'ai_intelligence_files',
        level: 2,
        file_name: 'api_reference.pdf',
        file_path: '/uploads/intelligence/level2/api_reference.pdf',
        file_size: 5200000,
        status: 'ready',
        token_count: 28000,
        chunk_count: 95,
        embedding_status: 'complete',
        metadata: {
            content_type: 'application/pdf',
            pages: 142,
            language: 'en'
        },
        processed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'intel-4',
        collectionId: 'mock',
        collectionName: 'ai_intelligence_files',
        level: 3,
        file_name: 'internal_policies.pdf',
        file_path: '/uploads/intelligence/level3/internal_policies.pdf',
        file_size: 1800000,
        status: 'processing',
        embedding_status: 'processing',
        metadata: {
            content_type: 'application/pdf',
            pages: 45
        },
        created: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
        id: 'intel-5',
        collectionId: 'mock',
        collectionName: 'ai_intelligence_files',
        level: 5,
        file_name: 'metrics_feed.json',
        file_path: '/uploads/intelligence/level5/metrics_feed.json',
        file_size: 125000,
        status: 'ready',
        token_count: 1800,
        chunk_count: 8,
        embedding_status: 'complete',
        metadata: {
            content_type: 'application/json',
            language: 'en'
        },
        processed_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    }
];

class AIIntelligenceService {
    private collection = 'ai_intelligence_files';
    private processingCallbacks: Map<string, (progress: ProcessingProgress) => void> = new Map();

    /**
     * Get all files for a specific intelligence level
     */
    async getFilesByLevel(level: 1 | 2 | 3 | 4 | 5): Promise<IntelligenceFile[]> {
        if (isMockEnv()) {
            return MOCK_FILES.filter(f => f.level === level);
        }

        try {
            const files = await pb.collection(this.collection).getFullList({
                filter: `level = ${level}`,
                sort: '-created',
                requestKey: null
            });
            return files as unknown as IntelligenceFile[];
        } catch (error) {
            console.error(`Error fetching files for level ${level}:`, error);
            return [];
        }
    }

    /**
     * Get all files across all levels
     */
    async getAllFiles(): Promise<IntelligenceFile[]> {
        if (isMockEnv()) {
            return [...MOCK_FILES];
        }

        try {
            const files = await pb.collection(this.collection).getFullList({
                sort: 'level,-created',
                requestKey: null
            });
            return files as unknown as IntelligenceFile[];
        } catch (error) {
            console.error('Error fetching all intelligence files:', error);
            return [];
        }
    }

    /**
     * Get file by ID
     */
    async getFile(fileId: string): Promise<IntelligenceFile | null> {
        if (isMockEnv()) {
            return MOCK_FILES.find(f => f.id === fileId) || null;
        }

        try {
            const file = await pb.collection(this.collection).getOne(fileId, {
                requestKey: null
            });
            return file as unknown as IntelligenceFile;
        } catch (error) {
            console.error(`Error fetching file ${fileId}:`, error);
            return null;
        }
    }

    /**
     * Validate file type
     */
    validateFileType(file: File): { valid: boolean; error?: string } {
        if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
            return { 
                valid: false, 
                error: `Unsupported file type: ${file.type}. Supported types: PDF, TXT, MD, JSON, CSV, DOCX` 
            };
        }

        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return { 
                valid: false, 
                error: `File too large. Maximum size is 50MB.` 
            };
        }

        return { valid: true };
    }

    /**
     * Upload a file to a specific intelligence level
     */
    async uploadFile(level: 1 | 2 | 3 | 4 | 5, file: File): Promise<FileUploadResult> {
        const validation = this.validateFileType(file);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const filePath = `/uploads/intelligence/level${level}/${Date.now()}_${file.name}`;

        if (isMockEnv()) {
            const newFile: IntelligenceFile = {
                id: `intel-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'ai_intelligence_files',
                level,
                file_name: file.name,
                file_path: filePath,
                file_size: file.size,
                status: 'uploaded',
                embedding_status: 'pending',
                metadata: {
                    content_type: file.type
                },
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_FILES.push(newFile);
            
            // Simulate async processing
            setTimeout(() => this.simulateProcessing(newFile.id), 500);
            
            return { success: true, file: newFile };
        }

        try {
            const formData = new FormData();
            formData.append('level', level.toString());
            formData.append('file_name', file.name);
            formData.append('file_path', filePath);
            formData.append('file_size', file.size.toString());
            formData.append('status', 'uploaded');
            formData.append('embedding_status', 'pending');
            formData.append('file', file);

            const newFile = await pb.collection(this.collection).create(formData);
            
            await auditLog.log('ai_intelligence.upload', {
                file_id: newFile.id,
                level,
                file_name: file.name,
                file_size: file.size
            }, 'info');

            // Trigger async processing
            this.processFile(newFile.id).catch(console.error);

            return { success: true, file: newFile as unknown as IntelligenceFile };
        } catch (error) {
            console.error('Error uploading file:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Upload failed' 
            };
        }
    }

    /**
     * Simulate file processing for mock environment
     */
    private async simulateProcessing(fileId: string): Promise<void> {
        const idx = MOCK_FILES.findIndex(f => f.id === fileId);
        if (idx < 0) return;

        // Update to processing
        MOCK_FILES[idx] = {
            ...MOCK_FILES[idx],
            status: 'processing',
            updated: new Date().toISOString()
        };
        this.notifyProgress(fileId, { fileId, status: 'processing', progress: 10, currentStep: 'Extracting text' });

        await new Promise(r => setTimeout(r, 1000));
        this.notifyProgress(fileId, { fileId, status: 'processing', progress: 40, currentStep: 'Chunking content' });

        await new Promise(r => setTimeout(r, 1000));
        MOCK_FILES[idx] = {
            ...MOCK_FILES[idx],
            embedding_status: 'processing'
        };
        this.notifyProgress(fileId, { fileId, status: 'processing', progress: 70, currentStep: 'Generating embeddings' });

        await new Promise(r => setTimeout(r, 1500));

        // Complete processing
        const tokenCount = Math.floor(Math.random() * 10000) + 1000;
        const chunkCount = Math.ceil(tokenCount / 500);
        
        MOCK_FILES[idx] = {
            ...MOCK_FILES[idx],
            status: 'ready',
            token_count: tokenCount,
            chunk_count: chunkCount,
            embedding_status: 'complete',
            processed_at: new Date().toISOString(),
            updated: new Date().toISOString()
        };
        this.notifyProgress(fileId, { fileId, status: 'ready', progress: 100, currentStep: 'Complete' });
    }

    /**
     * Process a file (extract text, calculate tokens, etc.)
     */
    private async processFile(fileId: string): Promise<void> {
        try {
            // Update status to processing
            await pb.collection(this.collection).update(fileId, {
                status: 'processing'
            });

            // In production, this would:
            // 1. Download file from storage
            // 2. Extract text based on file type
            // 3. Chunk text into segments
            // 4. Generate embeddings via AI service
            // 5. Store in vector database
            // 6. Update token count and metadata

            // Simulate processing with timeout
            setTimeout(async () => {
                try {
                    const tokenCount = Math.floor(Math.random() * 10000) + 1000;
                    const chunkCount = Math.ceil(tokenCount / 500);

                    await pb.collection(this.collection).update(fileId, {
                        status: 'ready',
                        token_count: tokenCount,
                        chunk_count: chunkCount,
                        embedding_status: 'complete',
                        processed_at: new Date().toISOString(),
                        metadata: {
                            processed_at: new Date().toISOString()
                        }
                    });
                } catch (error) {
                    console.error('Error updating file status:', error);
                    await pb.collection(this.collection).update(fileId, {
                        status: 'error',
                        embedding_status: 'error',
                        error_message: 'Processing failed'
                    });
                }
            }, 3000);
        } catch (error) {
            console.error('Error processing file:', error);
            await pb.collection(this.collection).update(fileId, {
                status: 'error',
                error_message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Subscribe to processing progress updates
     */
    onProcessingProgress(fileId: string, callback: (progress: ProcessingProgress) => void): () => void {
        this.processingCallbacks.set(fileId, callback);
        return () => this.processingCallbacks.delete(fileId);
    }

    /**
     * Notify progress subscribers
     */
    private notifyProgress(fileId: string, progress: ProcessingProgress): void {
        const callback = this.processingCallbacks.get(fileId);
        if (callback) {
            callback(progress);
        }
    }

    /**
     * Delete a file
     */
    async deleteFile(fileId: string): Promise<boolean> {
        if (isMockEnv()) {
            const idx = MOCK_FILES.findIndex(f => f.id === fileId);
            if (idx >= 0) {
                MOCK_FILES.splice(idx, 1);
                return true;
            }
            return false;
        }

        try {
            await pb.collection(this.collection).delete(fileId);
            await auditLog.log('ai_intelligence.delete', { file_id: fileId }, 'warning');
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    /**
     * Reprocess a file
     */
    async reprocessFile(fileId: string): Promise<boolean> {
        if (isMockEnv()) {
            const idx = MOCK_FILES.findIndex(f => f.id === fileId);
            if (idx >= 0) {
                MOCK_FILES[idx] = {
                    ...MOCK_FILES[idx],
                    status: 'uploaded',
                    embedding_status: 'pending',
                    error_message: undefined,
                    updated: new Date().toISOString()
                };
                setTimeout(() => this.simulateProcessing(fileId), 500);
                return true;
            }
            return false;
        }

        try {
            await pb.collection(this.collection).update(fileId, {
                status: 'uploaded',
                embedding_status: 'pending',
                error_message: null
            });
            await this.processFile(fileId);
            await auditLog.log('ai_intelligence.reprocess', { file_id: fileId }, 'info');
            return true;
        } catch (error) {
            console.error('Error reprocessing file:', error);
            return false;
        }
    }

    /**
     * Get statistics for a level
     */
    async getLevelStats(level: 1 | 2 | 3 | 4 | 5): Promise<{
        total: number;
        ready: number;
        processing: number;
        error: number;
        total_tokens: number;
        total_chunks: number;
        total_size: number;
    }> {
        const files = await this.getFilesByLevel(level);
        const readyFiles = files.filter(f => f.status === 'ready');

        return {
            total: files.length,
            ready: readyFiles.length,
            processing: files.filter(f => f.status === 'processing').length,
            error: files.filter(f => f.status === 'error').length,
            total_tokens: readyFiles.reduce((sum, f) => sum + (f.token_count || 0), 0),
            total_chunks: readyFiles.reduce((sum, f) => sum + (f.chunk_count || 0), 0),
            total_size: files.reduce((sum, f) => sum + f.file_size, 0)
        };
    }

    /**
     * Get overall statistics across all levels
     */
    async getOverallStats(): Promise<{
        levels: Record<number, { files: number; tokens: number; chunks: number; size: number }>;
        total_files: number;
        total_tokens: number;
        total_chunks: number;
        total_size: number;
        ready_percentage: number;
    }> {
        const files = await this.getAllFiles();

        const levelStats: Record<number, { files: number; tokens: number; chunks: number; size: number }> = {};

        for (let i = 1; i <= 5; i++) {
            const levelFiles = files.filter(f => f.level === i);
            const readyFiles = levelFiles.filter(f => f.status === 'ready');
            levelStats[i] = {
                files: levelFiles.length,
                tokens: readyFiles.reduce((sum, f) => sum + (f.token_count || 0), 0),
                chunks: readyFiles.reduce((sum, f) => sum + (f.chunk_count || 0), 0),
                size: levelFiles.reduce((sum, f) => sum + f.file_size, 0)
            };
        }

        const readyFiles = files.filter(f => f.status === 'ready');

        return {
            levels: levelStats,
            total_files: files.length,
            total_tokens: readyFiles.reduce((sum, f) => sum + (f.token_count || 0), 0),
            total_chunks: readyFiles.reduce((sum, f) => sum + (f.chunk_count || 0), 0),
            total_size: files.reduce((sum, f) => sum + f.file_size, 0),
            ready_percentage: files.length > 0 ? Math.round((readyFiles.length / files.length) * 100) : 0
        };
    }

    /**
     * Get files with errors
     */
    async getErrorFiles(): Promise<IntelligenceFile[]> {
        if (isMockEnv()) {
            return MOCK_FILES.filter(f => f.status === 'error');
        }

        try {
            const files = await pb.collection(this.collection).getFullList({
                filter: 'status = "error"',
                sort: '-created',
                requestKey: null
            });
            return files as unknown as IntelligenceFile[];
        } catch (error) {
            console.error('Error fetching error files:', error);
            return [];
        }
    }

    /**
     * Search files by name
     */
    async searchFiles(query: string): Promise<IntelligenceFile[]> {
        if (isMockEnv()) {
            const lowerQuery = query.toLowerCase();
            return MOCK_FILES.filter(f => f.file_name.toLowerCase().includes(lowerQuery));
        }

        try {
            const files = await pb.collection(this.collection).getFullList({
                filter: `file_name ~ "${query}"`,
                sort: '-created',
                requestKey: null
            });
            return files as unknown as IntelligenceFile[];
        } catch (error) {
            console.error('Error searching files:', error);
            return [];
        }
    }

    /**
     * Get level information
     */
    getLevelInfo(level: number): IntelligenceLevelInfo | undefined {
        return INTELLIGENCE_LEVELS.find(l => l.level === level);
    }

    /**
     * Get all level information
     */
    getAllLevelInfo(): IntelligenceLevelInfo[] {
        return INTELLIGENCE_LEVELS;
    }

    /**
     * Check if level has capacity for more tokens
     */
    async checkLevelCapacity(level: 1 | 2 | 3 | 4 | 5): Promise<{
        hasCapacity: boolean;
        currentTokens: number;
        maxTokens: number;
        remainingCapacity: number;
    }> {
        const stats = await this.getLevelStats(level);
        const levelInfo = this.getLevelInfo(level);
        const maxTokens = levelInfo?.maxTokens || 50000;

        return {
            hasCapacity: stats.total_tokens < maxTokens,
            currentTokens: stats.total_tokens,
            maxTokens,
            remainingCapacity: Math.max(0, maxTokens - stats.total_tokens)
        };
    }

    /**
     * Format file size for display
     */
    formatSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export const aiIntelligenceService = new AIIntelligenceService();

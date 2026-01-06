import pb from '@/lib/pocketbase';
import { RecordModel } from 'pocketbase';

export interface TrainingJob extends RecordModel {
    model_name: string;
    base_model: string;
    dataset_url: string;
    status: 'Queued' | 'Training' | 'Completed' | 'Failed';
    progress: number;
    epochs: number;
    loss: number;
    started_at: string;
    completed_at?: string;
}

export interface Dataset extends RecordModel {
    name: string;
    description: string;
    file: string; // PocketBase stores filename here
    size_bytes: number;
    row_count: number;
    type: 'jsonl' | 'csv';
}

export interface PromptTemplate extends RecordModel {
    name: string;
    description: string;
    content: string;
    variables: string[]; // Stored as JSON in PB
    category: 'System' | 'User' | 'Assistant' | 'Tool';
    is_active: boolean;
}

export interface KnowledgeDocument extends RecordModel {
    name: string;
    file: string; // PocketBase stores filename here
    type: 'PDF' | 'TXT' | 'URL' | 'MD';
    status: 'Indexed' | 'Indexing' | 'Pending' | 'Failed';
    size_bytes: number;
    vector_id?: string;
}

export interface Workflow extends RecordModel {
    name: string;
    description: string;
    trigger: 'Manual' | 'Event' | 'Schedule';
    steps: {
        id: string;
        type: 'LLM' | 'Tool' | 'Condition' | 'Delay';
        config: any;
    }[]; // Stored as JSON in PB
    is_active: boolean;
}

export const aiTrainingService = {
    // Training Jobs
    async getJobs() {
        return await pb.collection('training_jobs').getFullList<TrainingJob>({
            sort: '-created',
        });
    },

    async createJob(data: Partial<TrainingJob>) {
        return await pb.collection('training_jobs').create<TrainingJob>({
            ...data,
            status: 'Queued',
            progress: 0,
            started_at: new Date().toISOString()
        });
    },

    // Datasets
    async getDatasets() {
        return await pb.collection('datasets').getFullList<Dataset>({
            sort: '-created',
        });
    },

    async uploadDataset(file: File, metadata: Partial<Dataset>) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', metadata.name || file.name);
        formData.append('description', metadata.description || '');
        formData.append('type', file.name.endsWith('csv') ? 'csv' : 'jsonl');
        formData.append('size_bytes', file.size.toString());
        formData.append('row_count', '0'); // To be calculated by backend worker

        return await pb.collection('datasets').create<Dataset>(formData);
    },

    // Prompts
    async getPrompts() {
        return await pb.collection('prompt_templates').getFullList<PromptTemplate>({
            sort: '-created',
        });
    },

    async createPrompt(data: Partial<PromptTemplate>) {
        return await pb.collection('prompt_templates').create<PromptTemplate>(data);
    },

    async updatePrompt(id: string, data: Partial<PromptTemplate>) {
        return await pb.collection('prompt_templates').update<PromptTemplate>(id, data);
    },

    async deletePrompt(id: string) {
        return await pb.collection('prompt_templates').delete(id);
    },

    // Knowledge Base
    async getDocuments() {
        return await pb.collection('knowledge_docs').getFullList<KnowledgeDocument>({
            sort: '-created',
        });
    },

    async uploadDocument(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        formData.append('type', (file.name.split('.').pop()?.toUpperCase() || 'TXT') as any);
        formData.append('status', 'Pending');
        formData.append('size_bytes', file.size.toString());

        return await pb.collection('knowledge_docs').create<KnowledgeDocument>(formData);
    },

    async deleteDocument(id: string) {
        return await pb.collection('knowledge_docs').delete(id);
    },

    // Workflows
    async getWorkflows() {
        return await pb.collection('workflows').getFullList<Workflow>({
            sort: '-created',
        });
    },

    async createWorkflow(data: Partial<Workflow>) {
        return await pb.collection('workflows').create<Workflow>(data);
    },

    async updateWorkflow(id: string, data: Partial<Workflow>) {
        return await pb.collection('workflows').update<Workflow>(id, data);
    },

    async deleteWorkflow(id: string) {
        return await pb.collection('workflows').delete(id);
    }
};

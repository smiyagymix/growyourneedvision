import { RecordModel } from 'pocketbase';

export interface Project extends RecordModel {
    name: string;
    description: string;
    status: 'Planning' | 'In Progress' | 'Review' | 'Completed';
    thumbnail?: string;
    due_date?: string;
    owner: string;
    tags?: string[];
    progress?: number; // 0-100
}

export interface Task extends RecordModel {
    project: string;
    title: string;
    status: 'To Do' | 'In Progress' | 'Done';
    due_date?: string;
    assignee?: string;
}

export interface Asset extends RecordModel {
    name: string;
    file: string;
    type: 'image' | 'video' | 'document' | 'audio';
    project?: string;
    tags?: string[];
    size?: number;
}

export interface Template extends RecordModel {
    name: string;
    thumbnail: string;
    category: string;
    is_community: boolean;
    data: any; // JSON structure of the template
}

export interface LearningProgress extends RecordModel {
    user: string;
    course_name: string;
    progress: number;
    status: 'Not Started' | 'In Progress' | 'Completed';
    last_accessed: string;
}

import { RecordModel } from 'pocketbase';

export type UniverseType = 'SchoolClass' | 'SoloTrack';
export type TimelineDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Nightmare';
export type MissionType = 'Quiz' | 'Coding' | 'Project' | 'Video' | 'ParallelClass';

export interface Universe extends RecordModel {
    name: string;
    description: string;
    type: UniverseType;
    subject: string;
    icon: string;
    min_level: number;
    is_active: boolean;
    cover_image?: string;
}

export interface Timeline extends RecordModel {
    universe: string; // Relation to Universe
    name: string;
    difficulty: TimelineDifficulty;
    color: string;
    order: number;
    description?: string;
}

export interface Mission extends RecordModel {
    timeline: string; // Relation to Timeline
    title: string;
    description: string;
    xp_reward: number;
    type: MissionType;
    content: any; // JSON content for quiz/coding
    required_mission?: string; // Relation to Mission (prerequisite)
    is_boss?: boolean;
}

export interface Glitch extends RecordModel {
    universe: string; // Relation to Universe
    title: string;
    description: string;
    broken_content: string;
    correct_content: string;
    difficulty: number; // 1-5
    xp_reward: number;
    is_active: boolean;
}

export interface UserProgress extends RecordModel {
    user: string; // Relation to User
    current_xp: number;
    level: number;
    streak_days: number;
    last_active: string;
    // Expanded relations are usually handled via API expansion, 
    // but for type safety we might want separate types for expanded responses
}

export interface UserMissionCompletion extends RecordModel {
    user: string;
    mission: string;
    completed_at: string;
    score?: number;
    submission_url?: string;
}

export interface UserGlitchFix extends RecordModel {
    user: string;
    glitch: string;
    fixed_at: string;
    attempts: number;
}

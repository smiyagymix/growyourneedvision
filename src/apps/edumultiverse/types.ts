export interface Universe {
    id: string;
    name: string;
    subject: string;
    type: 'SchoolClass' | 'SoloTrack';
    description: string;
    icon: string;
    owner?: string;
}

export interface Timeline {
    id: string;
    name: string;
    universe: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    color: string;
}

export type MissionType = 'ParallelClass' | 'GlitchHunter' | 'TimeLoop' | 'ConceptFusion';

export interface Mission {
    id: string;
    title: string;
    description: string;
    type: MissionType;
    universe: string;
    timeline?: string;
    xpReward: number;
    content: any;
}

export interface Glitch {
    id: string;
    title: string;
    universe: string;
    brokenContent: string;
    correctContent: string;
    difficulty: number;
}

export interface MultiverseProfile {
    id: string;
    user: string;
    totalXP: number;
    level: number;
    streakDays: number;
    badges: string[];
}

export interface MissionRun {
    id: string;
    mission: string;
    student: string;
    score: number;
    status: 'completed' | 'failed' | 'in-progress';
    completedAt: string;
}

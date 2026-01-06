export interface Universe {
    id: string;
    name: string;
    subject: string;
    type: 'SchoolClass' | 'SoloTrack';
    description: string;
    icon: string;
    owner?: string;
    min_level: number;
}

export interface Timeline {
    id: string;
    name: string;
    universe: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    color: string;
}

export type MissionType = 'ParallelClass' | 'GlitchHunter' | 'TimeLoop' | 'ConceptFusion' | 'QuantumQuiz';

export interface Mission {
    id: string;
    title: string;
    description: string;
    type: MissionType;
    universe: string;
    timeline?: string;
    xp_reward: number;
    content: any;
    status?: 'locked' | 'available' | 'completed';
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    subject: string;
    xp_reward: number;
}

export interface Glitch {
    id: string;
    title: string;
    universe: string;
    broken_content: string;
    correct_content: string;
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

export interface Fragment {
    id: string;
    name: string;
    type: 'Math' | 'Science' | 'History' | 'Art' | 'Tech';
    rarity: 'Common' | 'Rare' | 'Legendary';
    description?: string;
    icon?: string;
}

export interface Recipe {
    id: string;
    name: string;
    ingredients: string[]; // Array of types e.g. ["Math", "Science"]
    result_description: string;
    xp_reward: number;
}

export interface UserFragment {
    id: string;
    user: string;
    fragment: string;
    quantity: number;
    expand?: {
        fragment: Fragment;
    };
}

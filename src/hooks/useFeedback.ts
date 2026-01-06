import { useMutation } from '@tanstack/react-query';
import pb from '../lib/pocketbase';

export interface FeedbackData {
    type: 'bug' | 'feature' | 'other';
    description: string;
    rating: number;
    url: string;
    user_id: string;
    status: 'new';
}

export function useSubmitFeedback() {
    return useMutation({
        mutationFn: async (data: FeedbackData) => {
            // Check if collection exists first to avoid crash if not setup
            try {
                return await pb.collection('feedback').create(data);
            } catch (error: any) {
                // Fallback or specific error handling
                if (error.status === 404) {
                    console.warn('Feedback collection not found. Please create it.');
                    throw new Error('Feedback system not ready');
                }
                throw error;
            }
        }
    });
}

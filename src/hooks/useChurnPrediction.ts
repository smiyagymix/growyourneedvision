import { useQuery } from '@tanstack/react-query';
import { predictChurnForAllTenants, type ChurnAnalysis } from '../services/churnPredictionService';

/**
 * Hook for accessing AI-powered churn predictions
 */
export const useChurnPrediction = () => {
    return useQuery({
        queryKey: ['churnPrediction'],
        queryFn: predictChurnForAllTenants,
        staleTime: 30 * 60 * 1000, // 30 minutes - expensive operation
        refetchInterval: 60 * 60 * 1000, // Refetch every hour
        retry: 1,
    });
};

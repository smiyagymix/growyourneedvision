/**
 * A/B Testing Hook
 * 
 * React Query hook for A/B testing operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { abTestingService, ABTest, ABVariant, ABTestResults } from '../services/abTestingService';
import { useToast } from './useToast';
import { useAuth } from '../context/AuthContext';

export const useABTesting = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const { user } = useAuth();

    // Get all tests
    const { data: tests = [], isLoading: testsLoading } = useQuery({
        queryKey: ['ab-tests'],
        queryFn: () => abTestingService.getTests()
    });

    // Get running tests
    const { data: runningTests = [] } = useQuery({
        queryKey: ['ab-tests', 'running'],
        queryFn: () => abTestingService.getTests('running')
    });

    // Create test mutation
    const createTest = useMutation({
        mutationFn: (test: Omit<ABTest, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>) =>
            abTestingService.createTest(test),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
            addToast('A/B test created successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to create test: ${error.message}`, 'error');
        }
    });

    // Update test mutation
    const updateTest = useMutation({
        mutationFn: (params: { id: string; updates: Partial<ABTest> }) =>
            abTestingService.updateTest(params.id, params.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
            addToast('Test updated successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to update test: ${error.message}`, 'error');
        }
    });

    // Start test mutation
    const startTest = useMutation({
        mutationFn: (testId: string) => abTestingService.startTest(testId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
            addToast('Test started successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to start test: ${error.message}`, 'error');
        }
    });

    // Pause test mutation
    const pauseTest = useMutation({
        mutationFn: (testId: string) => abTestingService.pauseTest(testId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
            addToast('Test paused successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to pause test: ${error.message}`, 'error');
        }
    });

    // Complete test mutation
    const completeTest = useMutation({
        mutationFn: (params: { testId: string; winnerVariantId?: string }) =>
            abTestingService.completeTest(params.testId, params.winnerVariantId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
            addToast('Test completed successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to complete test: ${error.message}`, 'error');
        }
    });

    // Get variant for user
    const getVariant = async (testId: string): Promise<ABVariant | null> => {
        return abTestingService.getVariantForUser(
            testId,
            user?.id,
            user?.tenantId
        );
    };

    // Track metric
    const trackMetric = async (
        testId: string,
        variantId: string,
        metricName: string,
        value: number
    ): Promise<void> => {
        return abTestingService.trackMetric(
            testId,
            variantId,
            metricName,
            value,
            user?.id,
            user?.tenantId
        );
    };

    // Get test results
    const useTestResults = (testId: string) => useQuery<ABTestResults>({
        queryKey: ['ab-test-results', testId],
        queryFn: () => abTestingService.getTestResults(testId),
        enabled: !!testId,
        refetchInterval: 30000 // Refresh every 30 seconds for running tests
    });

    // Get all test results
    const { data: allTestResults = [] } = useQuery<ABTestResults[]>({
        queryKey: ['ab-test-results-all'],
        queryFn: async () => {
            const results = await Promise.all(
                tests.map(test => abTestingService.getTestResults(test.id))
            );
            return results;
        },
        enabled: tests.length > 0
    });

    // Get test assignments
    const useTestAssignments = (testId: string) => useQuery({
        queryKey: ['ab-test-assignments', testId],
        queryFn: () => abTestingService.getTestAssignments(testId),
        enabled: !!testId
    });

    // Computed properties for loading states
    const isCreating = createTest.isPending;
    const isStarting = startTest.isPending;
    const isPausing = pauseTest.isPending;
    const isCompleting = completeTest.isPending;
    
    // Helper to get test results by ID
    const testResults = (testId: string) => 
        allTestResults?.find(result => result.testId === testId);

    return {
        tests,
        testsLoading,
        runningTests,
        allTestResults,
        testResults,
        createTest,
        updateTest,
        startTest,
        pauseTest,
        completeTest,
        isCreating,
        isStarting,
        isPausing,
        isCompleting,
        getVariant,
        trackMetric,
        useTestResults,
        useTestAssignments
    };
};

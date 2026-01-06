/**
 * Custom Billing Rules Hook
 * 
 * React Query hook for billing rules management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customBillingRulesService, BillingRule, UsageMetric } from '../services/customBillingRulesService';
import { useToast } from './useToast';

export const useBillingRules = (filters?: { type?: string; isActive?: boolean }) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    // Get all rules
    const {
        data: rules,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['billingRules', filters],
        queryFn: () => customBillingRulesService.getRules(filters)
    });

    // Create rule mutation
    const createRule = useMutation({
        mutationFn: (rule: Omit<BillingRule, 'id' | 'created' | 'updated'>) =>
            customBillingRulesService.createRule(rule),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['billingRules'] });
            addToast('Billing rule created successfully', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to create rule', 'error');
        }
    });

    // Update rule mutation
    const updateRule = useMutation({
        mutationFn: ({ ruleId, updates }: { ruleId: string; updates: Partial<BillingRule> }) =>
            customBillingRulesService.updateRule(ruleId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['billingRules'] });
            addToast('Rule updated successfully', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to update rule', 'error');
        }
    });

    // Delete rule mutation
    const deleteRule = useMutation({
        mutationFn: (ruleId: string) =>
            customBillingRulesService.deleteRule(ruleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['billingRules'] });
            addToast('Rule deleted', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to delete rule', 'error');
        }
    });

    // Calculate billing mutation
    const calculateBilling = useMutation({
        mutationFn: ({ tenantId, usage }: { tenantId: string; usage: UsageMetric[] }) =>
            customBillingRulesService.calculateBilling(tenantId, usage),
        onError: (error: any) => {
            addToast(error.message || 'Billing calculation failed', 'error');
        }
    });

    // Test rule mutation
    const testRule = useMutation({
        mutationFn: ({ rule, sampleData }: { 
            rule: Omit<BillingRule, 'id' | 'created' | 'updated'>; 
            sampleData: any 
        }) =>
            customBillingRulesService.testRule(rule, sampleData),
        onError: (error: any) => {
            addToast(error.message || 'Rule test failed', 'error');
        }
    });

    return {
        rules,
        createRule,
        updateRule,
        deleteRule,
        calculateBilling,
        testRule,
        isLoading,
        isCreating: createRule.isPending,
        isUpdating: updateRule.isPending,
        isDeleting: deleteRule.isPending,
        isCalculating: calculateBilling.isPending,
        isTesting: testRule.isPending,
        refetch
    };
};

// Hook for getting execution history
export const useRuleExecutionHistory = (ruleId: string) => {
    return useQuery({
        queryKey: ['ruleExecutionHistory', ruleId],
        queryFn: () => customBillingRulesService.getExecutionHistory(ruleId),
        enabled: !!ruleId
    });
};

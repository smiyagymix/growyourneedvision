/**
 * Incident Response Hook
 * 
 * React Query hook for incident management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentResponseService, Incident, IncidentRule, IncidentStats } from '../services/incidentResponseService';
import { useToast } from './useToast';

export const useIncidentResponse = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    // Get incidents
    const { data: incidents = [], isLoading: incidentsLoading } = useQuery({
        queryKey: ['incidents'],
        queryFn: () => incidentResponseService.getIncidents(),
        refetchInterval: 30000 // Refresh every 30 seconds
    });

    // Get open incidents
    const { data: openIncidents = [] } = useQuery({
        queryKey: ['incidents', 'open'],
        queryFn: () => incidentResponseService.getIncidents({ status: 'open' })
    });

    // Get critical incidents
    const { data: criticalIncidents = [] } = useQuery({
        queryKey: ['incidents', 'critical'],
        queryFn: () => incidentResponseService.getIncidents({ severity: 'critical' })
    });

    // Get incident stats
    const { data: stats, isLoading: statsLoading } = useQuery<IncidentStats>({
        queryKey: ['incident-stats'],
        queryFn: () => incidentResponseService.getIncidentStats(),
        refetchInterval: 60000 // Refresh every minute
    });

    // Get incident stats for specific period
    const useIncidentStats = (period?: { start: Date; end: Date }) => useQuery<IncidentStats>({
        queryKey: ['incident-stats', period],
        queryFn: () => incidentResponseService.getIncidentStats(period),
        enabled: !!period
    });

    // Create incident mutation
    const createIncident = useMutation({
        mutationFn: (incident: Omit<Incident, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName' | 'timeline'>) =>
            incidentResponseService.createIncident(incident),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
            addToast('Incident created successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to create incident: ${error.message}`, 'error');
        }
    });

    // Acknowledge incident mutation
    const acknowledgeIncident = useMutation({
        mutationFn: (params: { id: string; userId: string }) =>
            incidentResponseService.acknowledgeIncident(params.id, params.userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            addToast('Incident acknowledged', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to acknowledge incident: ${error.message}`, 'error');
        }
    });

    // Add update mutation
    const addUpdate = useMutation({
        mutationFn: (params: { id: string; message: string; userId: string; data?: Record<string, any> }) =>
            incidentResponseService.addUpdate(params.id, params.message, params.userId, params.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            addToast('Update added', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to add update: ${error.message}`, 'error');
        }
    });

    // Escalate incident mutation
    const escalateIncident = useMutation({
        mutationFn: (params: { id: string; assignTo?: string }) =>
            incidentResponseService.escalateIncident(params.id, params.assignTo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            addToast('Incident escalated', 'warning');
        },
        onError: (error: Error) => {
            addToast(`Failed to escalate incident: ${error.message}`, 'error');
        }
    });

    // Resolve incident mutation
    const resolveIncident = useMutation({
        mutationFn: (params: {
            id: string;
            resolution: string;
            rootCause: string;
            preventionSteps: string[];
        }) =>
            incidentResponseService.resolveIncident(
                params.id,
                params.resolution,
                params.rootCause,
                params.preventionSteps
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
            addToast('Incident resolved', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to resolve incident: ${error.message}`, 'error');
        }
    });

    // Close incident mutation
    const closeIncident = useMutation({
        mutationFn: (id: string) => incidentResponseService.closeIncident(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            queryClient.invalidateQueries({ queryKey: ['incident-stats'] });
            addToast('Incident closed', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to close incident: ${error.message}`, 'error');
        }
    });

    // Detect incidents
    const detectIncidents = async () => {
        const detected = await incidentResponseService.detectIncidents();
        if (detected.length > 0) {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            addToast(`${detected.length} new incident(s) detected`, 'warning');
        }
        return detected;
    };

    // Get incident rules
    const { data: rules = [] } = useQuery({
        queryKey: ['incident-rules'],
        queryFn: () => incidentResponseService.getRules()
    });

    // Create rule mutation
    const createRule = useMutation({
        mutationFn: (rule: Omit<IncidentRule, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>) =>
            incidentResponseService.createRule(rule),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incident-rules'] });
            addToast('Incident rule created', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to create rule: ${error.message}`, 'error');
        }
    });

    return {
        incidents,
        incidentsLoading,
        openIncidents,
        criticalIncidents,
        stats,
        statsLoading,
        useIncidentStats,
        createIncident,
        acknowledgeIncident,
        addUpdate,
        escalateIncident,
        resolveIncident,
        closeIncident,
        detectIncidents,
        rules,
        createRule
    };
};

/**
 * useDashboardBuilder Hook
 * 
 * React Query hook for custom dashboard layouts with drag-drop widgets
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    dashboardBuilderService, 
    DashboardLayout, 
    WidgetConfig, 
    WidgetType 
} from '../services/dashboardBuilderService';
import { useToast } from './useToast';
import { useAuth } from '../context/AuthContext';

export const useDashboardBuilder = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const { user } = useAuth();

    // Get all layouts for current user
    const {
        data: layouts = [],
        isLoading: layoutsLoading,
        refetch: refetchLayouts
    } = useQuery({
        queryKey: ['dashboardLayouts', user?.id],
        queryFn: () => dashboardBuilderService.getDashboardLayouts(user?.id || ''),
        enabled: !!user?.id
    });

    // Get default layout
    const {
        data: defaultLayout,
        isLoading: defaultLoading
    } = useQuery({
        queryKey: ['defaultLayout', user?.id],
        queryFn: () => dashboardBuilderService.getDefaultLayout(user?.id || ''),
        enabled: !!user?.id
    });

    // Get widget definitions
    const widgetDefinitions = dashboardBuilderService.getWidgetDefinitions();

    // Create new layout
    const createLayout = useMutation({
        mutationFn: (layout: Omit<DashboardLayout, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>) =>
            dashboardBuilderService.createLayout(layout),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboardLayouts'] });
            queryClient.invalidateQueries({ queryKey: ['defaultLayout'] });
            addToast('Dashboard layout created successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to create layout: ${error.message}`, 'error');
        }
    });

    // Update layout
    const updateLayout = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<DashboardLayout> }) =>
            dashboardBuilderService.updateLayout(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboardLayouts'] });
            queryClient.invalidateQueries({ queryKey: ['defaultLayout'] });
            addToast('Dashboard layout updated successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to update layout: ${error.message}`, 'error');
        }
    });

    // Delete layout
    const deleteLayout = useMutation({
        mutationFn: (id: string) => dashboardBuilderService.deleteLayout(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboardLayouts'] });
            queryClient.invalidateQueries({ queryKey: ['defaultLayout'] });
            addToast('Dashboard layout deleted successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to delete layout: ${error.message}`, 'error');
        }
    });

    // Duplicate layout
    const duplicateLayout = useMutation({
        mutationFn: ({ id, newName }: { id: string; newName: string }) =>
            dashboardBuilderService.duplicateLayout(id, newName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboardLayouts'] });
            addToast('Dashboard layout duplicated successfully', 'success');
        },
        onError: (error: Error) => {
            addToast(`Failed to duplicate layout: ${error.message}`, 'error');
        }
    });

    // Get widget data
    const getWidgetData = async (widget: WidgetConfig) => {
        return dashboardBuilderService.getWidgetData(widget);
    };

    return {
        // Data
        layouts,
        defaultLayout,
        widgetDefinitions,

        // Loading states
        layoutsLoading,
        defaultLoading,
        loading: layoutsLoading || defaultLoading,

        // Mutations
        createLayout: createLayout.mutate,
        updateLayout: updateLayout.mutate,
        deleteLayout: deleteLayout.mutate,
        duplicateLayout: duplicateLayout.mutate,

        // Mutation states
        isCreating: createLayout.isPending,
        isUpdating: updateLayout.isPending,
        isDeleting: deleteLayout.isPending,
        isDuplicating: duplicateLayout.isPending,

        // Utilities
        getWidgetData,
        getWidgetDefinition: dashboardBuilderService.getWidgetDefinition.bind(dashboardBuilderService),
        validateWidgetConfig: dashboardBuilderService.validateWidgetConfig.bind(dashboardBuilderService),

        // Refresh
        refetchLayouts,
        refresh: refetchLayouts
    };
};

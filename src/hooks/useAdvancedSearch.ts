/**
 * Advanced Search Hook
 * 
 * React Query hook for advanced search functionality
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { advancedSearchService, SearchQuery, SearchResponse, SavedSearch } from '../services/advancedSearchService';
import { useToast } from './useToast';

export const useAdvancedSearch = () => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    // Search query
    const search = async (query: SearchQuery) => {
        return advancedSearchService.search(query);
    };

    // Get search history
    const {
        data: searchHistory,
        isLoading: isLoadingHistory,
        refetch: refetchHistory
    } = useQuery({
        queryKey: ['searchHistory'],
        queryFn: () => advancedSearchService.getSearchHistory('current-user', 10)
    });

    // Get saved searches
    const {
        data: savedSearches,
        isLoading: isLoadingSaved,
        refetch: refetchSaved
    } = useQuery({
        queryKey: ['savedSearches'],
        queryFn: () => advancedSearchService.getSavedSearches('current-user')
    });

    // Get popular searches
    const {
        data: popularSearches,
        isLoading: isLoadingPopular
    } = useQuery({
        queryKey: ['popularSearches'],
        queryFn: () => advancedSearchService.getPopularSearches(10)
    });

    // Save search mutation
    const saveSearch = useMutation({
        mutationFn: (data: Omit<SavedSearch, 'id' | 'created' | 'updated'>) =>
            advancedSearchService.saveSearch(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
            addToast('Search saved successfully', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to save search', 'error');
        }
    });

    // Delete saved search mutation
    const deleteSavedSearch = useMutation({
        mutationFn: (searchId: string) =>
            advancedSearchService.deleteSavedSearch(searchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
            addToast('Search deleted', 'success');
        },
        onError: (error: any) => {
            addToast(error.message || 'Failed to delete search', 'error');
        }
    });

    return {
        search,
        searchHistory,
        savedSearches,
        popularSearches,
        saveSearch,
        deleteSavedSearch,
        isLoadingHistory,
        isLoadingSaved,
        isLoadingPopular,
        isSaving: saveSearch.isPending,
        isDeleting: deleteSavedSearch.isPending,
        refetchHistory,
        refetchSaved
    };
};

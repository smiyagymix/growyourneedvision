import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
            gcTime: 1000 * 60 * 10, // Cache persisted for 10 minutes
            retry: 1, // Retry failed requests once
            refetchOnWindowFocus: false, // Do not refetch on window focus for dashboard apps
        },
    },
});

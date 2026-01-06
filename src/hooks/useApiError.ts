import { useCallback } from 'react';
import { useToast } from './useToast';

export const useApiError = () => {
    const { addToast } = useToast();

    const handleError = useCallback((error: any, fallbackMessage = 'An unexpected error occurred') => {
        console.error(error);

        let message = fallbackMessage;

        // Handle PocketBase errors
        if (error?.data?.message) {
            message = error.data.message;
        } else if (error?.message) {
            message = error.message;
        }

        addToast(message, 'error');
    }, [addToast]);

    return { handleError };
};

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../context/ModalContext'; // Assuming this exists or similar
import { useAuth } from '../context/AuthContext';

export const useKeyboardShortcuts = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    // const { openSearch } = useModal(); // If we had a global search modal context

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore if typing in an input
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)) {
                return;
            }

            // Global Shortcuts
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                // Trigger generic search or focus search bar
                document.querySelector<HTMLInputElement>('input[placeholder="Search..."]')?.focus();
            }

            if ((event.metaKey || event.ctrlKey) && event.key === '/') {
                event.preventDefault();
                // Toggle Help or something
                navigate('/owner/support');
            }

            // Navigation Shortcuts
            if (event.shiftKey && event.key === 'H') {
                navigate('/'); // Home
            }

            if (event.shiftKey && event.key === 'D') {
                if (user?.role === 'Owner') navigate('/owner/analytics');
                else navigate('/dashboard');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate, user]);
};

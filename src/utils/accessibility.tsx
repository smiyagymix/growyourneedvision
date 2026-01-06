/**
 * Accessibility Enhancement Utilities
 * WCAG 2.1 AA compliance helpers for Owner components
 */

import { useEffect, useRef } from 'react';

/**
 * Hook for managing focus trap within modals and dialogs
 */
export function useFocusTrap(isOpen: boolean) {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!isOpen || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);
        firstElement?.focus();

        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    }, [isOpen]);

    return containerRef;
}

/**
 * Hook for announcing dynamic content changes to screen readers
 */
export function useAnnounce() {
    const announcerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const announcer = document.createElement('div');
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        document.body.appendChild(announcer);
        announcerRef.current = announcer;

        return () => {
            document.body.removeChild(announcer);
        };
    }, []);

    const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (announcerRef.current) {
            announcerRef.current.setAttribute('aria-live', priority);
            announcerRef.current.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                if (announcerRef.current) {
                    announcerRef.current.textContent = '';
                }
            }, 1000);
        }
    };

    return announce;
}

/**
 * Generate unique IDs for form labels and aria-describedby
 */
let idCounter = 0;
export function useUniqueId(prefix = 'a11y') {
    const idRef = useRef<string | undefined>(undefined);

    if (!idRef.current) {
        idRef.current = `${prefix}-${++idCounter}`;
    }

    return idRef.current;
}

/**
 * Hook for keyboard navigation in lists
 */
export function useKeyboardNav(itemCount: number, onSelect: (index: number) => void) {
    const currentIndexRef = useRef(0);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                currentIndexRef.current = Math.min(currentIndexRef.current + 1, itemCount - 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                currentIndexRef.current = Math.max(currentIndexRef.current - 1, 0);
                break;
            case 'Home':
                e.preventDefault();
                currentIndexRef.current = 0;
                break;
            case 'End':
                e.preventDefault();
                currentIndexRef.current = itemCount - 1;
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                onSelect(currentIndexRef.current);
                break;
            default:
                return;
        }
    };

    return { handleKeyDown, currentIndex: currentIndexRef.current };
}

/**
 * Accessibility attributes for data tables
 */
export function getTableA11yProps(caption: string) {
    return {
        role: 'table',
        'aria-label': caption,
        'aria-describedby': `${caption.toLowerCase().replace(/\s+/g, '-')}-description`,
    };
}

/**
 * Skip to main content link (for keyboard users)
 */
export function SkipLink() {
    return (
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
        >
            Skip to main content
        </a>
    );
}

/**
 * Screen reader only text
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
    return <span className="sr-only">{children}</span>;
}

/**
 * ARIA live region for dynamic updates
 */
export function LiveRegion({
    children,
    priority = 'polite',
}: {
    children: React.ReactNode;
    priority?: 'polite' | 'assertive';
}) {
    return (
        <div role="status" aria-live={priority} aria-atomic="true" className="sr-only">
            {children}
        </div>
    );
}

/**
 * Check if element has sufficient color contrast
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 */
export function getContrastRatio(foreground: string, background: string): number {
    const getLuminance = (hex: string) => {
        const rgb = parseInt(hex.slice(1), 16);
        const r = ((rgb >> 16) & 0xff) / 255;
        const g = ((rgb >> 8) & 0xff) / 255;
        const b = (rgb & 0xff) / 255;

        const [rs, gs, bs] = [r, g, b].map((c) => {
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });

        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Keyboard shortcuts registry for components
 */
export class KeyboardShortcuts {
    private shortcuts = new Map<string, () => void>();
    
    register(key: string, callback: () => void) {
        this.shortcuts.set(key.toLowerCase(), callback);
    }

    unregister(key: string) {
        this.shortcuts.delete(key.toLowerCase());
    }

    handleKeyPress(e: KeyboardEvent) {
        const key = e.key.toLowerCase();
        const withModifiers = `${e.ctrlKey ? 'ctrl+' : ''}${e.shiftKey ? 'shift+' : ''}${e.altKey ? 'alt+' : ''}${key}`;
        
        const handler = this.shortcuts.get(withModifiers) || this.shortcuts.get(key);
        if (handler) {
            e.preventDefault();
            handler();
        }
    }
}

export const globalShortcuts = new KeyboardShortcuts();

/**
 * Hook to register component-level keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
    useEffect(() => {
        Object.entries(shortcuts).forEach(([key, callback]) => {
            globalShortcuts.register(key, callback);
        });

        const handleKeyPress = (e: KeyboardEvent) => {
            globalShortcuts.handleKeyPress(e);
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            Object.keys(shortcuts).forEach((key) => {
                globalShortcuts.unregister(key);
            });
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [shortcuts]);
}

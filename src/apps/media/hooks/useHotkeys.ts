import { useState, useEffect, useCallback } from 'react';

export interface Hotkey {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    action: string;
    description: string;
}

export const DEFAULT_HOTKEYS: Hotkey[] = [
    { key: ' ', action: 'play-pause', description: 'Play/Pause' },
    { key: 'ArrowLeft', action: 'frame-back', description: 'Previous Frame' },
    { key: 'ArrowRight', action: 'frame-forward', description: 'Next Frame' },
    { key: 'Home', action: 'goto-start', description: 'Go to Start' },
    { key: 'End', action: 'goto-end', description: 'Go to End' },
    { key: 's', ctrl: true, action: 'save', description: 'Save Project' },
    { key: 'o', ctrl: true, action: 'open', description: 'Open Project' },
    { key: 'e', ctrl: true, action: 'export', description: 'Export Video' },
    { key: 'z', ctrl: true, action: 'undo', description: 'Undo' },
    { key: 'y', ctrl: true, action: 'redo', description: 'Redo' },
    { key: 'c', ctrl: true, action: 'copy', description: 'Copy' },
    { key: 'v', ctrl: true, action: 'paste', description: 'Paste' },
    { key: 'x', ctrl: true, action: 'cut', description: 'Cut' },
    { key: 'a', ctrl: true, action: 'select-all', description: 'Select All' },
    { key: 'Delete', action: 'delete', description: 'Delete Selected' },
    { key: 'm', action: 'add-marker', description: 'Add Marker' },
];

export const useHotkeys = (
    handlers: Record<string, () => void>,
    enabled: boolean = true
) => {
    const [hotkeys] = useState<Hotkey[]>(DEFAULT_HOTKEYS);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        const matchingHotkey = hotkeys.find(hk => {
            const keyMatches = hk.key.toLowerCase() === event.key.toLowerCase();
            const ctrlMatches = !hk.ctrl || (event.ctrlKey || event.metaKey);
            const shiftMatches = !hk.shift || event.shiftKey;
            const altMatches = !hk.alt || event.altKey;
            const metaMatches = !hk.meta || event.metaKey;

            return keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches;
        });

        if (matchingHotkey && handlers[matchingHotkey.action]) {
            event.preventDefault();
            handlers[matchingHotkey.action]();
        }
    }, [enabled, hotkeys, handlers]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return { hotkeys };
};

export class HotkeyManager {
    private static instance: HotkeyManager;
    private hotkeys: Map<string, Hotkey> = new Map();

    private constructor() {
        DEFAULT_HOTKEYS.forEach(hk => {
            this.hotkeys.set(this.getKey(hk), hk);
        });
    }

    static getInstance(): HotkeyManager {
        if (!this.instance) {
            this.instance = new HotkeyManager();
        }
        return this.instance;
    }

    private getKey(hotkey: Hotkey): string {
        const parts = [hotkey.key];
        if (hotkey.ctrl) parts.push('ctrl');
        if (hotkey.shift) parts.push('shift');
        if (hotkey.alt) parts.push('alt');
        if (hotkey.meta) parts.push('meta');
        return parts.sort().join('+');
    }

    register(hotkey: Hotkey): void {
        this.hotkeys.set(this.getKey(hotkey), hotkey);
    }

    unregister(hotkey: Hotkey): void {
        this.hotkeys.delete(this.getKey(hotkey));
    }

    getAll(): Hotkey[] {
        return Array.from(this.hotkeys.values());
    }

    exportHotkeys(): string {
        return JSON.stringify(this.getAll(), null, 2);
    }

    importHotkeys(json: string): void {
        try {
            const hotkeys: Hotkey[] = JSON.parse(json);
            this.hotkeys.clear();
            hotkeys.forEach(hk => this.register(hk));
        } catch (error) {
            console.error('Failed to import hotkeys:', error);
        }
    }
}

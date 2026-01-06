export interface Shortcut {
    key: string;
    modifiers: ('ctrl' | 'shift' | 'alt' | 'meta')[];
    action: string;
    description: string;
    handler: () => void;
}

export const DEFAULT_SHORTCUTS: Omit<Shortcut, 'handler'>[] = [
    {
        key: ' ',
        modifiers: [],
        action: 'playPause',
        description: 'Play/Pause',
    },
    {
        key: 'ArrowLeft',
        modifiers: [],
        action: 'previousFrame',
        description: 'Previous Frame',
    },
    {
        key: 'ArrowRight',
        modifiers: [],
        action: 'nextFrame',
        description: 'Next Frame',
    },
    {
        key: 's',
        modifiers: ['ctrl'],
        action: 'save',
        description: 'Save Project',
    },
    {
        key: 'e',
        modifiers: ['ctrl'],
        action: 'export',
        description: 'Export Video',
    },
    {
        key: 'z',
        modifiers: ['ctrl'],
        action: 'undo',
        description: 'Undo',
    },
    {
        key: 'y',
        modifiers: ['ctrl'],
        action: 'redo',
        description: 'Redo',
    },
    {
        key: 'c',
        modifiers: ['ctrl'],
        action: 'copy',
        description: 'Copy',
    },
    {
        key: 'v',
        modifiers: ['ctrl'],
        action: 'paste',
        description: 'Paste',
    },
    {
        key: 'Delete',
        modifiers: [],
        action: 'delete',
        description: 'Delete Selected',
    },
];

export class KeyboardShortcuts {
    private shortcuts: Map<string, Shortcut> = new Map();
    private enabled: boolean = true;

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', this.handleKeyDown.bind(this));
        }
    }

    register(shortcut: Shortcut): void {
        const key = this.createKey(shortcut.key, shortcut.modifiers);
        this.shortcuts.set(key, shortcut);
    }

    unregister(key: string, modifiers: Shortcut['modifiers']): void {
        const shortcutKey = this.createKey(key, modifiers);
        this.shortcuts.delete(shortcutKey);
    }

    private createKey(key: string, modifiers: Shortcut['modifiers']): string {
        const sortedModifiers = [...modifiers].sort().join('+');
        return sortedModifiers ? `${sortedModifiers}+${key}` : key;
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (!this.enabled) return;

        const modifiers: Shortcut['modifiers'] = [];
        if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
        if (event.shiftKey) modifiers.push('shift');
        if (event.altKey) modifiers.push('alt');

        const key = this.createKey(event.key, modifiers);
        const shortcut = this.shortcuts.get(key);

        if (shortcut) {
            event.preventDefault();
            shortcut.handler();
        }
    }

    enable(): void {
        this.enabled = true;
    }

    disable(): void {
        this.enabled = false;
    }

    getAllShortcuts(): Shortcut[] {
        return Array.from(this.shortcuts.values());
    }

    destroy(): void {
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', this.handleKeyDown.bind(this));
        }
        this.shortcuts.clear();
    }
}

export const keyboardShortcuts = new KeyboardShortcuts();

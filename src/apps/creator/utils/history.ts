import { EditorState } from '../types/editor';

export interface HistoryEntry {
    state: EditorState;
    timestamp: number;
    action: string;
}

export class HistoryManager {
    private undoStack: HistoryEntry[] = [];
    private redoStack: HistoryEntry[] = [];
    private maxHistory = 50;

    push(state: EditorState, action: string) {
        this.undoStack.push({
            state: JSON.parse(JSON.stringify(state)), // Deep copy
            timestamp: Date.now(),
            action
        });
        
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }
        
        this.redoStack = []; // Clear redo on new action
    }

    undo(currentState: EditorState): EditorState | null {
        if (this.undoStack.length === 0) return null;
        
        const entry = this.undoStack.pop()!;
        this.redoStack.push({
            state: JSON.parse(JSON.stringify(currentState)),
            timestamp: Date.now(),
            action: 'undo'
        });
        
        return entry.state;
    }

    redo(currentState: EditorState): EditorState | null {
        if (this.redoStack.length === 0) return null;

        const entry = this.redoStack.pop()!;
        this.undoStack.push({
            state: JSON.parse(JSON.stringify(currentState)),
            timestamp: Date.now(),
            action: 'redo'
        });

        return entry.state;
    }
}

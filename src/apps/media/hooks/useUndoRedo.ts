import { useState, useCallback, useEffect } from 'react';

interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export interface UseUndoRedoReturn<T> {
    state: T;
    setState: (newState: T | ((prevState: T) => T)) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    clear: () => void;
}

export const useUndoRedo = <T>(initialState: T, maxHistory: number = 50): UseUndoRedoReturn<T> => {
    const [history, setHistory] = useState<HistoryState<T>>({
        past: [],
        present: initialState,
        future: [],
    });

    const setState = useCallback((newState: T | ((prevState: T) => T)) => {
        setHistory(currentHistory => {
            const resolvedState = typeof newState === 'function'
                ? (newState as (prevState: T) => T)(currentHistory.present)
                : newState;

            const newPast = [...currentHistory.past, currentHistory.present];

            // Limit history size
            if (newPast.length > maxHistory) {
                newPast.shift();
            }

            return {
                past: newPast,
                present: resolvedState,
                future: [],
            };
        });
    }, [maxHistory]);

    const undo = useCallback(() => {
        setHistory(currentHistory => {
            if (currentHistory.past.length === 0) {
                return currentHistory;
            }

            const previous = currentHistory.past[currentHistory.past.length - 1];
            const newPast = currentHistory.past.slice(0, currentHistory.past.length - 1);

            return {
                past: newPast,
                present: previous,
                future: [currentHistory.present, ...currentHistory.future],
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory(currentHistory => {
            if (currentHistory.future.length === 0) {
                return currentHistory;
            }

            const next = currentHistory.future[0];
            const newFuture = currentHistory.future.slice(1);

            return {
                past: [...currentHistory.past, currentHistory.present],
                present: next,
                future: newFuture,
            };
        });
    }, []);

    const clear = useCallback(() => {
        setHistory({
            past: [],
            present: history.present,
            future: [],
        });
    }, [history.present]);

    return {
        state: history.present,
        setState,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        clear,
    };
};

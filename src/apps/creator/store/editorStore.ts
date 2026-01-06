import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { EditorState, ActiveTool, EditorMode, Layer, CursorType } from '../types/editor';

type Action =
    | { type: 'SET_TOOL'; payload: ActiveTool }
    | { type: 'SET_MODE'; payload: EditorMode }
    | { type: 'SET_ZOOM'; payload: number }
    | { type: 'SET_SELECTION'; payload: string[] }
    | { type: 'SET_CURSOR'; payload: CursorType }
    | { type: 'SET_PROJECT'; payload: string | null }
    | { type: 'ADD_LAYER'; payload: Layer }
    | { type: 'REORDER_LAYERS'; payload: string[] }
    | { type: 'UPDATE_LAYER'; payload: { id: string; updates: Partial<Layer> } }
    | { type: 'UPDATE_LAYERS'; payload: { ids: string[]; updates: Partial<Layer> } }
    | { type: 'MOVE_LAYERS'; payload: { ids: string[]; dx: number; dy: number } }
    | { type: 'DELETE_LAYERS'; payload: string[] }
    | { type: 'PUSH_HISTORY'; payload: Layer[] }
    | { type: 'UNDO' }
    | { type: 'REDO' };

const initialState: EditorState = {
    projectId: null,
    mode: 'design',
    activeTool: 'select',
    cursor: 'default',
    zoom: 1,
    selectedIds: [],
    layers: [],
    isDragging: false,
    canvasSize: { width: 1920, height: 1080 },
    history: {
        past: [],
        future: []
    }
};

interface HistoryState {
    past: Layer[][];
    future: Layer[][];
}

const EditorContext = createContext<{
    state: EditorState;
    dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

function editorReducer(state: EditorState, action: Action): EditorState {
    switch (action.type) {
        case 'SET_TOOL':
            return { ...state, activeTool: action.payload };
        case 'SET_MODE':
            return { ...state, mode: action.payload };
        case 'SET_ZOOM':
            return { ...state, zoom: action.payload };
        case 'SET_SELECTION':
            return { ...state, selectedIds: action.payload };
        case 'SET_CURSOR':
            return { ...state, cursor: action.payload };
        case 'SET_PROJECT':
            return { ...state, projectId: action.payload };
        case 'ADD_LAYER':
            return { ...state, layers: [...state.layers, action.payload] };
        case 'REORDER_LAYERS':
            const newOrder = action.payload;
            const reorderedLayers = [...state.layers].sort((a, b) =>
                newOrder.indexOf(a.id) - newOrder.indexOf(b.id)
            );
            return { ...state, layers: reorderedLayers };
        case 'UPDATE_LAYER':
            return {
                ...state,
                layers: state.layers.map(layer =>
                    layer.id === action.payload.id
                        ? { ...layer, ...action.payload.updates }
                        : layer
                )
            };
        case 'UPDATE_LAYERS':
            return {
                ...state,
                layers: state.layers.map(layer =>
                    action.payload.ids.includes(layer.id)
                        ? { ...layer, ...action.payload.updates }
                        : layer
                )
            };
        case 'MOVE_LAYERS':
            return {
                ...state,
                layers: state.layers.map(layer =>
                    action.payload.ids.includes(layer.id)
                        ? { ...layer, x: layer.x + action.payload.dx, y: layer.y + action.payload.dy }
                        : layer
                )
            };
        case 'DELETE_LAYERS':
            return {
                ...state,
                layers: state.layers.filter(layer => !action.payload.includes(layer.id)),
                selectedIds: state.selectedIds.filter(id => !action.payload.includes(id))
            };
        case 'PUSH_HISTORY':
            return {
                ...state,
                history: {
                    past: [...state.history.past.slice(-49), state.layers], // Keep last 50 states
                    future: []
                }
            };
        case 'UNDO':
            if (state.history.past.length === 0) return state;
            const previous = state.history.past[state.history.past.length - 1];
            const newPast = state.history.past.slice(0, state.history.past.length - 1);
            return {
                ...state,
                layers: previous,
                history: {
                    past: newPast,
                    future: [state.layers, ...state.history.future]
                }
            };
        case 'REDO':
            if (state.history.future.length === 0) return state;
            const next = state.history.future[0];
            const newFuture = state.history.future.slice(1);
            return {
                ...state,
                layers: next,
                history: {
                    past: [...state.history.past, state.layers],
                    future: newFuture
                }
            };
        default:
            return state;
    }
}

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(editorReducer, initialState);
    return React.createElement(EditorContext.Provider, { value: { state, dispatch } }, children);
};

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};

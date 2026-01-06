import { useEffect } from 'react';
import { useEditor } from '../store/editorStore';
import { useHistory } from './useHistory';

export const useKeyboardShortcuts = () => {
  const { state, dispatch } = useEditor();
  const { undo, redo } = useHistory();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or contentEditable
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          dispatch({ type: 'SET_TOOL', payload: 'select' });
          break;
        case 'r':
          dispatch({ type: 'SET_TOOL', payload: 'rect' });
          break;
        case 't':
          dispatch({ type: 'SET_TOOL', payload: 'text' });
          break;
        case 'delete':
        case 'backspace':
          if (state.selectedIds.length > 0) {
            dispatch({ type: 'DELETE_LAYERS', payload: state.selectedIds });
          }
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            redo();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedIds, dispatch, undo, redo]);
};

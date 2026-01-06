import { useCallback } from 'react';
import { useEditor } from '../store/editorStore';

// This hook would interface with a history stack
export const useHistory = () => {
  const { dispatch } = useEditor();

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  const pushState = useCallback(() => {
    dispatch({ type: 'PUSH_HISTORY', payload: [] });
  }, [dispatch]);

  return {
    undo,
    redo,
    pushState
  };
};

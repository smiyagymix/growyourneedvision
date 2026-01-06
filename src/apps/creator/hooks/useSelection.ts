import { useCallback } from 'react';
import { useEditor } from '../store/editorStore';

export const useSelection = () => {
  const { state, dispatch } = useEditor();

  const selectLayer = useCallback((id: string, multi: boolean = false) => {
    if (multi) {
      const newSelection = state.selectedIds.includes(id)
        ? state.selectedIds.filter(sid => sid !== id)
        : [...state.selectedIds, id];
      dispatch({ type: 'SET_SELECTION', payload: newSelection });
    } else {
      dispatch({ type: 'SET_SELECTION', payload: [id] });
    }
  }, [state.selectedIds, dispatch]);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'SET_SELECTION', payload: [] });
  }, [dispatch]);

  return {
    selectedIds: state.selectedIds,
    selectLayer,
    clearSelection
  };
};

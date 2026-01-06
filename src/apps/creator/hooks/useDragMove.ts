import { useState, useCallback } from 'react';
import { useEditor } from '../store/editorStore';
import { useHistory } from './useHistory';

export const useDragMove = () => {
  const { state, dispatch } = useEditor();
  const { pushState } = useHistory();
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  const startDrag = useCallback((e: React.MouseEvent, layerId: string) => {
    e.stopPropagation();
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setHasMoved(false);

    if (!state.selectedIds.includes(layerId)) {
      dispatch({ type: 'SET_SELECTION', payload: [layerId] });
    }
  }, [state.selectedIds, dispatch]);

  const onDrag = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = (e.clientX - startPos.x) / state.zoom;
    const dy = (e.clientY - startPos.y) / state.zoom;

    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      setHasMoved(true);
      dispatch({
        type: 'MOVE_LAYERS',
        payload: { ids: state.selectedIds, dx, dy }
      });
      setStartPos({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, startPos, state.zoom, state.selectedIds, dispatch]);

  const endDrag = useCallback(() => {
    if (isDragging && hasMoved) {
      pushState();
    }
    setIsDragging(false);
    setHasMoved(false);
  }, [isDragging, hasMoved, pushState]);

  return {
    isDragging,
    startDrag,
    onDrag,
    endDrag
  };
};

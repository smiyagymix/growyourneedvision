import { useState, useCallback } from 'react';
import { useEditor } from '../store/editorStore';
import { useHistory } from './useHistory';

export const useResize = () => {
  const { state, dispatch } = useEditor();
  const { pushState } = useHistory();
  const [isResizing, setIsResizing] = useState(false);
  const [handle, setHandle] = useState<string | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [hasResized, setHasResized] = useState(false);

  const startResize = useCallback((e: React.MouseEvent, handleId: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setHandle(handleId);
    setStartPos({ x: e.clientX, y: e.clientY });
    setHasResized(false);
  }, []);

  const onResize = useCallback((e: React.MouseEvent) => {
    if (!isResizing || !handle || state.selectedIds.length === 0) return;

    const dx = (e.clientX - startPos.x) / state.zoom;
    const dy = (e.clientY - startPos.y) / state.zoom;

    // For now, only support single layer resizing for simplicity
    // Multi-layer resizing requires calculating proportional scale relative to bounding box
    const layerId = state.selectedIds[0];
    const layer = state.layers.find(l => l.id === layerId);
    if (!layer) return;

    let { x, y, width, height } = layer;
    const minSize = 10;

    switch (handle) {
      case 'nw':
        width = Math.max(minSize, width - dx);
        height = Math.max(minSize, height - dy);
        x = x + (layer.width - width);
        y = y + (layer.height - height);
        break;
      case 'n':
        height = Math.max(minSize, height - dy);
        y = y + (layer.height - height);
        break;
      case 'ne':
        width = Math.max(minSize, width + dx);
        height = Math.max(minSize, height - dy);
        y = y + (layer.height - height);
        break;
      case 'e':
        width = Math.max(minSize, width + dx);
        break;
      case 'se':
        width = Math.max(minSize, width + dx);
        height = Math.max(minSize, height + dy);
        break;
      case 's':
        height = Math.max(minSize, height + dy);
        break;
      case 'sw':
        width = Math.max(minSize, width - dx);
        height = Math.max(minSize, height + dy);
        x = x + (layer.width - width);
        break;
      case 'w':
        width = Math.max(minSize, width - dx);
        x = x + (layer.width - width);
        break;
    }

    if (width !== layer.width || height !== layer.height || x !== layer.x || y !== layer.y) {
      setHasResized(true);
      dispatch({
        type: 'UPDATE_LAYER',
        payload: {
          id: layerId,
          updates: { x, y, width, height }
        }
      });
      setStartPos({ x: e.clientX, y: e.clientY });
    }
  }, [isResizing, handle, state.zoom, state.selectedIds, state.layers, startPos, dispatch]);

  const endResize = useCallback(() => {
    if (isResizing && hasResized) {
      pushState();
    }
    setIsResizing(false);
    setHandle(null);
    setHasResized(false);
  }, [isResizing, hasResized, pushState]);

  return {
    isResizing,
    startResize,
    onResize,
    endResize
  };
};

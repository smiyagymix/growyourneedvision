import { useCallback } from 'react';
import { useEditor } from '../store/editorStore';
import { copyToClipboard, pasteFromClipboard } from '../utils/clipboard';

export const useClipboard = () => {
  const { state, dispatch } = useEditor();

  const copy = useCallback(async () => {
    const selectedLayers = state.layers.filter(l => state.selectedIds.includes(l.id));
    if (selectedLayers.length > 0) {
      await copyToClipboard(selectedLayers);
    }
  }, [state.layers, state.selectedIds]);

  const paste = useCallback(async () => {
    const layers = await pasteFromClipboard();
    if (layers) {
      // Generate new IDs and offset positions
      const newLayers = layers.map(l => ({
        ...l,
        id: crypto.randomUUID(),
        x: l.x + 20,
        y: l.y + 20
      }));
      
      newLayers.forEach(layer => {
        dispatch({ type: 'ADD_LAYER', payload: layer });
      });
      
      dispatch({ type: 'SET_SELECTION', payload: newLayers.map(l => l.id) });
    }
  }, [dispatch]);

  return { copy, paste };
};

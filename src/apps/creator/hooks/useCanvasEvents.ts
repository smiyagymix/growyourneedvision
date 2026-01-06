import { useCallback } from 'react';
import { useEditor } from '../store/editorStore';
import { useSelection } from './useSelection';
import { useDragMove } from './useDragMove';
import { useResize } from './useResize';
import { useRotate } from './useRotate';

export const useCanvasEvents = () => {
  const { state, dispatch } = useEditor();
  const { clearSelection } = useSelection();
  const { onDrag, endDrag } = useDragMove();
  const { onResize, endResize } = useResize();
  const { onRotate, endRotate } = useRotate();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // If clicking on empty canvas, handle tool actions
    if (e.target === e.currentTarget) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (e.clientX - rect.left) / state.zoom;
      const y = (e.clientY - rect.top) / state.zoom;

      if (['rect', 'circle', 'triangle', 'star', 'polygon', 'line', 'arrow'].includes(state.activeTool)) {
        dispatch({
          type: 'ADD_LAYER',
          payload: {
            id: crypto.randomUUID(),
            type: state.activeTool === 'circle' ? 'circle' : 'rect', // Basic types supported by renderer
            name: `New ${state.activeTool}`,
            x: x - 50,
            y: y - 50,
            width: 100,
            height: 100,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            fill: '#cccccc',
            stroke: '#000000',
            strokeWidth: 0,
            index: state.layers.length
          }
        });
        dispatch({ type: 'SET_TOOL', payload: 'select' });
        dispatch({ type: 'SET_CURSOR', payload: 'default' });
      } else if (state.activeTool === 'text') {
        dispatch({
          type: 'ADD_LAYER',
          payload: {
            id: crypto.randomUUID(),
            type: 'text',
            name: 'New Text',
            text: 'Double click to edit',
            x: x - 50,
            y: y - 20,
            width: 200,
            height: 40,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            fontSize: 24,
            fontFamily: 'Inter',
            fill: '#000000',
            index: state.layers.length
          }
        });
        dispatch({ type: 'SET_TOOL', payload: 'select' });
        dispatch({ type: 'SET_CURSOR', payload: 'default' });
      } else {
        clearSelection();
      }
    }
  }, [state.activeTool, state.zoom, state.layers.length, dispatch, clearSelection]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    onDrag(e);
    onResize(e);
    onRotate(e);
  }, [onDrag, onResize, onRotate]);

  const handleMouseUp = useCallback(() => {
    endDrag();
    endResize();
    endRotate();
  }, [endDrag, endResize, endRotate]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      const newZoom = Math.max(0.1, Math.min(5, state.zoom + delta * 0.001));
      dispatch({ type: 'SET_ZOOM', payload: newZoom });
    }
  }, [state.zoom, dispatch]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel
  };
};

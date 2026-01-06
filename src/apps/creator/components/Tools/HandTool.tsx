import React, { useEffect } from 'react';
import { useEditor } from '../../store/editorStore';

export const HandTool: React.FC = () => {
  const { state } = useEditor();

  useEffect(() => {
    if (state.activeTool === 'hand') {
      document.body.style.cursor = 'grab';
    } else {
      document.body.style.cursor = 'default';
    }
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [state.activeTool]);

  return null; // Logic handled in useDragMove or similar
};

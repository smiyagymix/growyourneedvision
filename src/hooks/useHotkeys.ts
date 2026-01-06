
import { useEffect } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

export const useHotkeys = (keys: string[], callback: KeyHandler) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keyCombo = [
        event.ctrlKey ? 'ctrl' : '',
        event.altKey ? 'alt' : '',
        event.shiftKey ? 'shift' : '',
        event.metaKey ? 'meta' : '',
        event.key.toLowerCase()
      ].filter(Boolean).join('+');

      // Check if the event key or combo matches any of the specified keys
      if (keys.some(k => k.toLowerCase() === keyCombo || k.toLowerCase() === event.key.toLowerCase())) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keys, callback]);
};

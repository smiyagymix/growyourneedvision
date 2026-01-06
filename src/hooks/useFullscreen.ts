
import React, { useState, useCallback, useRef } from 'react';

export const useFullscreen = (elRef?: React.RefObject<HTMLElement>) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  const toggleFullscreen = useCallback(() => {
    const el = elRef?.current || elementRef.current || document.documentElement;

    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  }, [elRef]);

  return { isFullscreen, toggleFullscreen, elementRef };
};

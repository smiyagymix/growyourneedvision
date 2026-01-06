import { useState, useLayoutEffect, useRef } from 'react';

export const useRaf = (ms: number = 1e12, delay: number = 0): number => {
  const [elapsed, setElapsed] = useState<number>(0);
  const start = useRef<number>(Date.now());
  const onFrame = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    let timer: NodeJS.Timeout;

    const loop = () => {
      const now = Date.now();
      const delta = now - start.current;
      if (delta >= delay) {
        setElapsed(Math.min(1, (delta - delay) / ms));
      }
      if (delta < ms + delay) {
        onFrame.current = requestAnimationFrame(loop);
      }
    };

    timer = setTimeout(loop, delay);

    return () => {
      clearTimeout(timer);
      if (onFrame.current) cancelAnimationFrame(onFrame.current);
    };
  }, [ms, delay]);

  return elapsed;
};
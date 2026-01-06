
import { useState, useRef, useEffect } from 'react';

export const useMeasure = <T extends HTMLElement = HTMLDivElement>() => {
  const ref = useRef<T>(null);
  const [bounds, setBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setBounds(entry.contentRect);
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, bounds] as const;
};

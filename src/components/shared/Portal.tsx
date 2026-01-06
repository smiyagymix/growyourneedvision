
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  selector?: string;
}

export const Portal: React.FC<PortalProps> = ({ children, selector = '#root' }) => {
  const [mounted, setMounted] = useState(false);
  const [element, setElement] = useState<Element | null>(null);

  useEffect(() => {
    setMounted(true);
    const target = selector === '#root' ? document.body : document.querySelector(selector) || document.body;
    setElement(target);
    return () => setMounted(false);
  }, [selector]);

  if (!mounted || !element) return null;

  return createPortal(children, element);
};


import React, { useEffect, useRef } from 'react';

export const useUpdateEffect = (effect: React.EffectCallback, deps: React.DependencyList) => {
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
    } else {
      return effect();
    }
  }, deps);
};


import { useState, useCallback } from 'react';

export const useToggle = (initialState: boolean = false): [boolean, () => void, (value: boolean) => void] => {
  const [state, setState] = useState(initialState);

  const toggle = useCallback(() => setState((prev) => !prev), []);
  const set = useCallback((value: boolean) => setState(value), []);

  return [state, toggle, set];
};

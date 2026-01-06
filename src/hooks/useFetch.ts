import { useState, useEffect } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export const useFetch = <T>(url: string, options?: RequestInit): FetchState<T> => {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        if (mounted) setState({ data, loading: false, error: null });
      } catch (error) {
        if (mounted) setState({ data: null, loading: false, error: error as Error });
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [url]);

  return state;
};
import { useState, useEffect, useRef } from 'react';

export const useWebWorker = <T, R>(workerScript: string) => {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<R | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const worker = new Worker(workerScript);
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => setResult(e.data);
    worker.onerror = (e: ErrorEvent) => setError(new Error(e.message));

    return () => worker.terminate();
  }, [workerScript]);

  const postMessage = (msg: T) => {
    workerRef.current?.postMessage(msg);
  };

  return { result, error, postMessage };
};
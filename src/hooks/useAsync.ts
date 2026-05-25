import { useState, useCallback } from 'react';

export interface UseAsyncResult<T, Args extends any[] = any[]> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: Args) => Promise<T>;
  reset: () => void;
}

/**
 * A central hook to handle async operations safely with loading and error states.
 * Guarantees that loading state will be set back to false under any return path.
 */
export function useAsync<T, Args extends any[] = any[]>(
  asyncFunction: (...args: Args) => Promise<T>
): UseAsyncResult<T, Args> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: Args): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        const response = await asyncFunction(...args);
        setData(response);
        return response;
      } catch (err: any) {
        const errorObject = err instanceof Error ? err : new Error(err?.message || 'Unknown error occurred');
        setError(errorObject);
        throw errorObject;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset };
}

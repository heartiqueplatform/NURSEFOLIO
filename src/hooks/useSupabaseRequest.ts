import { useState, useCallback } from 'react';

export interface UseSupabaseRequestOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (err: Error) => void;
}

/**
 * A custom hook to wrap Supabase operations cleanly and guarantee loading teardown.
 */
export function useSupabaseRequest<T, Args extends any[] = any[]>(
  requestFn: (...args: Args) => Promise<T>,
  options?: UseSupabaseRequestOptions<T>
) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (...args: Args): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestFn(...args);
      setData(result);
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      return result;
    } catch (err: any) {
      console.error('Supabase request error:', err);
      const errorObject = err instanceof Error ? err : new Error(err?.message || 'Supabase operation failed');
      setError(errorObject);
      if (options?.onError) {
        options.onError(errorObject);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [requestFn, options]);

  return {
    loading,
    error,
    data,
    execute,
    setData,
    setLoading,
    setError
  };
}

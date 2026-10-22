import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export function useApi(apiFunc, { showSuccessToast = false, successMessage = 'Operation successful', showErrorToast = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunc(...args);
        setData(result);
        if (showSuccessToast) {
          toast.success(successMessage);
        }
        return result;
      } catch (err) {
        const errMsg = err?.message || 'An unexpected error occurred';
        setError(errMsg);
        if (showErrorToast) {
          toast.error(errMsg);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunc, showSuccessToast, successMessage, showErrorToast]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData,
  };
}

export default useApi;

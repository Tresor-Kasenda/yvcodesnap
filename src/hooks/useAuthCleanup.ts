import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * Hook to clean up auth subscription on component unmount
 * Prevents memory leaks from onAuthStateChange listener
 */
export function useAuthCleanup() {
  const cleanup = useAuthStore((state) => state.cleanup);

  useEffect(() => {
    // Cleanup on app unmount
    return () => {
      cleanup();
    };
  }, [cleanup]);
}

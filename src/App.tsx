import { useEffect, useState } from 'react';
import AppProviders from './app/providers/AppProviders';
import AppRouter from './app/router/AppRouter';
import { useAuthStore } from './store/authStore';
import { useSyncStore } from './store/syncStore';
import { useRecentSnapsStore } from './store/recentSnapsStore';
import { useAuthCleanup } from './hooks/useAuthCleanup';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { initialize, loading, user } = useAuthStore();
  const { migrateLocalSnaps, cloudSnaps } = useSyncStore();
  const { recentSnaps } = useRecentSnapsStore();
  const [migrationDone, setMigrationDone] = useState(false);

  // Cleanup auth subscription on unmount
  useAuthCleanup();

  // Initialize auth on app load
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auto-migrate local snaps on first login
  useEffect(() => {
    if (user && !migrationDone && recentSnaps.length > 0 && cloudSnaps.length === 0) {
      const snaps = recentSnaps.map(entry => entry.snap);
      migrateLocalSnaps(snaps);
      setMigrationDone(true);
    }
  }, [user, recentSnaps, cloudSnaps, migrationDone, migrateLocalSnaps]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-neutral-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading YvCode...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;

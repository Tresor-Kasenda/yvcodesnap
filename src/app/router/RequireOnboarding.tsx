import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface RequireOnboardingProps {
  children: ReactNode;
}

export default function RequireOnboarding({ children }: RequireOnboardingProps) {
  const { user, loading, hasCompletedOnboarding } = useAuthStore();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

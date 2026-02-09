import { Navigate, Route, Routes } from 'react-router-dom';
import LandingLayout from '../../layouts/LandingLayout';
import LandingPage from '../../pages/LandingPage';
import Editor from '../../pages/Editor';
import AuthPage from '../../pages/auth/AuthPage';
import ForgotPasswordPage from '../../pages/auth/ForgotPasswordPage';
import LoginPage from '../../pages/auth/LoginPage';
import OnboardingPage from '../../pages/auth/OnboardingPage';
import SignupPage from '../../pages/auth/SignupPage';
import RequireAuth from './RequireAuth';
import RequireOnboarding from './RequireOnboarding';
import { AuthErrorBoundary } from '../../components/auth/AuthErrorBoundary';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<LandingLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>
      <Route path="/auth" element={<AuthErrorBoundary><AuthPage /></AuthErrorBoundary>} />
      <Route path="/login" element={<AuthErrorBoundary><LoginPage /></AuthErrorBoundary>} />
      <Route path="/auth/login" element={<Navigate to="/login" replace />} />
      <Route path="/auth/signup" element={<AuthErrorBoundary><SignupPage /></AuthErrorBoundary>} />
      <Route path="/auth/forgot-password" element={<AuthErrorBoundary><ForgotPasswordPage /></AuthErrorBoundary>} />
      <Route
        path="/onboarding"
        element={(
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/editor"
        element={(
          <RequireAuth>
            <RequireOnboarding>
              <Editor />
            </RequireOnboarding>
          </RequireAuth>
        )}
      />
    </Routes>
  );
}

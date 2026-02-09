import { Route, Routes } from 'react-router-dom';
import LandingLayout from '../../layouts/LandingLayout';
import LandingPage from '../../pages/LandingPage';
import Editor from '../../pages/Editor';
import AuthPage from '../../pages/auth/AuthPage';
import ForgotPasswordPage from '../../pages/auth/ForgotPasswordPage';
import LoginPage from '../../pages/auth/LoginPage';
import SignupPage from '../../pages/auth/SignupPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<LandingLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/editor" element={<Editor />} />
    </Routes>
  );
}

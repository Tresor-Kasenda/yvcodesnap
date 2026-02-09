import { Navigate } from 'react-router-dom';

export default function AuthPage() {
  return <Navigate to="/auth/login" replace />;
}

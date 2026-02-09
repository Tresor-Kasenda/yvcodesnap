import type { ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { user } = useAuthStore();

  if (user) {
    return <Navigate to="/editor" replace />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#09090b] text-neutral-900 dark:text-white relative overflow-hidden px-6 py-10">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-blue-500/15 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative max-w-md mx-auto space-y-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour a l'accueil
        </Link>

        <div className="bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl p-8 space-y-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>

          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{subtitle}</p>

          {children}

          {footer && (
            <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

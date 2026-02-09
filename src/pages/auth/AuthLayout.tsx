import { useEffect, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { productBrand } from '../../content/product';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { user } = useAuthStore();

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.classList.add('auth-scrollbar');
    body.classList.add('auth-scrollbar');
    html.classList.add('auth-no-scroll');
    body.classList.add('auth-no-scroll');

    return () => {
      html.classList.remove('auth-scrollbar');
      body.classList.remove('auth-scrollbar');
      html.classList.remove('auth-no-scroll');
      body.classList.remove('auth-no-scroll');
    };
  }, []);

  if (user) {
    return <Navigate to="/editor" replace />;
  }

  return (
    <div className="h-screen bg-neutral-50 dark:bg-[#09090b] text-neutral-900 dark:text-white relative overflow-hidden px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[420px] bg-blue-500/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[520px] h-[360px] bg-violet-500/12 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative max-w-xl mx-auto h-full flex items-center">
        <section className="w-full rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white/90 dark:bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-black/5">
          <div className="space-y-6">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap className="w-6 h-6 text-white" />
              </span>
              <span className="leading-tight">
                <span className="block font-bold text-lg tracking-tight text-neutral-900 dark:text-white">{productBrand.name}</span>
                <span className="block text-xs text-neutral-500 dark:text-neutral-400">Professional code visuals platform</span>
              </span>
            </Link>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">{title}</h1>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">{subtitle}</p>
            </div>

            <div className="space-y-4">{children}</div>

            {footer && (
              <div className="pt-3 border-t border-neutral-200 dark:border-white/10 text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                {footer}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

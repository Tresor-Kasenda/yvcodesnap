import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import AuthLayout from './AuthLayout';

export default function SignupPage() {
  const { signUp, signInWithOAuth, signInWithMagicLink } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const clearFeedback = () => {
    setError('');
    setMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setLoading(true);

    const result = await signUp(email, password);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage('Compte cree. Verifie ton email pour confirmer ton inscription.');
    }
    setLoading(false);
  };

  const handleMagicLink = async () => {
    clearFeedback();
    setLoading(true);
    const result = await signInWithMagicLink(email);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage('Lien magique envoye. Verifie ta boite mail.');
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    clearFeedback();
    setLoading(true);
    await signInWithOAuth(provider);
  };

  return (
    <AuthLayout
      title="Creer un compte"
      subtitle="Cree ton compte pour acceder a l'editeur."
      footer={
        <p>
          Deja un compte ?{' '}
          <Link to="/auth/login" onClick={clearFeedback} className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
            Connexion
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="email">
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="password">
            Mot de passe
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {loading ? 'Chargement...' : 'Creer mon compte'}
        </button>

        <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
        <span className="text-xs text-neutral-500">ou</span>
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={loading}
          className="w-full py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-60"
        >
          Continuer avec Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('github')}
          disabled={loading}
          className="w-full py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-60"
        >
          Continuer avec GitHub
        </button>
        <button
          type="button"
          onClick={handleMagicLink}
          disabled={loading || !email}
          className="w-full py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-60"
        >
          Se connecter avec un lien magique
        </button>
      </div>
      </form>
    </AuthLayout>
  );
}

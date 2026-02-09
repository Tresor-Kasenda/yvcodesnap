import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import AuthLayout from './AuthLayout';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuthStore();
  const [email, setEmail] = useState('');
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

    const result = await requestPasswordReset(email);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage('Un email de reinitialisation vient d etre envoye.');
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      title="Mot de passe oublie"
      subtitle="Entre ton email pour recevoir un lien de reinitialisation."
      footer={
        <p>
          Retour a la{' '}
          <Link to="/auth/login" onClick={clearFeedback} className="text-blue-600 dark:text-blue-400 hover:underline">
            connexion
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="email">
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
          {loading ? 'Chargement...' : 'Envoyer le lien'}
        </button>
      </form>
    </AuthLayout>
  );
}

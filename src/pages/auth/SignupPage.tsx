import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authCommonCopy, authPageCopy } from '../../content/auth';
import { AuthFeedback, AuthSocialActions, AuthTextField } from '../../components/auth';
import { authPrimaryButtonClass, authSecondaryLinkClass } from './styles';
import AuthLayout from './AuthLayout';

export default function SignupPage() {
  const { signUp, signInWithOAuth, signInWithMagicLink } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setMessage(authCommonCopy.signupSuccess);
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
      setMessage(authCommonCopy.magicLinkSuccess);
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    clearFeedback();
    setLoading(true);
    try {
      const result = await signInWithOAuth(provider);
      if (result.error) {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={authPageCopy.signup.title}
      subtitle={authPageCopy.signup.subtitle}
      footer={
        <p>
          {authPageCopy.signup.helperPrimary}{' '}
          <Link to="/login" onClick={clearFeedback} className={authSecondaryLinkClass}>
            {authPageCopy.signup.helperPrimaryCta}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthTextField
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          placeholder={authCommonCopy.emailPlaceholder}
          label={authCommonCopy.emailLabel}
          icon={Mail}
        />

        <AuthTextField
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder={authCommonCopy.passwordPlaceholder}
          label={authCommonCopy.passwordLabel}
          icon={KeyRound}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        {error && <AuthFeedback type="error" message={error} />}
        {message && <AuthFeedback type="success" message={message} />}

        <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
          {loading ? authCommonCopy.loading : authPageCopy.signup.submit}
        </button>
      </form>

      <AuthSocialActions
        loading={loading}
        email={email}
        onOAuth={handleOAuth}
        onMagicLink={handleMagicLink}
      />
    </AuthLayout>
  );
}

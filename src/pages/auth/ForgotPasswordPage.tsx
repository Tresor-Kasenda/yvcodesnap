import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authCommonCopy, authPageCopy } from '../../content/auth';
import { AuthFeedback, AuthTextField } from '../../components/auth';
import { authPrimaryButtonClass, authSecondaryLinkClass } from './styles';
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
      setMessage(authCommonCopy.resetSuccess);
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      title={authPageCopy.forgotPassword.title}
      subtitle={authPageCopy.forgotPassword.subtitle}
      footer={
        <p>
          {authPageCopy.forgotPassword.helperPrimary}{' '}
          <Link to="/auth/login" onClick={clearFeedback} className={authSecondaryLinkClass}>
            {authPageCopy.forgotPassword.helperPrimaryCta}
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

        {error && <AuthFeedback type="error" message={error} />}
        {message && <AuthFeedback type="success" message={message} />}

        <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
          {loading ? authCommonCopy.loading : authPageCopy.forgotPassword.submit}
        </button>
      </form>
    </AuthLayout>
  );
}

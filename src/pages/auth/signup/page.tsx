import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { bawabahAuth } from '../../../lib/bawabah';
import Input from '../../../components/base/Input';
import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';

// Declare Bawabah global function
declare global {
  interface Window {
    startBawabah: (config: {
      element: string;
      appId: string;
      callbackUrl: string;
    }) => void;
  }
}

export default function SignUpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Load Bawabah script
      const script = document.createElement('script');
      script.src = 'https://bawabah.app/app/login-form.js';
      script.async = true;
      script.onload = () => {
        // Initialize Bawabah after script loads
        if (window.startBawabah) {
          try {
            window.startBawabah({
              element: 'bawabah-signup-form',
              appId: 'mREft20T'
            });
          } catch (err) {
            console.error('Failed to initialize Bawabah:', err);
          }
        }
      };
      script.onerror = () => {
        console.error('Failed to load Bawabah script');
      };
      document.body.appendChild(script);

      return () => {
        // Cleanup script on unmount
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError(t('common:passwords_no_match'));
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    try {
      bawabahAuth.signInWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    }
  };

  const handleAppleSignUp = () => {
    try {
      bawabahAuth.signInWithApple();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">{t('common:sign_up')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('common:create_account')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Bawabah Signup Form */}
        <div id="bawabah-signup-form" className="mb-6"></div>

        <form onSubmit={handleSignUp} className="space-y-4 mb-6">
          <Input
            type="text"
            label={t('common:full_name')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            type="email"
            label={t('common:email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            label={t('common:password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            label={t('common:confirm_password')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t('common:loading') : t('common:sign_up')}
          </Button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">{t('common:or')}</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
              Sign up with Google
            </span>
          </button>

          {/* Apple */}
          <button
            type="button"
            onClick={handleAppleSignUp}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path className="dark:fill-white fill-black" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
              Sign up with Apple
            </span>
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('common:have_account')}{' '}
          <Link to="/auth/signin" className="text-black dark:text-white font-medium hover:underline">
            {t('common:sign_in')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
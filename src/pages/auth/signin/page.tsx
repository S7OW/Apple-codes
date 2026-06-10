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

export default function SignInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bawabahLoaded, setBawabahLoaded] = useState(false);

  // Initialize Bawabah form on component mount
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
              element: 'bawabah-login-form',
              appId: 'mREft20T'
            });
            setBawabahLoaded(true);
          } catch (err) {
            console.error('Failed to initialize Bawabah:', err);
            setBawabahLoaded(true);
          }
        } else {
          setBawabahLoaded(true);
        }
      };
      script.onerror = () => {
        console.error('Failed to load Bawabah script');
      };
      document.body.appendChild(script);

      // Cleanup script on unmount
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        if (rememberMe) {
          localStorage.setItem('remember_email', email);
        } else {
          localStorage.removeItem('remember_email');
        }
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    try {
      bawabahAuth.signInWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    }
  };

  const handleAppleSignIn = () => {
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
          <h1 className="text-3xl font-bold mb-2 dark:text-white">{t('common:sign_in')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('common:welcome_back')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Bawabah Login Form Placeholder */}
        <div id="bawabah-login-form" className="mb-6"></div>

        <form onSubmit={handleEmailSignIn} className="space-y-4 mb-4">
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

          {/* Remember Me + Forgot Password row */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    rememberMe
                      ? 'bg-black dark:bg-white border-black dark:border-white'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-400'
                  }`}
                >
                  {rememberMe && (
                    <i className="ri-check-line text-white dark:text-black text-xs leading-none"></i>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('common:remember_me') || 'Remember me'}
              </span>
            </label>

            <Link
              to="/auth/forgot-password"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              {t('common:forgot_password')}
            </Link>
          </div>

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t('common:loading') : t('common:sign_in')}
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
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
              {t('common:sign_in_with_google')}
            </span>
          </button>

          {/* Apple */}
          <button
            type="button"
            onClick={handleAppleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path className="dark:fill-white fill-black" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
              {t('common:sign_in_with_apple')}
            </span>
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('common:no_account')}{' '}
          <Link to="/auth/signup" className="text-black dark:text-white font-medium hover:underline">
            {t('common:sign_up')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
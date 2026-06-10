import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import Input from '../../../components/base/Input';
import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-mail-check-line text-3xl text-green-600 dark:text-green-400"></i>
          </div>
          <h1 className="text-2xl font-bold mb-2 dark:text-white">{t('common:forgot_password.check_email')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('common:forgot_password.email_sent_desc')}
          </p>
          <Link to="/auth/signin">
            <Button fullWidth>
              {t('common:forgot_password.back_to_signin')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">{t('common:forgot_password.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('common:forgot_password.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <Input
            type="email"
            label={t('common:email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t('common:forgot_password.email_placeholder')}
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t('common:loading') : t('common:forgot_password.send_reset_link')}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('common:forgot_password.remember_password')}{' '}
          <Link to="/auth/signin" className="text-black dark:text-white font-medium hover:underline">
            {t('common:sign_in')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
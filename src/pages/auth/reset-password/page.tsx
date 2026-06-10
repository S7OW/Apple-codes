import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import Input from '../../../components/base/Input';
import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    // Check if user has a valid recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true);
      } else {
        setError(t('common:reset_password.invalid_link'));
      }
    });
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t('common:settings.password_min_length'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('common:settings.passwords_no_match'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      setLoading(false);
    }
  };

  if (!validSession && error) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-3xl text-red-600 dark:text-red-400"></i>
          </div>
          <h1 className="text-2xl font-bold mb-2 dark:text-white">{t('common:reset_password.invalid_title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <Button fullWidth onClick={() => navigate('/auth/forgot-password')}>
            {t('common:reset_password.request_new_link')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">{t('common:reset_password.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('common:reset_password.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            label={t('common:settings.new_password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={t('common:reset_password.password_placeholder')}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
            {t('common:settings.password_requirements')}
          </p>
          <Input
            type="password"
            label={t('common:settings.confirm_password')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder={t('common:reset_password.confirm_placeholder')}
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t('common:loading') : t('common:reset_password.reset_button')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
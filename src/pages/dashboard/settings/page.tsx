import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useStore();

  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
    } else {
      setFullName(user.full_name || '');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!user) {
    return null;
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) throw error;

      setUser({ ...user, full_name: fullName });
      showToast(t('settings.name_updated'), 'success');
    } catch (error) {
      showToast(t('settings.update_failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      showToast(t('settings.password_min_length'), 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(t('settings.passwords_no_match'), 'error');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(t('settings.password_updated'), 'success');
    } catch (error) {
      showToast(t('settings.password_update_failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      // In a real app, you'd call a backend endpoint to delete the user
      // For now, just sign out
      await supabase.auth.signOut();
      setUser(null);
      navigate('/');
      showToast(t('settings.account_deleted'), 'success');
    } catch (error) {
      showToast(t('settings.delete_failed'), 'error');
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  const getMemberSince = () => {
    // Mock date for now since we don't have created_at
    return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-arrow-left-line"></i>
            {t('settings.back_to_dashboard')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('settings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('settings.account_info')}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('settings.email')}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('settings.member_since')}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{getMemberSince()}</span>
            </div>
          </div>
        </div>

        {/* Update Name */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('settings.update_name')}
          </h2>
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.full_name')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent dark:text-white transition-all"
                placeholder={t('settings.full_name_placeholder')}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !fullName.trim()}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap text-sm"
            >
              {isLoading ? t('settings.saving') : t('settings.save_changes')}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('settings.change_password')}
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.current_password')}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent dark:text-white transition-all"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.new_password')}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent dark:text-white transition-all"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('settings.password_requirements')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.confirm_password')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent dark:text-white transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap text-sm"
            >
              {isLoading ? t('settings.updating') : t('settings.update_password')}
            </button>
          </form>
        </div>

        {/* Delete Account */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-900/50 p-6">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
            {t('settings.danger_zone')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('settings.delete_warning')}
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap text-sm"
          >
            {t('settings.delete_account')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
              <i className="ri-error-warning-line text-2xl text-red-600 dark:text-red-400"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              {t('settings.confirm_delete')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              {t('settings.delete_confirmation_text')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap text-sm"
              >
                {t('settings.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap text-sm"
              >
                {isLoading ? t('settings.deleting') : t('settings.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 end-6 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            toast.type === 'success'
              ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200'
              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            <i className={`ri-${toast.type === 'success' ? 'checkbox-circle' : 'error-warning'}-line text-xl`}></i>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
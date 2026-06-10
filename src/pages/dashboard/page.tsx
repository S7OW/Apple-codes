import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCurrency } from '../../hooks/useCurrency';

interface RecentOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  order_items: {
    product: {
      name_en: string;
      name_ar: string;
      image_url: string;
    };
  }[];
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, favorites } = useStore();
  const { formatPrice } = useCurrency();
  const [codesCount, setCodesCount] = useState(0);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }

    fetchCodesCount();
    fetchRecentOrders();
  }, [user, navigate]);

  const fetchCodesCount = async () => {
    if (!user) return;

    try {
      setLoadingCodes(true);
      const { count, error } = await supabase
        .from('codes')
        .select('*', { count: 'exact', head: true })
        .eq('used_by', user.id);

      if (error) throw error;

      setCodesCount(count || 0);
    } catch (error) {
      console.error('Error fetching codes count:', error);
    } finally {
      setLoadingCodes(false);
    }
  };

  const fetchRecentOrders = async () => {
    if (!user) return;

    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          order_items (
            product:products (
              name_en,
              name_ar,
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setRecentOrders(data || []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
      completed: {
        bg: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
        text: t('order_status.completed'),
        icon: 'ri-checkbox-circle-line',
      },
      pending: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
        text: t('order_status.pending'),
        icon: 'ri-time-line',
      },
      failed: {
        bg: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
        text: t('order_status.failed'),
        icon: 'ri-close-circle-line',
      },
      cancelled: {
        bg: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
        text: t('order_status.cancelled'),
        icon: 'ri-close-line',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg}`}>
        <i className={config.icon}></i>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard.welcome')}, {user.full_name || user.email.split('@')[0]}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Favorites */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-xl flex items-center justify-center">
                <i className="ri-heart-line text-2xl text-pink-600 dark:text-pink-400"></i>
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {favorites.length}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {t('dashboard.favorites')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('dashboard.savedProducts')}
            </p>
            <button
              onClick={() => navigate('/dashboard/favorites')}
              className="w-full text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium cursor-pointer flex items-center justify-center gap-1"
            >
              {t('dashboard.viewFavorites')}
              <i className="ri-arrow-right-line"></i>
            </button>
          </div>

          {/* My Codes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center">
                <i className="ri-key-line text-2xl text-teal-600 dark:text-teal-400"></i>
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {loadingCodes ? (
                  <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  codesCount
                )}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {t('dashboard.myCodes')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('dashboard.purchasedCodes')}
            </p>
            <button
              onClick={() => navigate('/dashboard/codes')}
              className="w-full text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium cursor-pointer flex items-center justify-center gap-1"
            >
              {t('dashboard.viewCodes')}
              <i className="ri-arrow-right-line"></i>
            </button>
          </div>

          {/* Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center">
                <i className="ri-settings-3-line text-2xl text-indigo-600 dark:text-indigo-400"></i>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {t('dashboard.settings')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('dashboard.manageAccount')}
            </p>
            <button
              onClick={() => navigate('/dashboard/settings')}
              className="w-full text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium cursor-pointer flex items-center justify-center gap-1"
            >
              {t('dashboard.viewSettings')}
              <i className="ri-arrow-right-line"></i>
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.recentActivity')}
            </h2>
            {recentOrders.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {recentOrders.length} {recentOrders.length === 1 ? t('order_singular') : t('orders_plural')}
              </span>
            )}
          </div>

          {loadingOrders ? (
            <div className="text-center py-12">
              <div className="inline-block w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}</p>
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => {
                const product = order.order_items?.[0]?.product;
                const productName = product
                  ? i18n.language === 'ar'
                    ? product.name_ar
                    : product.name_en
                  : t('unknown_product');

                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700 transition-colors"
                  >
                    {/* Product Image */}
                    {product && (
                      <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 p-2">
                        <img
                          src={product.image_url}
                          alt={productName}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                        {productName}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(order.created_at)}
                      </p>
                    </div>

                    {/* Price & Status */}
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-gray-900 dark:text-white mb-2">
                        {formatPrice(order.total_amount)}
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-inbox-line text-3xl text-gray-400 dark:text-gray-500"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('dashboard.noOrders')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('dashboard.noOrdersDesc')}
              </p>
              <button
                onClick={() => navigate('/products')}
                className="inline-flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-shopping-bag-line mr-2"></i>
                {t('dashboard.browseProducts')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
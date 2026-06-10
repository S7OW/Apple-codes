import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { useCurrency } from '../../../hooks/useCurrency';

interface OrderData {
  id: string;
  total: number;
  payment_gateway_id: string;
  created_at: string;
  order_items: {
    product_id: string;
    code_id: string;
    price_paid: number;
    codes: {
      code: string;
    };
    products: {
      name_en: string;
      name_ar: string;
      image_url: string;
    };
  }[];
}

export default function PaymentSuccessPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { formatPrice } = useCurrency();
  
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    fetchOrderData();
  }, []);

  const fetchOrderData = async () => {
    try {
      const orderId = searchParams.get('order_id');
      const tapId = searchParams.get('tap_id');

      if (!orderId && !tapId) {
        console.error('No order ID or tap ID provided');
        setLoading(false);
        return;
      }

      let query = supabase
        .from('orders')
        .select(`
          id,
          total,
          payment_gateway_id,
          created_at,
          order_items (
            product_id,
            code_id,
            price_paid,
            codes (
              code
            ),
            products (
              name_en,
              name_ar,
              image_url
            )
          )
        `);

      if (orderId) {
        query = query.eq('id', orderId);
      } else if (tapId) {
        query = query.eq('payment_gateway_id', tapId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error fetching order:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setOrderData(data as OrderData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-700">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-error-warning-line text-4xl text-red-500 dark:text-red-400"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Order Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">We couldn&apos;t find your order. Please check your email or contact support.</p>
          <button
            onClick={() => navigate('/products')}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            {t('back_to_products')}
          </button>
        </div>
      </div>
    );
  }

  const product = orderData.order_items[0]?.products;
  const productName = i18n.language === 'ar' ? product?.name_ar : product?.name_en;
  const totalCodes = orderData.order_items.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <i className="ri-check-line text-5xl text-white"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">{t('payment_success_title')}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">{t('payment_success_desc')}</p>
        </div>

        {/* Code Delivery Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-6 mb-8">
            <img
              src={product?.image_url}
              alt={productName}
              className="w-24 h-24 rounded-xl object-cover"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{productName}</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {totalCodes === 1
                  ? (i18n.language === 'ar' ? 'كود واحد' : '1 code purchased')
                  : (i18n.language === 'ar' ? `${totalCodes} أكواد` : `${totalCodes} codes purchased`)}
              </p>
            </div>
          </div>

          {/* Codes Box Info */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-500 rounded-full flex-shrink-0">
                <i className="ri-inbox-line text-2xl text-white"></i>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                  {i18n.language === 'ar'
                    ? 'تم إضافة الأكواد إلى صندوقك!'
                    : 'Codes Added to Your Box!'}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {i18n.language === 'ar'
                    ? `تم تسليم ${totalCodes === 1 ? 'الكود' : `${totalCodes} أكواد`} إلى صندوق الأكواد الخاص بك في شريط التنقل.`
                    : `Your ${totalCodes === 1 ? 'code has' : `${totalCodes} codes have`} been delivered to your codes box in the navbar.`}
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
                >
                  <i className="ri-inbox-line text-lg"></i>
                  {i18n.language === 'ar' ? 'افتح صندوق الأكواد' : 'Open Codes Box'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('order_details')}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">{t('transaction_id')}</span>
              <code className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                {orderData.payment_gateway_id.substring(0, 20)}...
              </code>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">{t('amount_paid')}</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">{formatPrice(orderData.total)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">
                {i18n.language === 'ar' ? 'عدد الأكواد' : 'Number of codes'}
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">{totalCodes}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600 dark:text-gray-400">{t('purchase_date')}</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {new Date(orderData.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/dashboard/codes')}
            className="bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <i className="ri-file-list-3-line text-xl"></i>
            {t('view_my_codes')}
          </button>
          <button
            onClick={() => navigate('/products')}
            className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white py-4 rounded-xl font-medium hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <i className="ri-shopping-bag-line text-xl"></i>
            {t('back_to_products')}
          </button>
        </div>

        {/* Support Link */}
        <div className="text-center mt-8">
          <p className="text-gray-600 dark:text-gray-400 mb-2">{t('need_help')}</p>
          <button
            onClick={() => navigate('/contact')}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium inline-flex items-center gap-2"
          >
            {t('contact_support')}
            <i className="ri-arrow-right-line"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
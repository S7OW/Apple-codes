import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useCurrency } from '../../../hooks/useCurrency';

interface PurchasedCode {
  id: string;
  code: string;
  used_at: string;
  order_items: {
    price_paid: number;
  }[];
  product: {
    name_en: string;
    name_ar: string;
    image_url: string;
  };
}

export default function CodesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useStore();
  const { formatPrice } = useCurrency();
  const [codes, setCodes] = useState<PurchasedCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }

    fetchCodes();
  }, [user, navigate]);

  const fetchCodes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('codes')
        .select(`
          id,
          code,
          used_at,
          order_items!inner (
            price_paid
          ),
          product:products (
            name_en,
            name_ar,
            image_url
          )
        `)
        .eq('used_by', user.id)
        .order('used_at', { ascending: false });

      if (error) throw error;

      setCodes(data || []);
    } catch (error) {
      console.error('Error fetching codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = (codeId: string) => {
    setRevealedCodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(codeId)) {
        newSet.delete(codeId);
      } else {
        newSet.add(codeId);
      }
      return newSet;
    });
  };

  const copyCode = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const maskCode = (code: string) => {
    if (code.length <= 4) return '****';
    return code.slice(0, 2) + '*'.repeat(code.length - 4) + code.slice(-2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 mb-4 cursor-pointer"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            {t('dashboard.backToDashboard')}
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('dashboard.myCodes')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('dashboard.myCodesDesc')}
              </p>
            </div>
            <div className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold">
              {codes.length} {codes.length === 1 ? t('code_singular') : t('codes_plural')}
            </div>
          </div>
        </div>

        {codes.length === 0 ? (
          <>
            {/* Empty State */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12">
              <div className="text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-key-line text-4xl text-teal-600 dark:text-teal-400"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {t('dashboard.noCodesYet')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  {t('dashboard.noCodesDesc')}
                </p>
                <button
                  onClick={() => navigate('/products')}
                  className="inline-flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-shopping-bag-line mr-2"></i>
                  {t('dashboard.browseProducts')}
                </button>
              </div>
            </div>

            {/* How to Redeem Info */}
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-lightbulb-line text-2xl text-white"></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-3 text-lg">
                    {t('how_to_redeem_title')}
                  </h4>
                  <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
                      <span>{t('redeem_step_1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
                      <span>{t('redeem_step_2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
                      <span>{t('redeem_step_3')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">4.</span>
                      <span>{t('redeem_step_4')}</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Codes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {codes.map((item) => {
                const isRevealed = revealedCodes.has(item.id);
                const isCopied = copiedCode === item.id;
                const productName = i18n.language === 'ar' ? item.product.name_ar : item.product.name_en;
                const pricePaid = item.order_items?.[0]?.price_paid || 0;

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:border-teal-300 dark:hover:border-teal-700 transition-all"
                  >
                    {/* Product Image */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
                      <img
                        src={item.product.image_url}
                        alt={productName}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 bg-teal-600 text-white text-xs font-bold rounded-full">
                        {formatPrice(pricePaid)}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-lg">
                        {productName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <i className="ri-calendar-line mr-1"></i>
                        {formatDate(item.used_at)}
                      </p>

                      {/* Code Display */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            {t('code_label')}
                          </span>
                          <button
                            onClick={() => toggleReveal(item.id)}
                            className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium cursor-pointer whitespace-nowrap"
                          >
                            <i className={`ri-${isRevealed ? 'eye-off' : 'eye'}-line`}></i>
                            {isRevealed ? t('hide_code') : t('reveal_code')}
                          </button>
                        </div>
                        <div className={`font-mono text-lg font-bold text-gray-900 dark:text-white break-all transition-all ${
                          isRevealed ? '' : 'blur-sm select-none'
                        }`}>
                          {isRevealed ? item.code : maskCode(item.code)}
                        </div>
                      </div>

                      {/* Copy Button */}
                      <button
                        onClick={() => copyCode(item.code, item.id)}
                        disabled={!isRevealed}
                        className={`w-full py-3 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 ${
                          isCopied
                            ? 'bg-green-600 text-white'
                            : isRevealed
                            ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <i className={`ri-${isCopied ? 'check' : 'file-copy'}-line`}></i>
                        {isCopied ? t('code_copied') : t('copy_code')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* How to Redeem Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-lightbulb-line text-2xl text-white"></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-3 text-lg">
                    {t('how_to_redeem_title')}
                  </h4>
                  <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-400 mb-4">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
                      <span>{t('redeem_step_1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
                      <span>{t('redeem_step_2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
                      <span>{t('redeem_step_3')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">4.</span>
                      <span>{t('redeem_step_4')}</span>
                    </li>
                  </ol>
                  <button
                    onClick={() => navigate('/contact')}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-customer-service-line"></i>
                    {t('contact_support')}
                    <i className="ri-arrow-right-line"></i>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
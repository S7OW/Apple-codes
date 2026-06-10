import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PaymentCancelPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const productId = searchParams.get('product_id');

  const handleTryAgain = () => {
    if (productId) {
      navigate(`/products?retry=${productId}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Cancel Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <i className="ri-close-line text-5xl text-white"></i>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">{t('payment_cancelled_title')}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">{t('payment_cancelled_desc')}</p>
        </div>

        {/* Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-4 mb-8 pb-8 border-b border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-shield-check-line text-2xl text-green-600 dark:text-green-400"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('no_charges_made')}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your payment method was not charged. You can safely try again or browse other products.
              </p>
            </div>
          </div>

          {/* What Happened Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('what_happened')}</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <i className="ri-information-line text-xl text-gray-600 dark:text-gray-400 mt-1"></i>
                <p className="text-gray-700 dark:text-gray-300">{t('cancel_reason')}</p>
              </div>
            </div>
          </div>

          {/* Common Reasons */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Common Reasons</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <i className="ri-checkbox-circle-line text-xl text-gray-400 dark:text-gray-500 mt-0.5"></i>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Changed your mind about the purchase</p>
              </div>
              <div className="flex items-start gap-3">
                <i className="ri-checkbox-circle-line text-xl text-gray-400 dark:text-gray-500 mt-0.5"></i>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Wanted to review the order details again</p>
              </div>
              <div className="flex items-start gap-3">
                <i className="ri-checkbox-circle-line text-xl text-gray-400 dark:text-gray-500 mt-0.5"></i>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Encountered an issue during checkout</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleTryAgain}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-lg"
          >
            <i className="ri-refresh-line text-xl"></i>
            {t('try_again')}
          </button>
          <button
            onClick={() => navigate('/products')}
            className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white py-4 rounded-xl font-medium hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <i className="ri-shopping-bag-line text-xl"></i>
            {t('back_to_products')}
          </button>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <i className="ri-dashboard-line text-xl"></i>
          {t('go_to_dashboard')}
        </button>

        {/* Support Section */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-customer-service-2-line text-2xl text-gray-700 dark:text-gray-300"></i>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('questions')}</h3>
              <p className="text-gray-700 dark:text-gray-400 text-sm mb-4">
                Our support team is here to help you complete your purchase or answer any questions.
              </p>
              <button
                onClick={() => navigate('/contact')}
                className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors inline-flex items-center gap-2 whitespace-nowrap"
              >
                {t('contact_support')}
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
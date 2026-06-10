import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../store/useStore';
import { useNavigate } from 'react-router-dom';

// Mock products data to match favorites
const allProducts = [
  {
    id: '1',
    name_en: 'iTunes Gift Card $10',
    name_ar: 'بطاقة هدايا iTunes بقيمة 10 دولار',
    price: 10,
    image_url: 'https://readdy.ai/api/search-image?query=modern%20minimalist%20iTunes%20gift%20card%20with%20clean%20white%20background%20and%20vibrant%20colors%20professional%20product%20photography%20studio%20lighting%20high%20quality%20ecommerce%20style&width=400&height=400&seq=itunes10&orientation=squarish',
  },
  {
    id: '2',
    name_en: 'iTunes Gift Card $25',
    name_ar: 'بطاقة هدايا iTunes بقيمة 25 دولار',
    price: 25,
    image_url: 'https://readdy.ai/api/search-image?query=elegant%20iTunes%20gift%20card%2025%20dollars%20with%20pristine%20white%20background%20modern%20design%20professional%20product%20shot%20studio%20quality%20ecommerce%20photography&width=400&height=400&seq=itunes25&orientation=squarish',
  },
  {
    id: '3',
    name_en: 'iTunes Gift Card $50',
    name_ar: 'بطاقة هدايا iTunes بقيمة 50 دولار',
    price: 50,
    image_url: 'https://readdy.ai/api/search-image?query=premium%20iTunes%20gift%20card%2050%20dollars%20clean%20white%20background%20sleek%20modern%20design%20professional%20ecommerce%20product%20photography%20high%20end%20studio%20lighting&width=400&height=400&seq=itunes50&orientation=squarish',
  },
  {
    id: '4',
    name_en: 'iTunes Gift Card $100',
    name_ar: 'بطاقة هدايا iTunes بقيمة 100 دولار',
    price: 100,
    image_url: 'https://readdy.ai/api/search-image?query=luxury%20iTunes%20gift%20card%20100%20dollars%20pristine%20white%20background%20sophisticated%20design%20professional%20product%20photography%20premium%20ecommerce%20style%20studio%20quality&width=400&height=400&seq=itunes100&orientation=squarish',
  },
  {
    id: '5',
    name_en: 'App Store & iTunes Gift Card $15',
    name_ar: 'بطاقة هدايا App Store و iTunes بقيمة 15 دولار',
    price: 15,
    image_url: 'https://readdy.ai/api/search-image?query=modern%20App%20Store%20iTunes%20combo%20gift%20card%2015%20dollars%20clean%20white%20background%20vibrant%20colors%20professional%20product%20shot%20ecommerce%20photography%20studio%20lighting&width=400&height=400&seq=appstore15&orientation=squarish',
  },
  {
    id: '6',
    name_en: 'App Store & iTunes Gift Card $30',
    name_ar: 'بطاقة هدايا App Store و iTunes بقيمة 30 دولار',
    price: 30,
    image_url: 'https://readdy.ai/api/search-image?query=sleek%20App%20Store%20iTunes%20gift%20card%2030%20dollars%20pristine%20white%20background%20contemporary%20design%20professional%20ecommerce%20product%20photography%20high%20quality%20studio&width=400&height=400&seq=appstore30&orientation=squarish',
  },
];

export default function FavoritesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, favorites, removeFromFavorites } = useStore();

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const favoriteProducts = allProducts.filter((product) =>
    favorites.includes(product.id)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 mb-4"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            {t('dashboard.backToDashboard')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard.favorites')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {favoriteProducts.length} {t('dashboard.savedProducts')}
          </p>
        </div>

        {/* Favorites Grid */}
        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                  <img
                    src={product.image_url}
                    alt={i18n.language === 'ar' ? product.name_ar : product.name_en}
                    className="w-full h-full object-cover object-top"
                  />
                  <button
                    onClick={() => removeFromFavorites(product.id)}
                    className="absolute top-3 right-3 w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <i className="ri-heart-fill text-xl text-pink-600 dark:text-pink-400"></i>
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {i18n.language === 'ar' ? product.name_ar : product.name_en}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
                      ${product.price}
                    </span>
                    <button
                      onClick={() => navigate('/products')}
                      className="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
                    >
                      {t('common:buy_now')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-heart-line text-4xl text-pink-600 dark:text-pink-400"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {t('dashboard.noFavorites')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {t('dashboard.noFavoritesDesc')}
              </p>
              <button
                onClick={() => navigate('/products')}
                className="inline-flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                <i className="ri-shopping-bag-line mr-2"></i>
                {t('dashboard.browseProducts')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
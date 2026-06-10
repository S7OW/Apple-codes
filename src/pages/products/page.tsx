import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { useCurrency } from '../../hooks/useCurrency';
import Card from '../../components/base/Card';
import CheckoutModal from '../../components/feature/CheckoutModal';

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  image_url: string;
  stock: number;
}

export default function ProductsPage() {
  const { t } = useTranslation();
  const { language, favorites, addToFavorites, removeFromFavorites } = useStore();
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsData) {
        // For each product, count available (unused) codes from the codes table
        const productsWithStock = await Promise.all(
          productsData.map(async (product) => {
            const { count } = await supabase
              .from('codes')
              .select('*', { count: 'exact', head: true })
              .eq('product_id', product.id)
              .eq('is_used', false);
            return { ...product, stock: count ?? 0 };
          })
        );
        setProducts(productsWithStock);
      }
    } catch {
      // Supabase not connected
    }
    setLoading(false);
  };

  const toggleFavorite = (productId: string) => {
    if (favorites.includes(productId)) {
      removeFromFavorites(productId);
    } else {
      addToFavorites(productId);
    }
  };

  const handleBuyNow = async (product: Product) => {
    setError(null);

    // Check stock
    if (product.stock === 0) {
      setError(t('common:out_of_stock'));
      return;
    }

    // Open checkout modal
    setCheckoutProduct(product);
    setIsCheckoutOpen(true);
  };

  const handleProceedToPayment = async (product: Product, quantity: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please sign in first');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
      const session = await supabase.auth.getSession();
      const authToken = session.data.session?.access_token;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: product.id,
          userId: user.id,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      window.location.href = data.redirect_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      throw err;
    }
  };

  const filteredProducts = products.filter((product) => {
    const name = language === 'ar' ? product.name_ar : product.name_en;
    const description = language === 'ar' ? product.description_ar : product.description_en;
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 dark:text-white">{t('common:products')}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">{t('common:browse_collection')}</p>

          <div className="relative max-w-md">
            <input
              type="text"
              placeholder={t('common:search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg"></i>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
              <i className="ri-error-warning-line text-red-600 dark:text-red-400 text-xl"></i>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg mb-4"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-6 rounded mb-2"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <i className="ri-inbox-line text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('common:no_products_found')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-product-shop>
            {filteredProducts.map((product) => (
              <Card key={product.id} hover className="overflow-hidden">
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={language === 'ar' ? product.name_ar : product.name_en}
                    className="w-full h-full object-cover object-top"
                  />
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                  >
                    <i className={`${favorites.includes(product.id) ? 'ri-heart-fill text-red-500' : 'ri-heart-line dark:text-white'} text-xl`}></i>
                  </button>
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
                        {t('common:out_of_stock')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 dark:text-white">
                    {language === 'ar' ? product.name_ar : product.name_en}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {language === 'ar' ? product.description_ar : product.description_en}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold dark:text-white">
                      {formatPrice(product.price)}
                    </span>
                    <span className={`text-sm ${product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {product.stock > 0 ? `${product.stock} ${t('common:in_stock')}` : t('common:out_of_stock')}
                    </span>
                  </div>
                  <button
                    onClick={() => handleBuyNow(product)}
                    disabled={product.stock === 0}
                    className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                  >
                    {t('common:buy_now')}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CheckoutModal
        product={checkoutProduct}
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setCheckoutProduct(null);
        }}
        onProceedToPayment={handleProceedToPayment}
      />
    </div>
  );
}
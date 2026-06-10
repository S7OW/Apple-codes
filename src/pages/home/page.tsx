import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { useCurrency } from '../../hooks/useCurrency';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
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

export default function HomePage() {
  const { t } = useTranslation('common');
  const { language, favorites, addToFavorites, removeFromFavorites } = useStore();
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSlide, setReviewSlide] = useState(0);
  const reviewTrackRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const dragCurrentX = useRef<number>(0);
  const isDragging = useRef(false);

  const reviewsPerView = 3;
  const maxSlide = Math.max(0, reviews.length - reviewsPerView);

  const goToSlide = (index: number) => {
    setReviewSlide(Math.max(0, Math.min(index, maxSlide)));
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    dragStartX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current || dragStartX.current === null) return;
    dragCurrentX.current = ('touches' in e ? e.touches[0].clientX : e.clientX) - dragStartX.current;
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragCurrentX.current < -60) goToSlide(reviewSlide + 1);
    else if (dragCurrentX.current > 60) goToSlide(reviewSlide - 1);
    dragStartX.current = null;
    dragCurrentX.current = 0;
  };

  useEffect(() => {
    fetchProducts();
    fetchReviews();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (data) {
        const productsWithStock = await Promise.all(
          data.map(async (product) => {
            const { count } = await supabase
              .from('codes')
              .select('*', { count: 'exact', head: true })
              .eq('product_id', product.id)
              .eq('is_used', false);
            return { ...product, stock: count ?? 0 };
          })
        );
        // Only show products that have at least 1 available code
        setProducts(productsWithStock.filter((p) => p.stock > 0));
      }
    } catch {
      // Supabase not connected
    }
    setLoading(false);
  };

  const fetchReviews = async () => {
    try {
      const { data } = await supabase
        .from('public_reviews')
        .select('id, full_name, rating, comment, created_at')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(12);
      if (data) setReviews(data);
    } catch {
      // Supabase not connected
    }
  };

  const toggleFavorite = (productId: string) => {
    if (favorites.includes(productId)) {
      removeFromFavorites(productId);
    } else {
      addToFavorites(productId);
    }
  };

  const handleBuyNow = async (product: Product) => {
    // Check stock only — no sign-in required
    if (product.stock === 0) {
      return;
    }

    // Open checkout modal
    setCheckoutProduct(product);
    setIsCheckoutOpen(true);
  };

  const handleProceedToPayment = async (product: Product, guestEmail: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

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
          userId: user?.id || null,
          guestEmail: user ? null : guestEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      window.location.href = data.redirect_url;
    } catch (err) {
      console.error('Payment error:', err);
      throw err;
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReviewError('');

    if (reviewRating === 0) {
      setReviewError(language === 'ar' ? 'يرجى اختيار تقييم بالنجوم' : 'Please select a star rating.');
      return;
    }
    if (reviewComment.trim().length < 5) {
      setReviewError(language === 'ar' ? 'يرجى كتابة تعليق' : 'Please write a comment.');
      return;
    }
    if (reviewComment.length > 500) {
      setReviewError(language === 'ar' ? 'التعليق يجب أن لا يتجاوز 500 حرف' : 'Comment must be 500 characters or less.');
      return;
    }

    setReviewSubmitting(true);

    try {
      const { error } = await supabase
        .from('public_reviews')
        .insert({
          full_name: reviewName.trim() || 'Customer',
          rating: reviewRating,
          comment: reviewComment.trim(),
        });

      if (error) throw error;

      setReviewSubmitted(true);
      setReviewRating(0);
      setReviewComment('');
      setReviewName('');
      setReviewEmail('');
    } catch {
      setReviewError(language === 'ar' ? 'حدث خطأ، يرجى المحاولة مرة أخرى' : 'Something went wrong. Please try again.');
    }

    setReviewSubmitting(false);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://readdy.ai/api/search-image?query=modern%20minimalist%20abstract%20gradient%20background%20with%20soft%20flowing%20shapes%20in%20warm%20tones%20of%20coral%20pink%20and%20cream%2C%20clean%20professional%20design%20with%20subtle%20geometric%20patterns%2C%20high-end%20digital%20technology%20aesthetic%2C%20ultra%20smooth%20gradients%2C%20contemporary%20art%20style%2C%20premium%20quality%2C%208k%20resolution&width=1920&height=1080&seq=hero-bg-001&orientation=landscape"
            alt="Hero Background"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40"></div>
        </div>

        <div className="relative z-10 text-center text-white px-4 w-full max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            {t('hero_title')}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            {t('hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="min-w-[200px]">
                {t('nav_products')}
              </Button>
            </Link>
            <Link to="/guide">
              <Button
                size="lg"
                variant="outline"
                className="min-w-[200px] border-white text-white hover:bg-white hover:!text-black"
              >
                {t('how_to_use')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 dark:text-white">{t('products')}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t('browse_collection')}
            </p>
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-product-shop>
              {products.map((product) => (
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
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {product.stock} {t('in_stock')}
                      </span>
                    </div>
                    <Button
                      fullWidth
                      disabled={product.stock === 0}
                      onClick={() => handleBuyNow(product)}
                    >
                      {t('buy_now')}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/products">
              <Button size="lg" variant="outline">
                {t('view_all_products')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 dark:text-white">
              {t('how_it_works')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t('get_code_steps')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 bg-black dark:bg-white text-white dark:text-black rounded-full mx-auto mb-6 text-3xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">{t('choose_code')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('choose_code_desc')}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 bg-black dark:bg-white text-white dark:text-black rounded-full mx-auto mb-6 text-3xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">{t('secure_payment')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('secure_payment_desc')}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 bg-black dark:bg-white text-white dark:text-black rounded-full mx-auto mb-6 text-3xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-3 dark:text-white">{t('instant_delivery')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('instant_delivery_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews & Submission Section - Combined */}
      <section className="py-20 px-4 bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Customer Reviews Carousel */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">{t('reviews')}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {t('what_customers_say')}
              </p>
            </div>

            {reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-20 h-20 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <i className="ri-chat-smile-3-line text-4xl text-gray-400 dark:text-white/60"></i>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">No reviews yet</h3>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">Be the first to share your experience!</p>
                <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                  <i className="ri-arrow-down-line animate-bounce"></i>
                  <span>Leave a review below</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                {reviewSlide > 0 && (
                  <button
                    onClick={() => goToSlide(reviewSlide - 1)}
                    className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-white/20 hover:scale-105 transition-all cursor-pointer"
                  >
                    <i className="ri-arrow-left-s-line text-xl text-gray-700 dark:text-white"></i>
                  </button>
                )}

                <div
                  className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={handleDragStart}
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchStart={handleDragStart}
                  onTouchMove={handleDragMove}
                  onTouchEnd={handleDragEnd}
                >
                  <div
                    ref={reviewTrackRef}
                    className="flex transition-transform duration-500 ease-in-out gap-6"
                    style={{ transform: `translateX(calc(-${reviewSlide * (100 / reviewsPerView)}% - ${reviewSlide * (24 / reviewsPerView)}px))` }}
                  >
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="flex-shrink-0 w-[calc(33.333%-16px)] bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm hover:shadow-md dark:hover:bg-white/15 transition-all"
                      >
                        <div className="flex items-center mb-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-white/20 text-gray-600 dark:text-white rounded-full mr-4 flex-shrink-0">
                            <i className="ri-user-line text-xl"></i>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{review.full_name || 'Customer'}</p>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <i key={i} className={`ri-star-${i < review.rating ? 'fill' : 'line'} text-yellow-400 text-sm`}></i>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 leading-relaxed line-clamp-4">{review.comment}</p>
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                          <i className="ri-checkbox-circle-fill"></i>
                          {t('verified_purchase')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {reviewSlide < maxSlide && (
                  <button
                    onClick={() => goToSlide(reviewSlide + 1)}
                    className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-white/20 hover:scale-105 transition-all cursor-pointer"
                  >
                    <i className="ri-arrow-right-s-line text-xl text-gray-700 dark:text-white"></i>
                  </button>
                )}

                {reviews.length > reviewsPerView && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {Array.from({ length: maxSlide + 1 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goToSlide(i)}
                        className={`transition-all cursor-pointer rounded-full ${
                          i === reviewSlide
                            ? 'w-6 h-2.5 bg-gray-800 dark:bg-white'
                            : 'w-2.5 h-2.5 bg-gray-300 dark:bg-white/30 hover:bg-gray-400 dark:hover:bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Share Your Review Form */}
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">
                {t('share_review')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {t('share_review_subtitle')}
              </p>
            </div>

            {reviewSubmitted ? (
              <div className="text-center py-12">
                <div className="flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mx-auto mb-6">
                  <i className="ri-check-line text-4xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                  {t('thank_you')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('review_submitted')}
                </p>
                <button
                  onClick={() => setReviewSubmitted(false)}
                  className="mt-6 text-sm text-gray-400 underline cursor-pointer hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  {t('submit_another')}
                </button>
              </div>
            ) : (
              <form
                data-readdy-form
                id="customer-review-form"
                onSubmit={handleReviewSubmit}
                className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 backdrop-blur-sm rounded-2xl p-8 space-y-6 shadow-sm"
              >
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-800 dark:text-white">
                    {t('your_rating')} <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHover(star)}
                        onMouseLeave={() => setReviewHover(0)}
                        className="flex items-center justify-center w-10 h-10 cursor-pointer transition-transform hover:scale-110"
                      >
                        <i
                          className={`ri-star-${(reviewHover || reviewRating) >= star ? 'fill' : 'line'} text-3xl ${
                            (reviewHover || reviewRating) >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-500'
                          }`}
                        ></i>
                      </button>
                    ))}
                    {reviewRating > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-300 ml-2">
                        {['', '★ Poor', '★★ Fair', '★★★ Good', '★★★★ Great', '★★★★★ Excellent'][reviewRating]}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-white">
                    {t('full_name')} <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder={t('full_name')}
                    className="w-full bg-gray-50 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-gray-500 dark:focus:border-white/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-white">
                    {t('your_comment')} <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <textarea
                    name="comment"
                    required
                    rows={4}
                    maxLength={500}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={t('share_experience')}
                    className="w-full bg-gray-50 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-gray-500 dark:focus:border-white/50 transition-colors resize-none"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{reviewComment.length}/500</p>
                </div>

                {reviewError && (
                  <p className="text-red-500 dark:text-red-400 text-sm flex items-center gap-2">
                    <i className="ri-error-warning-line"></i>
                    {reviewError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold py-4 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-base"
                >
                  {reviewSubmitting ? t('submitting') : t('submit_review')}
                </button>

                <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                  {language === 'ar'
                    ? 'شكراً لمشاركتك تجربتك معنا'
                    : 'Thank you for sharing your experience with us'}
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

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
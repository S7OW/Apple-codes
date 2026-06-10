import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../hooks/useCurrency';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabase';

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

interface CheckoutModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProceedToPayment: (product: Product, quantity: number) => void;
}

export default function CheckoutModal({
  product,
  isOpen,
  onClose,
  onProceedToPayment,
}: CheckoutModalProps) {
  const { t } = useTranslation('common');
  const { language, darkMode } = useStore();
  const { formatPrice } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      supabase.auth.getUser().then(({ data: { user } }) => {
        setIsLoggedIn(!!user);
      });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) onClose();
    },
    [isProcessing, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !product) return null;

  const productName = language === 'ar' ? product.name_ar : product.name_en;
  const productDescription = language === 'ar' ? product.description_ar : product.description_en;
  const maxQty = product.stock;
  const total = product.price * quantity;

  const decreaseQty = () => setQuantity((q) => Math.max(1, q - 1));
  const increaseQty = () => setQuantity((q) => Math.min(maxQty, q + 1));

  const handleProceed = async () => {
    if (!isLoggedIn) return;
    setIsProcessing(true);
    try {
      await onProceedToPayment(product, quantity);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isDark = darkMode;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        backgroundColor: isDark ? 'rgba(0,0,0,0.80)' : 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderRadius: '16px',
          boxShadow: isDark
            ? '0 32px 80px rgba(0,0,0,0.6)'
            : '0 32px 80px rgba(0,0,0,0.35)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
            color: isDark ? '#d1d5db' : '#6b7280',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background 0.2s',
          }}
        >
          <i className="ri-close-line text-xl"></i>
        </button>

        {/* Header */}
        <div
          style={{
            padding: '24px 24px 16px',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: isDark ? '#f9fafb' : '#111827', margin: 0 }}>
            {t('checkout')}
          </h2>
          <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '0.875rem', marginTop: '2px' }}>
            {t('review_order')}
          </p>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

          {/* Product Details */}
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flexShrink: 0, width: '96px', height: '96px', overflow: 'hidden', borderRadius: '12px', backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                <img
                  src={product.image_url}
                  alt={productName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: isDark ? '#f9fafb' : '#111827', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {productName}
                </h3>
                <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '0.875rem', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {productDescription}
                </p>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: isDark ? '#f9fafb' : '#111827' }}>
                  {formatPrice(product.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div style={{ padding: '0 24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: isDark ? '#d1d5db' : '#4b5563' }}>
                {language === 'ar' ? 'الكمية:' : 'Quantity:'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={decreaseQty}
                  disabled={quantity <= 1}
                  style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', color: isDark ? '#d1d5db' : '#374151', border: 'none', cursor: quantity <= 1 ? 'not-allowed' : 'pointer', opacity: quantity <= 1 ? 0.4 : 1, transition: 'background 0.2s' }}
                >
                  <i className="ri-subtract-line text-base"></i>
                </button>
                <span style={{ width: '40px', textAlign: 'center', fontSize: '1rem', fontWeight: 700, color: isDark ? '#f9fafb' : '#111827', userSelect: 'none' }}>
                  {quantity}
                </span>
                <button
                  onClick={increaseQty}
                  disabled={quantity >= maxQty}
                  style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', color: isDark ? '#d1d5db' : '#374151', border: 'none', cursor: quantity >= maxQty ? 'not-allowed' : 'pointer', opacity: quantity >= maxQty ? 0.4 : 1, transition: 'background 0.2s' }}
                >
                  <i className="ri-add-line text-base"></i>
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: isDark ? '#6b7280' : '#9ca3af' }}>
                {language === 'ar' ? `متاح: ${maxQty}` : `${maxQty} available`}
              </span>
            </div>
          </div>

          {/* Code Delivery Info */}
          <div style={{ padding: '0 24px 16px' }}>
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4', border: isDark ? '1px solid rgba(16,185,129,0.3)' : '1px solid #bbf7d0', borderRadius: '12px' }}>
                <i className="ri-checkbox-circle-fill text-xl flex-shrink-0" style={{ color: '#16a34a' }}></i>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: isDark ? '#6ee7b7' : '#166534' }}>
                    {language === 'ar' ? 'سيتم إرسال الكود إلى صندوق الأكواد الخاص بك' : 'Code(s) will be delivered to your codes box'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: isDark ? '#34d399' : '#15803d', marginTop: '2px' }}>
                    {language === 'ar' ? 'يمكنك الوصول إليه من شريط التنقل' : 'Access it from the navbar after payment'}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', border: isDark ? '1px solid rgba(245,158,11,0.3)' : '1px solid #fde68a', borderRadius: '12px' }}>
                <i className="ri-error-warning-fill text-xl flex-shrink-0" style={{ color: '#d97706', marginTop: '2px' }}></i>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: isDark ? '#fcd34d' : '#92400e', marginBottom: '4px' }}>
                    {language === 'ar' ? 'يجب تسجيل الدخول لشراء الأكواد' : 'Sign in required to purchase codes'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: isDark ? '#fbbf24' : '#b45309', marginBottom: '12px' }}>
                    {language === 'ar'
                      ? 'سيتم تسليم الأكواد إلى صندوق الأكواد الخاص بك. يرجى تسجيل الدخول أولاً.'
                      : 'Codes are delivered to your codes box. Please sign in first to continue.'}
                  </p>
                  <a
                    href="/auth/signin"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: isDark ? '#f9fafb' : '#111827', color: isDark ? '#111827' : '#ffffff', fontSize: '0.875rem', fontWeight: 600, borderRadius: '8px', textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    <i className="ri-login-box-line"></i>
                    {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div style={{ margin: '0 16px 16px', padding: '20px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', borderRadius: '12px', border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: isDark ? '#f9fafb' : '#111827', marginBottom: '12px' }}>
              {t('order_summary')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#4b5563' }}>
                <span>{formatPrice(product.price)} × {quantity}</span>
                <span style={{ fontWeight: 500 }}>{formatPrice(product.price * quantity)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#4b5563' }}>
                <span>{t('delivery')}</span>
                <span style={{ fontWeight: 500, color: '#16a34a' }}>{t('instant_digital')}</span>
              </div>
              {quantity > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: isDark ? '#6b7280' : '#9ca3af' }}>
                  <span>{language === 'ar' ? 'عدد الأكواد' : 'Number of codes'}</span>
                  <span style={{ fontWeight: 600, color: isDark ? '#d1d5db' : '#374151' }}>
                    {quantity} {language === 'ar' ? 'كود' : 'codes'}
                  </span>
                </div>
              )}
              <div style={{ paddingTop: '12px', borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: isDark ? '#f9fafb' : '#111827' }}>{t('total')}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: isDark ? '#f9fafb' : '#111827' }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div style={{ padding: '0 24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: isDark ? '#6b7280' : '#9ca3af' }}>
              <i className="ri-secure-payment-line text-base"></i>
              <span>{t('secure_payment')} — {t('payment_methods_supported')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
            display: 'flex',
            gap: '12px',
            flexShrink: 0,
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderRadius: '0 0 16px 16px',
          }}
        >
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #d1d5db',
              backgroundColor: 'transparent',
              color: isDark ? '#d1d5db' : '#374151',
              fontWeight: 600,
              borderRadius: '8px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.5 : 1,
              whiteSpace: 'nowrap',
              fontSize: '0.875rem',
              transition: 'background 0.2s',
            }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleProceed}
            disabled={isProcessing || !isLoggedIn}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: isDark ? '#f9fafb' : '#111827',
              color: isDark ? '#111827' : '#ffffff',
              fontWeight: 600,
              borderRadius: '8px',
              cursor: isProcessing || !isLoggedIn ? 'not-allowed' : 'pointer',
              opacity: isProcessing || !isLoggedIn ? 0.5 : 1,
              whiteSpace: 'nowrap',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: 'none',
              transition: 'opacity 0.2s',
            }}
          >
            {isProcessing ? (
              <>
                <i className="ri-loader-4-line animate-spin text-base"></i>
                {t('processing')}
              </>
            ) : (
              <>
                <i className="ri-lock-line text-base"></i>
                {t('proceed_to_payment')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

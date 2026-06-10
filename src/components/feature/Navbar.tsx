import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabase';
import { bawabahAuth } from '../../lib/bawabah';

interface PurchasedCode {
  id: string;
  code: string;
  used_at: string;
  product: {
    name_en: string;
    name_ar: string;
  };
}

function CodesBoxIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  );
}

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, language, setLanguage, darkMode, toggleDarkMode } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCodesOpen, setIsCodesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [codes, setCodes] = useState<PurchasedCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const codesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (codesRef.current && !codesRef.current.contains(e.target as Node)) {
        setIsCodesOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    // Check for Bawabah session first
    const bawabahSession = bawabahAuth.getSession();
    if (bawabahSession?.user) {
      setUser({
        id: bawabahSession.user.id,
        email: bawabahSession.user.email,
        full_name: bawabahSession.user.full_name || '',
      });
    }

    // Then check Supabase session
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user && !bawabahSession) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name,
          });
        }
      }).catch(() => {});

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name,
          });
        } else if (!bawabahAuth.getSession()) {
          setUser(null);
          setCodes([]);
        }
      });
      unsubscribe = () => subscription.unsubscribe();
    } catch {
      // Supabase not connected yet
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [setUser]);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, i18n]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto-refresh codes when returning from payment success page
  useEffect(() => {
    if (user && location.pathname === '/payment/success') {
      fetchCodes();
    }
  }, [location.pathname, user]);

  const fetchCodes = async () => {
    if (!user) return;
    try {
      setCodesLoading(true);
      const { data } = await supabase
        .from('codes')
        .select(`
          id,
          code,
          used_at,
          product:products (
            name_en,
            name_ar
          )
        `)
        .eq('used_by', user.id)
        .order('used_at', { ascending: false })
        .limit(5);
      setCodes(data || []);
    } catch {
      setCodes([]);
    } finally {
      setCodesLoading(false);
    }
  };

  const handleCodesToggle = () => {
    const next = !isCodesOpen;
    setIsCodesOpen(next);
    setIsUserMenuOpen(false);
    if (next && user) {
      fetchCodes();
    }
  };

  const toggleReveal = (codeId: string) => {
    setRevealedCodes((prev) => {
      const s = new Set(prev);
      s.has(codeId) ? s.delete(codeId) : s.add(codeId);
      return s;
    });
  };

  const copyCode = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch { /* ignore */ }
  };

  const maskCode = (code: string) => {
    if (code.length <= 4) return '****';
    return code.slice(0, 2) + '*'.repeat(Math.max(code.length - 4, 2)) + code.slice(-2);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleSignOut = async () => {
    // Sign out from both Bawabah and Supabase
    bawabahAuth.signOut();
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user) return '';
    if (user.full_name) {
      const parts = user.full_name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0][0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/80 dark:bg-gray-900/85 backdrop-blur-md shadow-sm dark:shadow-gray-800/50 border-b border-white/20 dark:border-gray-700/40'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 dark:text-white">
            <i className="ri-apple-fill text-2xl"></i>
            <span className="text-xl font-bold">Apple+ Codes</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400 transition-colors">
              {t('common:nav_home')}
            </Link>
            <Link to="/products" className="text-sm font-medium hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400 transition-colors">
              {t('common:nav_products')}
            </Link>
            <Link to="/guide" className="text-sm font-medium hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400 transition-colors">
              {t('common:nav_guide')}
            </Link>
            <Link to="/contact" className="text-sm font-medium hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400 transition-colors">
              {t('common:nav_contact')}
            </Link>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
              aria-label="Toggle Dark Mode"
            >
              <i className={`ri-${darkMode ? 'sun' : 'moon'}-line text-xl dark:text-white`}></i>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
              aria-label="Switch Language"
            >
              <i className="ri-translate-2 text-xl dark:text-white"></i>
            </button>

            {/* My Codes Box */}
            <div className="relative" ref={codesRef}>
              <button
                onClick={handleCodesToggle}
                className="relative flex items-center justify-center w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
                aria-label="My Codes"
              >
                <CodesBoxIcon className="w-5 h-5 dark:text-white" />
                {user && codes.length > 0 && (
                  <span className="absolute -top-1 -end-1 bg-teal-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold leading-none">
                    {codes.length}
                  </span>
                )}
              </button>

              {isCodesOpen && (
                <div className="absolute end-0 mt-2 w-[480px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 flex items-center justify-center bg-teal-100 dark:bg-teal-900/40 rounded-lg">
                        <i className="ri-key-2-line text-teal-600 dark:text-teal-400 text-base"></i>
                      </div>
                      <div>
                        <span className="text-sm font-bold dark:text-white">{t('common:my_codes')}</span>
                        {user && codes.length > 0 && (
                          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{codes.length} code{codes.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <Link
                      to="/dashboard/codes"
                      onClick={() => setIsCodesOpen(false)}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold whitespace-nowrap cursor-pointer flex items-center gap-1"
                    >
                      {t('common:view_my_codes')}
                      <i className="ri-arrow-right-line text-sm"></i>
                    </Link>
                  </div>

                  {/* Body */}
                  {!user ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <i className="ri-lock-line text-3xl text-gray-400"></i>
                      </div>
                      <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">Sign in to view your codes</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">Your purchased codes will appear here</p>
                      <Link
                        to="/auth/signin"
                        onClick={() => setIsCodesOpen(false)}
                        className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-xl hover:opacity-80 transition-opacity whitespace-nowrap cursor-pointer"
                      >
                        Sign In
                      </Link>
                    </div>
                  ) : codesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : codes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                      <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-4">
                        <i className="ri-key-line text-3xl text-teal-500"></i>
                      </div>
                      <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">No codes yet</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">Purchase a product to get your codes</p>
                      <Link
                        to="/products"
                        onClick={() => setIsCodesOpen(false)}
                        className="px-6 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                      {codes.map((item) => {
                        const isRevealed = revealedCodes.has(item.id);
                        const isCopied = copiedCode === item.id;
                        const productName = i18n.language === 'ar'
                          ? item.product?.name_ar
                          : item.product?.name_en;

                        return (
                          <div key={item.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                            {/* Product name + date row */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-[240px]">
                                {productName || 'Unknown Product'}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
                                {new Date(item.used_at).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Code box */}
                            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                              <span className={`font-mono text-base font-bold text-gray-900 dark:text-white tracking-widest flex-1 transition-all ${isRevealed ? '' : 'blur-sm select-none'}`}>
                                {isRevealed ? item.code : maskCode(item.code)}
                              </span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Reveal toggle */}
                                <button
                                  onClick={() => toggleReveal(item.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-400 transition-all cursor-pointer"
                                  title={isRevealed ? 'Hide' : 'Reveal'}
                                >
                                  <i className={`ri-${isRevealed ? 'eye-off' : 'eye'}-line text-sm`}></i>
                                </button>
                                {/* Copy button */}
                                <button
                                  onClick={() => isRevealed && copyCode(item.code, item.id)}
                                  disabled={!isRevealed}
                                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                                    isCopied
                                      ? 'bg-green-500 text-white border border-green-500'
                                      : isRevealed
                                      ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80 border border-black dark:border-white'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                                  }`}
                                  title={isCopied ? 'Copied!' : 'Copy'}
                                >
                                  <i className={`ri-${isCopied ? 'check' : 'file-copy'}-line text-sm`}></i>
                                </button>
                              </div>
                            </div>

                            {isCopied && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
                                <i className="ri-check-line"></i> Code copied to clipboard!
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer */}
                  {user && codes.length > 0 && (
                    <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3 bg-gray-50 dark:bg-gray-900/50">
                      <Link
                        to="/dashboard/codes"
                        onClick={() => setIsCodesOpen(false)}
                        className="flex items-center justify-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold cursor-pointer transition-colors"
                      >
                        <i className="ri-layout-grid-line"></i>
                        View all codes in full page
                        <i className="ri-arrow-right-line"></i>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsCodesOpen(false); }}
                  className="flex items-center justify-center w-8 h-8 bg-black dark:bg-teal-500 text-white rounded-full cursor-pointer text-sm font-bold tracking-wide hover:opacity-90 transition-opacity"
                  aria-label="User menu"
                >
                  {getUserInitials()}
                </button>
                {isUserMenuOpen && (
                  <div className="absolute end-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 mb-1">
                      <p className="text-sm font-semibold dark:text-white truncate">
                        {user.full_name || user.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <i className="ri-dashboard-line text-base text-gray-400"></i>
                      {t('common:my_dashboard')}
                    </Link>
                    <Link
                      to="/dashboard/codes"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <i className="ri-key-2-line text-base text-gray-400"></i>
                      {t('common:my_codes')}
                    </Link>
                    <Link
                      to="/dashboard/favorites"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <i className="ri-heart-line text-base text-gray-400"></i>
                      {t('common:favorites')}
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <i className="ri-settings-3-line text-base text-gray-400"></i>
                      {t('common:settings')}
                    </Link>
                    <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-500 dark:text-red-400 transition-colors cursor-pointer"
                      >
                        <i className="ri-logout-box-r-line text-base"></i>
                        {t('common:sign_out')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth/signin"
                className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Sign In"
              >
                <i className="ri-user-3-line text-xl dark:text-white"></i>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex items-center justify-center w-8 h-8 cursor-pointer dark:text-white"
            >
              <i className={`ri-${isMenuOpen ? 'close' : 'menu'}-line text-2xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-4 space-y-3">
            <Link to="/" className="block text-sm font-medium hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400" onClick={() => setIsMenuOpen(false)}>
              {t('common:nav_home')}
            </Link>
            <Link to="/products" className="block text-sm font-medium hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400" onClick={() => setIsMenuOpen(false)}>
              {t('common:nav_products')}
            </Link>
            <Link to="/guide" className="block text-sm font-medium hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400" onClick={() => setIsMenuOpen(false)}>
              {t('common:nav_guide')}
            </Link>
            <Link to="/contact" className="block text-sm font-medium hover:text-gray-600 dark:text-gray-200 dark:hover:text-gray-400" onClick={() => setIsMenuOpen(false)}>
              {t('common:nav_contact')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  const socialLinks = [
    { icon: 'ri-instagram-line', url: 'https://instagram.com', label: t('common:instagram') },
    { icon: 'ri-twitter-x-line', url: 'https://twitter.com', label: t('common:twitter') },
    { icon: 'ri-telegram-line', url: 'https://t.me', label: t('common:telegram') },
    { icon: 'ri-whatsapp-line', url: 'https://wa.me', label: t('common:whatsapp') },
    { icon: 'ri-tiktok-line', url: 'https://tiktok.com', label: t('common:tiktok') },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <i className="ri-apple-fill text-3xl"></i>
              <span className="text-xl font-bold">Apple+ Codes</span>
            </div>
            <p className="text-gray-400 text-sm">
              {t('common:trusted_source')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('common:quick_links')}</h3>
            <div className="space-y-2">
              <Link to="/products" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t('common:nav_products')}
              </Link>
              <Link to="/guide" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t('common:nav_guide')}
              </Link>
              <Link to="/about" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t('common:nav_about')}
              </Link>
              <Link to="/terms" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t('common:nav_terms')}
              </Link>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('common:follow_us')}</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                  aria-label={social.label}
                >
                  <i className={`${social.icon} text-xl`}></i>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Apple+ Codes. {t('common:all_rights_reserved')}</p>
        </div>
      </div>
    </footer>
  );
}
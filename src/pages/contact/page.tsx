import { useTranslation } from 'react-i18next';
import Card from '../../components/base/Card';

const InstagramSVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TwitterXSVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TelegramSVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const WhatsAppSVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

const TikTokSVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
  </svg>
);

export default function ContactPage() {
  const { t } = useTranslation();

  const socialLinks = [
    {
      icon: <InstagramSVG />,
      label: t('common:instagram'),
      handle: '@appleplus.codes',
      url: 'https://instagram.com',
      gradient: 'from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]',
      bg: 'bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]',
    },
    {
      icon: <TwitterXSVG />,
      label: t('common:twitter'),
      handle: '@appleplus_codes',
      url: 'https://twitter.com',
      bg: 'bg-black',
    },
    {
      icon: <TelegramSVG />,
      label: t('common:telegram'),
      handle: 't.me/appleplus',
      url: 'https://t.me',
      bg: 'bg-[#229ED9]',
    },
    {
      icon: <WhatsAppSVG />,
      label: t('common:whatsapp'),
      handle: '+966 5X XXX XXXX',
      url: 'https://wa.me',
      bg: 'bg-[#25D366]',
    },
    {
      icon: <TikTokSVG />,
      label: t('common:tiktok'),
      handle: '@appleplus.codes',
      url: 'https://tiktok.com',
      bg: 'bg-black',
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14 animate-slide-up">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 mb-3">Support &amp; Social</span>
          <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">{t('common:contact_us')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md mx-auto">{t('common:get_in_touch')}</p>
        </div>

        {/* Social Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {socialLinks.map((social, idx) => (
            <a
              key={social.label}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="group block animate-slide-up"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-center gap-5 p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                {/* Icon bubble */}
                <div className={`flex items-center justify-center w-14 h-14 ${social.bg} text-white rounded-xl flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                  {social.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-base">{social.label}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm truncate">{social.handle}</p>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center w-8 h-8 bg-gray-50 dark:bg-gray-700 group-hover:bg-gray-100 dark:group-hover:bg-gray-600 rounded-full transition-colors flex-shrink-0">
                  <i className="ri-arrow-right-up-line text-gray-400 dark:text-gray-300 text-base"></i>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Response time card */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5 animate-slide-up" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center justify-center w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-xl flex-shrink-0">
            <i className="ri-time-line text-xl"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">{t('common:need_help')}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t('common:connect_with_us')} &mdash;&nbsp;
              <span className="font-medium text-gray-700 dark:text-gray-300">{t('common:response_time_value')}</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

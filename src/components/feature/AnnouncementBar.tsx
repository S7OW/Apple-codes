import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

export default function AnnouncementBar() {
  const { i18n } = useTranslation();
  const { language } = useStore();
  const [announcement, setAnnouncement] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchAnnouncement();
  }, [language]);

  const fetchAnnouncement = async () => {
    try {
      const { data } = await supabase
        .from('site_content')
        .select('*')
        .eq('key', 'announcement')
        .maybeSingle();

      if (data) {
        setAnnouncement(language === 'ar' ? data.content_ar : data.content_en);
      }
    } catch {
      // Supabase not connected, skip announcement
    }
  };

  if (!isVisible || !announcement) return null;

  return (
    <div className="bg-black text-white py-2 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <p className="text-sm text-center animate-pulse">{announcement}</p>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 flex items-center justify-center w-6 h-6 hover:bg-white/10 rounded-full cursor-pointer"
        >
          <i className="ri-close-line text-lg"></i>
        </button>
      </div>
    </div>
  );
}
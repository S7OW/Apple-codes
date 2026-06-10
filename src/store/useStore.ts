import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface StoreState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;

  // Favorites
  favorites: string[];
  addToFavorites: (productId: string) => void;
  removeFromFavorites: (productId: string) => void;

  // Language
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;

  // Dark Mode
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),

      // Favorites
      favorites: [],
      addToFavorites: (productId) =>
        set((state) => ({
          favorites: [...state.favorites, productId],
        })),
      removeFromFavorites: (productId) =>
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== productId),
        })),

      // Language
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),

      // Dark Mode
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'apple-codes-store',
    }
  )
);

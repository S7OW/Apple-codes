import { useState, useEffect } from 'react';

interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number;
}

const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  // Saudi Arabia, Bahrain, Kuwait, Qatar
  SA: { code: 'SAR', symbol: 'SAR', rate: 3.75 },
  BH: { code: 'SAR', symbol: 'SAR', rate: 3.75 },
  KW: { code: 'SAR', symbol: 'SAR', rate: 3.75 },
  QA: { code: 'SAR', symbol: 'SAR', rate: 3.75 },
  // UAE
  AE: { code: 'AED', symbol: 'AED', rate: 3.67 },
  // Egypt
  EG: { code: 'EGP', symbol: 'EGP', rate: 49 },
  // United Kingdom
  GB: { code: 'GBP', symbol: '£', rate: 0.79 },
  // European Union countries
  DE: { code: 'EUR', symbol: '€', rate: 0.92 },
  FR: { code: 'EUR', symbol: '€', rate: 0.92 },
  IT: { code: 'EUR', symbol: '€', rate: 0.92 },
  ES: { code: 'EUR', symbol: '€', rate: 0.92 },
  NL: { code: 'EUR', symbol: '€', rate: 0.92 },
  BE: { code: 'EUR', symbol: '€', rate: 0.92 },
  AT: { code: 'EUR', symbol: '€', rate: 0.92 },
  PT: { code: 'EUR', symbol: '€', rate: 0.92 },
  IE: { code: 'EUR', symbol: '€', rate: 0.92 },
  FI: { code: 'EUR', symbol: '€', rate: 0.92 },
  GR: { code: 'EUR', symbol: '€', rate: 0.92 },
  // Default (US and others)
  US: { code: 'USD', symbol: '$', rate: 1 },
  DEFAULT: { code: 'USD', symbol: '$', rate: 1 },
};

const CACHE_KEY = 'user_currency_info';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyInfo>(CURRENCY_MAP.DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const now = Date.now();
          if (now - timestamp < CACHE_DURATION) {
            setCurrency(data);
            setLoading(false);
            return;
          }
        }

        let countryCode = 'US';

        // Try primary API
        try {
          const response = await fetch('https://ip-api.com/json/?fields=countryCode', {
            signal: AbortSignal.timeout(5000),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.countryCode) countryCode = data.countryCode;
          }
        } catch {
          // Try fallback API
          try {
            const response = await fetch('https://freeipapi.com/api/json', {
              signal: AbortSignal.timeout(5000),
            });
            if (response.ok) {
              const data = await response.json();
              if (data.countryCode) countryCode = data.countryCode;
            }
          } catch {
            // Both failed, use default USD
          }
        }

        const currencyInfo = CURRENCY_MAP[countryCode] || CURRENCY_MAP.DEFAULT;

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: currencyInfo,
            timestamp: Date.now(),
          })
        );

        setCurrency(currencyInfo);
      } catch (error) {
        console.error('Currency detection failed:', error);
        setCurrency(CURRENCY_MAP.DEFAULT);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrency();
  }, []);

  const formatPrice = (usdPrice: number): string => {
    if (loading) {
      return `$${usdPrice.toFixed(2)}`;
    }

    const convertedPrice = usdPrice * currency.rate;
    const formattedAmount = convertedPrice.toFixed(2);
    
    // Format with symbol
    if (currency.symbol === '$' || currency.symbol === '£' || currency.symbol === '€') {
      return `${currency.symbol}${formattedAmount}`;
    } else {
      return `${formattedAmount} ${currency.symbol}`;
    }
  };

  return {
    currency,
    loading,
    formatPrice,
  };
}
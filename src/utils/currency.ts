import { supabase } from '../config/supabase';

const COUNTRY_CURRENCY_MAP = {
  'India': 'INR',
  'United States': 'USD',
  'United Kingdom': 'GBP',
  'Nigeria': 'NGN',
  'Indonesia': 'IDR',
};

export const getCurrencyByCountry = (country: string): string => {
  return COUNTRY_CURRENCY_MAP[country as keyof typeof COUNTRY_CURRENCY_MAP] || 'INR';
};

export const convertCurrency = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
  if (fromCurrency === toCurrency) return amount;
  
  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .single();
    
    if (error || !data) {
      console.log('Exchange rate not found, using 1:1 ratio');
      return amount;
    }
    
    return amount * data.rate;
  } catch (error) {
    console.log('Currency conversion error:', error);
    return amount;
  }
};

export const formatCurrency = (amount: number, currency: string): string => {
  const symbols = {
    'INR': '₹',
    'USD': '$',
    'GBP': '£',
    'NGN': '₦',
    'IDR': 'Rp',
  };
  
  const symbol = symbols[currency as keyof typeof symbols] || '₹';
  return `${symbol}${Math.round(amount)}`;
};
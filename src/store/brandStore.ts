import { create } from 'zustand';
import { supabase } from '../config/supabase';

interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  tier: 'premium' | 'mid-tier' | 'regular';
  weight: number;
  active: boolean;
}

interface BrandState {
  brands: Brand[];
  loading: boolean;
  fetchBrands: () => Promise<void>;
  getBrandWeight: (brandName: string) => number;
}

export const useBrandStore = create<BrandState>((set, get) => ({
  brands: [],
  loading: false,

  fetchBrands: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('active', true)
        .order('weight', { ascending: false });

      if (error) throw error;
      set({ brands: data || [] });
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      set({ loading: false });
    }
  },

  getBrandWeight: (brandName: string) => {
    const { brands } = get();
    const brand = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
    return brand?.weight || 1;
  },
}));
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://qpefmeiflgwqrvvvdnhv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWZtZWlmbGd3cXJ2dnZkbmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTA3NzcsImV4cCI6MjA2OTg2Njc3N30.WEUDyDmkeJCxT56Kck8JkbtkZDcOv2R0GA3ZT8J4_uM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
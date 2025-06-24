// mobile/supabase.js
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

export const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL;
export const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase config!', { SUPABASE_URL, SUPABASE_ANON_KEY });
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

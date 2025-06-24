// mobile/config.js
import Constants from 'expo-constants';

export const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL;
export const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY;
export const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY;

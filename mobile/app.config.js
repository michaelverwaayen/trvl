// app.config.js
import 'dotenv/config';

console.log('✅ SUPABASE_URL:', process.env.SUPABASE_URL);
export default {
  expo: {
    name: 'RFQ App',
    slug: 'rfq-app',
    version: '1.0.0',
    platforms: ['ios', 'android', 'web'],
    orientation: 'portrait',
    backgroundColor: '#ffffff',
    plugins: ['expo-notifications'],
    android: {
      useNextNotificationsApi: true
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ['**/*'],
    web: {},
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY
    }
  }
};

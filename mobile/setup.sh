#!/bin/bash

echo "🔧 Setting up your environment..."

# 1. Install dependencies
echo "📦 Installing NPM dependencies..."
npm install --legacy-peer-deps

# 2. Install required Expo + React Native packages
echo "📦 Installing required packages..."
npm install react-native react-native-web react-native-vector-icons react-native-gesture-handler react-native-safe-area-context react-native-screens @react-native-picker/picker @react-navigation/native @react-navigation/native-stack expo expo-constants expo-notifications --legacy-peer-deps

# 3. Install Supabase client
npm install @supabase/supabase-js --legacy-peer-deps

# 4. Add server dependencies
echo "📦 Installing Express server dependencies..."
npm install express cors uuid dotenv

# 5. Setup environment variables
echo "🔐 Creating .env file..."
cat <<EOF > .env
OPENAI_API_KEY=your-openai-api-key-here
SUPABASE_URL=your-supabase-url-here
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SERVER_URL=http://localhost:3000
EOF

echo "✅ Environment setup complete."

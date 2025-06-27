// File: App.js
import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomePage from './HomePage';
import ChatFlowRouter from './ChatFlowRouter';
import QuoteComparison from './QuoteComparison';
import EstimateScreen from './EstimateScreen';
import VendorJobsScreen from './VendorJobsScreen';
import SubmitVendorQuote from './SubmitVendorQuote';
import VendorChatRoom from './VendorChatRoom';
import AdminDashboardScreen from './AdminDashboardScreen';
import SettingsScreen from './SettingsScreen';
import AboutScreen from './AboutScreen';
import VendorDetailScreen from './VendorDetailScreen';
import { SUPABASE_URL } from './config';
import { ThemeProvider, useTheme } from './ThemeContext';
import { AuthProvider, useAuth } from './AuthContext';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import VendorMapScreen from './VendorMapScreen';
console.log('🧪 SUPABASE_URL:', SUPABASE_URL);

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const VendorStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

const HomePageWrapper = ({ navigation }) => (
  <HomePage
    onStartNewRequest={() => navigation.navigate('Chat')}
    onSelectJob={(id) => navigation.navigate('QuoteComparison', { logId: id })}
    onOpenSettings={() => navigation.navigate('Settings')}
    onGetEstimate={() => navigation.navigate('Estimate')}
  />
);

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeMain"
        component={HomePageWrapper}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="QuoteComparison"
        component={QuoteComparison}
        options={{ title: 'Quotes' }}
      />
      <HomeStack.Screen
        name="Estimate"
        component={EstimateScreen}
        options={{ title: 'Estimate' }}
      />
      <HomeStack.Screen
        name="VendorDetails"
        component={VendorDetailScreen}
        options={{ title: 'Vendor' }}
      />
      <HomeStack.Screen
        name="VendorMap"
        component={VendorMapScreen}
        options={{ title: 'Vendor Map' }}
      />
    </HomeStack.Navigator>
  );
}

function VendorStackScreen() {
  return (
    <VendorStack.Navigator>
      <VendorStack.Screen
        name="VendorMain"
        component={VendorJobsScreen}
        options={{ headerShown: false }}
      />
      <VendorStack.Screen
        name="SubmitVendorQuote"
        component={SubmitVendorQuote}
        options={{ title: 'Submit Quote' }}
      />
      <VendorStack.Screen
        name="VendorChatRoom"
        component={VendorChatRoom}
        options={{ title: 'Chat' }}
      />
    </VendorStack.Navigator>
  );
}

function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen name="About" component={AboutScreen} />
    </SettingsStack.Navigator>
  );
}

function AuthStackScreen() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  const { theme } = useTheme();
  const navTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: theme.background },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let icon = 'ellipse';
            if (route.name === 'Home') icon = 'home-outline';
            else if (route.name === 'Chat') icon = 'chatbox-ellipses-outline';
            else if (route.name === 'Vendor') icon = 'briefcase-outline';
            else if (route.name === 'Admin') icon = 'analytics-outline';
            else if (route.name === 'Settings') icon = 'settings-outline';
            return <Ionicons name={icon} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeStackScreen} />
        <Tab.Screen name="Chat" component={ChatFlowRouter} />
        <Tab.Screen name="Vendor" component={VendorStackScreen} />
        <Tab.Screen name="Admin" component={AdminDashboardScreen} />
        <Tab.Screen name="Settings" component={SettingsStackScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();
  const { theme } = useTheme();
  if (loading) return null;
  return session ? <MainTabs /> : (
    <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.background } }}>
      <AuthStackScreen />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}


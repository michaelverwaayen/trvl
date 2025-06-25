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
import SettingsScreen from './SettingsScreen';
import { SUPABASE_URL } from './config';
import { ThemeProvider, useTheme } from './ThemeContext';
console.log('🧪 SUPABASE_URL:', SUPABASE_URL);

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

const HomePageWrapper = ({ navigation }) => (
  <HomePage
    onStartNewRequest={() => navigation.navigate('Chat')}
    onSelectJob={(id) => navigation.navigate('QuoteComparison', { logId: id })}
    onOpenSettings={() => navigation.navigate('Settings')}
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
    </HomeStack.Navigator>
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
            else if (route.name === 'Settings') icon = 'settings-outline';
            return <Ionicons name={icon} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeStackScreen} />
        <Tab.Screen name="Chat" component={ChatFlowRouter} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
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
      <MainTabs />
    </ThemeProvider>
  );
}


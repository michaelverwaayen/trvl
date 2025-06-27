// components/BottomTabs.js
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';


export default function BottomTabs({ currentTab = 'home', onTabPress }) {
  const { theme } = useTheme();

  const tabs = [
    { key: 'home', icon: 'home-outline', label: 'Home' },
    { key: 'chats', icon: 'chatbubble-ellipses-outline', label: 'Chats' },
    { key: 'settings', icon: 'settings-outline', label: 'Settings' }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => onTabPress?.(tab.key)}
          style={styles.tab}
        >
          <Ionicons
            name={tab.icon}
            size={24}
            color={currentTab === tab.key ? theme.primary : '#999'}
          />
          <Text style={[styles.label, { color: currentTab === tab.key ? theme.primary : '#999' }]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    fontSize: 12,
    marginTop: 2
  }
});

import React from 'react';
import { View, Text, Switch, StyleSheet, Appearance, TouchableOpacity } from 'react-native';
import { useTheme } from './ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { theme, themeName, setThemeName } = useTheme();

  const useSystem = themeName === 'system';
  const isDark = (useSystem ? Appearance.getColorScheme() : themeName) === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Settings</Text>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.text }]}>Use System Theme</Text>
        <Switch
          value={useSystem}
          onValueChange={(val) => setThemeName(val ? 'system' : 'light')}
        />
      </View>
      {!useSystem && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.text }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={(val) => setThemeName(val ? 'dark' : 'light')}
          />
        </View>
      )}
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('About')}>
        <Text style={[styles.label, { color: theme.primary }]}>About / Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  label: { fontSize: 16 },
});

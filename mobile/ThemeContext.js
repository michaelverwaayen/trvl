import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

const lightTheme = {
  background: '#FFFFFF',
  text: '#000000',
  card: '#F9F9F9',
  border: '#CCCCCC',
  primary: '#007AFF',
  secondary: '#E0E0E0',
};

const darkTheme = {
  background: '#000000',
  text: '#FFFFFF',
  card: '#1E1E1E',
  border: '#444444',
  primary: '#0A84FF',
  secondary: '#333333',
};

const ThemeContext = createContext({
  theme: lightTheme,
  themeName: 'light',
  setThemeName: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [systemScheme, setSystemScheme] = useState(
    Appearance.getColorScheme() || 'light'
  );
  const [themeName, setThemeName] = useState('system');

  useEffect(() => {
    const listener = ({ colorScheme }) => {
      setSystemScheme(colorScheme || 'light');
    };
    const sub = Appearance.addChangeListener(listener);
    return () => sub.remove();
  }, []);

  const resolved = themeName === 'system' ? systemScheme : themeName;
  const theme = resolved === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

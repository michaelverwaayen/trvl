import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) alert(error.message);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {loading && <ActivityIndicator style={{ marginVertical: 10 }} />}
      <Button title="Login" onPress={handleLogin} />
      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 20 }}>
        <Text style={{ color: theme.primary }}>No account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = theme =>
  StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: theme.background },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: theme.text },
    input: { borderWidth: 1, borderColor: theme.border, padding: 10, borderRadius: 6, marginBottom: 10, color: theme.text }
  });

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Switch } from 'react-native';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';
import { useTheme } from './ThemeContext';

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [isVendor, setIsVendor] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const handleRegister = async () => {
    setLoading(true);
    const { data, error } = await signUp(email, password);
    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }
    if (isVendor && data.user) {
      await supabase.from('vendors').insert([{ id: data.user.id, email, name, category }]);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Register</Text>
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
      <View style={styles.switchRow}>
        <Text style={{ color: theme.text }}>Register as Vendor</Text>
        <Switch value={isVendor} onValueChange={setIsVendor} />
      </View>
      {isVendor && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Category"
            value={category}
            onChangeText={setCategory}
          />
        </>
      )}
      {loading && <ActivityIndicator style={{ marginVertical: 10 }} />}
      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}

const getStyles = theme =>
  StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: theme.background },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: theme.text },
    input: { borderWidth: 1, borderColor: theme.border, padding: 10, borderRadius: 6, marginBottom: 10, color: theme.text },
    switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' }
  });

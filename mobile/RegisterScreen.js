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

  // Sign up
  const { data, error } = await signUp(email, password);

  if (error) {
    alert(error.message);
    setLoading(false);
    return;
  }

  alert('Check your email to confirm your account.');

  // Poll until the user is confirmed
  const pollForConfirmation = setInterval(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const confirmed = userData?.user?.email_confirmed_at;

    if (confirmed) {
      clearInterval(pollForConfirmation);
      console.log("✅ Email confirmed");

      // Optional: insert vendor profile after confirmation
      if (isVendor) {
        const { error: insertError } = await supabase.from('vendors').insert([{
          id: userData.user.id,
          email,
          name,
          category
        }]);

        if (insertError) {
          console.error('Vendor creation failed:', insertError.message);
          alert('Vendor profile creation failed.');
        }
      }

      setLoading(false);
      navigation.navigate('Login'); // or navigate to dashboard
    } else {
      console.log("Waiting for confirmation...");
    }
  }, 3000); // poll every 3 seconds
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

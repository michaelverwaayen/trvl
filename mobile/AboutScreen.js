import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';
import { useTheme } from './ThemeContext';

export default function AboutScreen({ navigation }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [stateProv, setStateProv] = useState('');
  const [country, setCountry] = useState('');
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setName(data.full_name || '');
        setCity(data.city || '');
        setStateProv(data.state || '');
        setCountry(data.country || '');
      }
    };
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    await supabase.from('user_profiles').upsert({
      id: user.id,
      full_name: name,
      city,
      state: stateProv,
      country,
    });
    alert('Profile saved');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>About You</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="City"
        value={city}
        onChangeText={setCity}
      />
      <TextInput
        style={styles.input}
        placeholder="State/Province"
        value={stateProv}
        onChangeText={setStateProv}
      />
      <TextInput
        style={styles.input}
        placeholder="Country"
        value={country}
        onChangeText={setCountry}
      />
      <Button title="Save" onPress={handleSave} />
    </View>
  );
}

const getStyles = theme =>
  StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: theme.background },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.text },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      padding: 10,
      marginBottom: 10,
      color: theme.text,
      backgroundColor: theme.card,
    },
  });

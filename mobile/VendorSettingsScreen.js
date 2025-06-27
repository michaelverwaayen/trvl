import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';
import { useSession } from './AuthContext';

export default function VendorSettingsScreen() {
  const { session } = useSession();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(false);

  // Input fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      fetchVendor();
    }
  }, [session]);

  const fetchVendor = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching vendor:', error.message);
    } else {
      setVendor(data);
      setName(data.name || '');
      setCategory(data.category || '');
      setEmail(data.email || '');
      setWebsite(data.website || '');
      setImageUrl(data.image_url || '');
    }
    setLoading(false);
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });

    if (!result.canceled) {
      const file = result.assets[0];
      const fileExt = file.uri.split('.').pop();
      const fileName = `${session.user.id}.${fileExt}`;
      const filePath = `vendor-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, {
          uri: file.uri,
          type: file.type,
          name: fileName,
        }, { upsert: true });

      if (uploadError) {
        Alert.alert('Upload failed', uploadError.message);
        return;
      }

      const publicUrl = supabase.storage.from('public').getPublicUrl(filePath).data.publicUrl;
      setImageUrl(publicUrl);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const updates = {
      name,
      category,
      email,
      website,
      image_url: imageUrl,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('vendors').update(updates).eq('id', session.user.id);
    if (error) {
      Alert.alert('Save failed', error.message);
    } else {
      Alert.alert('Saved!', 'Your vendor profile was updated.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendor Settings</Text>

      <TextInput placeholder="Name" style={styles.input} value={name} onChangeText={setName} />
      <TextInput placeholder="Category" style={styles.input} value={category} onChangeText={setCategory} />
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput placeholder="Website" style={styles.input} value={website} onChangeText={setWebsite} autoCapitalize="none" />

      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}
      <Button title="Upload Profile Photo" onPress={handleImagePick} />

      <Button title="Save" onPress={handleSave} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, borderRadius: 6 },
  image: { width: 100, height: 100, borderRadius: 8, marginVertical: 10 },
});

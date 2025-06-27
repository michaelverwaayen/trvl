import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Button, Linking, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from './ThemeContext';

export default function VendorDetailScreen({ route, navigation }) {
  const { vendor } = route.params || {};
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const openWebsite = () => {
    if (vendor?.website) Linking.openURL(vendor.website);
  };

  const startChat = () => navigation.navigate('Chat');
  const startRequest = () => navigation.navigate('Chat');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {vendor?.image_url ? (
        <Image source={{ uri: vendor.image_url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={{ color: '#888' }}>No Image</Text>
        </View>
      )}
      <Text style={styles.name}>{vendor?.name}</Text>
      <Text style={styles.category}>{vendor?.category}</Text>
      <View style={styles.ratingRow}>
        {Array.from({ length: 5 }).map((_, idx) => (
          <FontAwesome
            key={idx}
            name={idx < Math.round(vendor?.average_rating || 0) ? 'star' : 'star-o'}
            size={16}
            color="#FFD700"
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
      {vendor?.website && (
        <TouchableOpacity onPress={openWebsite}>
          <Text style={styles.link}>{vendor.website}</Text>
        </TouchableOpacity>
      )}
      {vendor?.email && <Text style={styles.email}>{vendor.email}</Text>}
      <View style={styles.buttonRow}>
        <Button title="Start Chat" onPress={startChat} />
        <Button title="Start Request" onPress={startRequest} />
      </View>
    </ScrollView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { padding: 20, alignItems: 'center', backgroundColor: theme.background },
    image: { width: 200, height: 200, borderRadius: 10, marginBottom: 10 },
    imagePlaceholder: {
      width: 200,
      height: 200,
      borderRadius: 10,
      backgroundColor: '#eee',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    name: { fontSize: 24, fontWeight: 'bold', color: theme.text },
    category: { fontSize: 16, color: '#666', marginBottom: 4 },
    ratingRow: { flexDirection: 'row', marginBottom: 6 },
    link: { color: theme.primary, marginBottom: 4 },
    email: { fontSize: 14, marginBottom: 10, color: theme.text },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, width: '100%' },
  });

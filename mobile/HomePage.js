  // HomeScreen.js - Redesigned with chat history and vendor carousel

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, ScrollView, Image, Linking } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from './ThemeContext';
import { supabase } from './supabase';
import BottomTabs from './BottomTabs';
import SkeletonList from './SkeletonList';

export default function HomeScreen() {
  const { theme } = useTheme();
  const [category, setCategory] = useState('Plumbing');
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState([]); // historical chat
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const styles = getStyles(theme);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendors')
      .select('*, reviews(rating)');

    if (!error && data) {
      const withRating = data.map((v) => {
        const avg = v.reviews && v.reviews.length
          ? v.reviews.reduce((s, r) => s + r.rating, 0) / v.reviews.length
          : 0;
        return { ...v, average_rating: avg };
      });
      setVendors(withRating);
    }
    setLoading(false);
  };

  const openWebsite = (url) => {
    if (url) Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Requests</Text>

      {loading && requests.length === 0 ? (
        <SkeletonList itemHeight={50} itemCount={3} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.listText}>{item.title}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No requests found. Start one below!</Text>}
          style={{ marginBottom: 10 }}
        />
      )}

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Search requests..."
          placeholderTextColor={theme.placeholder}
          value={search}
          onChangeText={setSearch}
        />

        <Text style={styles.subtitle}>Start a new request</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Get Estimate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary}>
          <Text style={styles.buttonText}>Get Urgent Help</Text>
        </TouchableOpacity>

        <Picker
          selectedValue={category}
          onValueChange={setCategory}
          style={styles.picker}
          dropdownIconColor={theme.text}
        >
          <Picker.Item label="Plumbing" value="Plumbing" />
          <Picker.Item label="Electrical" value="Electrical" />
          <Picker.Item label="Cleaning" value="Cleaning" />
        </Picker>

        <TouchableOpacity style={styles.buttonAlt}>
          <Text style={styles.buttonAltText}>Find Vendors</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Nearby Vendors</Text>
      {loading && vendors.length === 0 ? (
        <SkeletonList itemHeight={150} itemCount={3} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {vendors.map((vendor) => (
            <TouchableOpacity
              key={vendor.id}
              onPress={() => openWebsite(vendor.website)}
              style={styles.vendorCard}
            >
              {vendor.image_url ? (
                <Image source={{ uri: vendor.image_url }} style={styles.vendorImage} />
              ) : (
                <View style={styles.vendorImagePlaceholder}><Text style={{ color: '#888' }}>No Image</Text></View>
              )}
              <Text style={styles.vendorName}>{vendor.name}</Text>
              <Text style={styles.vendorCategory}>{vendor.category}</Text>
              <View style={styles.ratingRow}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <FontAwesome
                    key={idx}
                    name={idx < Math.round(vendor.average_rating || 0) ? 'star' : 'star-o'}
                    size={14}
                    color="#FFD700"
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>
              <Text style={styles.vendorEmail}>{vendor.email}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <BottomTabs />
    </View>
  );
}

const getStyles = theme => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9'
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 20
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    color: theme.text
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    color: theme.text
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 10,
    marginBottom: 20
  },
  button: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10
  },
  buttonSecondary: {
    backgroundColor: '#34A853',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  buttonAlt: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center'
  },
  buttonAltText: {
    color: '#333',
    fontWeight: '600'
  },
  listItem: {
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1
  },
  listText: {
    fontSize: 16,
    color: theme.text
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20
  },
  vendorCard: {
    width: 180,
    marginRight: 14,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  vendorImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 8
  },
  vendorImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#eee',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  vendorName: {
    fontWeight: '700',
    fontSize: 16,
    color: theme.text
  },
  vendorCategory: {
    color: '#777',
    fontSize: 14,
    marginBottom: 4
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  vendorEmail: {
    color: '#4285F4',
    fontSize: 13
  }
});

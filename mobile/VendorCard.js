// VendorCard.js
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../ThemeContext';

export default function VendorCard({ vendor, onPress }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: vendor.image_url || 'https://via.placeholder.com/100' }}
        style={styles.image}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{vendor.name}</Text>
        <Text style={styles.category}>{vendor.category}</Text>
        {vendor.email ? <Text style={styles.email}>{vendor.email}</Text> : null}
        {vendor.website ? (
          <Text style={styles.link} onPress={() => Linking.openURL(vendor.website)}>
            Visit Website
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    card: {
      width: 200,
      marginRight: 12,
      backgroundColor: theme.card,
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border
    },
    image: {
      width: '100%',
      height: 100,
      backgroundColor: '#eee'
    },
    infoContainer: {
      padding: 10
    },
    name: {
      fontWeight: 'bold',
      fontSize: 16,
      color: theme.text
    },
    category: {
      color: '#666',
      marginBottom: 4
    },
    email: {
      fontSize: 12,
      color: '#555'
    },
    link: {
      color: theme.primary,
      marginTop: 6,
      fontSize: 12
    }
  });

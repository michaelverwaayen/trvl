import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
let MapView, Marker, MapContainer, TileLayer, Popup;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} else {
  const RL = require('react-leaflet');
  MapContainer = RL.MapContainer;
  TileLayer = RL.TileLayer;
  Marker = RL.Marker;
  Popup = RL.Popup;
}
import * as Location from 'expo-location';
import { supabase } from './supabase';
import { useNavigation } from '@react-navigation/native';

export default function VendorMapScreen() {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      fetchVendors();
    })();
  }, []);

  const fetchVendors = async () => {
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

  if (!location || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[location.latitude, location.longitude]}>
          <Popup>You are here</Popup>
        </Marker>
        {vendors.map(
          (v) =>
            v.lat &&
            v.lon && (
              <Marker
                key={v.id}
                position={[v.lat, v.lon]}
                eventHandlers={{
                  click: () => navigation.navigate('VendorDetails', { vendor: v }),
                }}
              >
                <Popup>{v.name}</Popup>
              </Marker>
            )
        )}
      </MapContainer>
    );
  }

  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker
        coordinate={{ latitude: location.latitude, longitude: location.longitude }}
        title="You are here"
        pinColor="blue"
      />
      {vendors.map(
        (v) =>
          v.lat &&
          v.lon && (
            <Marker
              key={v.id}
              coordinate={{ latitude: v.lat, longitude: v.lon }}
              title={v.name}
              description={v.category}
              onPress={() => navigation.navigate('VendorDetails', { vendor: v })}
            />
          )
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { SERVER_URL } from './config';
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
      fetchVendors(loc.coords);
    })();
  }, []);

  const fetchVendors = async (coords) => {
    try {
      let url = `${SERVER_URL}/available_vendors`;
      if (coords) {
        const params = new URLSearchParams({
          lat: String(coords.latitude),
          lon: String(coords.longitude),
        });
        url += `?${params.toString()}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setVendors(data || []);
    } catch (err) {
      console.error('Vendor fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!location || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
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

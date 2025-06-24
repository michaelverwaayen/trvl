import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Button } from 'react-native';
import { supabase } from './supabase';
import RateVendorScreen from './RateVendorScreen';

export default function QuoteComparison({ logId, onBack }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendorRatings, setVendorRatings] = useState({});
  const [showRating, setShowRating] = useState(false);
  const [ratingVendor, setRatingVendor] = useState(null);

  useEffect(() => {
    const fetchQuotes = async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('log_id', logId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching quotes:', error.message);
        setError(error.message);
      } else {
        setQuotes(data || []);
      }
      setLoading(false);
    };

    fetchQuotes();
  }, [logId]);

  useEffect(() => {
    const fetchRatings = async () => {
      const unique = [...new Set(quotes.map(q => q.vendor_email))];
      const ratingMap = {};
      await Promise.all(
        unique.map(async v => {
          const { data } = await supabase
            .from('reviews')
            .select('rating')
            .eq('vendor_id', v);
          if (data && data.length > 0) {
            const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
            ratingMap[v] = avg.toFixed(1);
          }
        })
      );
      setVendorRatings(ratingMap);
    };

    if (quotes.length > 0) fetchRatings();
  }, [quotes]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.vendor}>{item.vendor_email || 'Unknown Vendor'}</Text>
      <Text style={styles.rating}>
        Rating: {vendorRatings[item.vendor_email] || 'N/A'}
      </Text>
      <Text style={styles.quote}>${parseFloat(item.quote).toFixed(2)}</Text>
      <Text style={styles.availability}>
        Available: {item.availability ? new Date(item.availability).toLocaleString() : 'N/A'}
      </Text>
      <Text>Status: {item.status || 'submitted'}</Text>
      {item.status === 'accepted' && (
        <Button
          title="Mark Completed"
          onPress={() => {
            supabase.from('quotes').update({ status: 'completed' }).eq('id', item.id);
            setRatingVendor(item.vendor_email);
            setShowRating(true);
          }}
        />
      )}
    </View>
  );

  if (showRating && ratingVendor) {
    return (
      <RateVendorScreen
        vendorId={ratingVendor}
        userId={null}
        onDone={() => setShowRating(false)}
        onSkip={() => setShowRating(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Quote Comparison</Text>
      <Button title="⬅️ Back" onPress={onBack} />
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : error ? (
        <Text style={styles.error}>Error: {error}</Text>
      ) : quotes.length === 0 ? (
        <Text style={styles.empty}>No quotes available for this request yet.</Text>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginVertical: 6,
    backgroundColor: '#F9F9F9'
  },
  vendor: { fontWeight: 'bold', marginBottom: 4 },
  rating: { marginBottom: 4 },
  quote: { fontSize: 18, marginBottom: 4 },
  availability: { color: '#555', marginBottom: 4 },
  error: { color: 'red', marginTop: 20 },
  empty: { marginTop: 20, fontStyle: 'italic', color: '#666' }
});

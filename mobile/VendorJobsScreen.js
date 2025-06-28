import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SERVER_URL } from './config';
import { supabase } from './supabase';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';

export default function VendorJobsScreen() {
  const { user } = useAuth();
  const vendorId = user?.id;
  const vendorEmail = user?.email;
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const fetchJobs = async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/jobs-for-vendor/${vendorId}`);
      const data = await res.json();
      let jobsWithStatus = data || [];
      if (vendorEmail) {
        const { data: accepted } = await supabase
          .from('quotes')
          .select('id, log_id, status')
          .eq('vendor_email', vendorEmail)
          .in('status', ['accepted', 'completed']);
        const map = {};
        (accepted || []).forEach(q => { map[q.log_id] = q; });
        jobsWithStatus = jobsWithStatus.map(j => ({ ...j, acceptedQuote: map[j.id] }));
      }
      setJobs(jobsWithStatus);
    } catch (err) {
      console.error('Vendor jobs fetch error', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [vendorId]);

  const handleComplete = async quoteId => {
    try {
      await fetch(`${SERVER_URL}/complete-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId })
      });
      fetchJobs();
    } catch (err) {
      console.error('Complete job failed', err);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.summary}>{item.assistant_reply}</Text>
      <Text>Category: {item.category}</Text>
      <Text>
        Created: {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
      </Text>
      <Button
        title="Submit Quote"
        onPress={() =>
          navigation.navigate('SubmitVendorQuote', {
            jobId: item.id,
          })
        }
      />
      {item.id && (
        <Button
          title="Open Chat"
          onPress={() =>
            navigation.navigate('VendorChatRoom', {
              chatRoomId: item.id,
              vendorId,
            })
          }
        />
      )}
      {item.acceptedQuote && item.acceptedQuote.status === 'accepted' && (
        <Button
          title="Mark Completed"
          onPress={() => handleComplete(item.acceptedQuote.id)}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Vendor Jobs</Text>
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
      <FlatList
        data={jobs}
        keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: theme.background },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: theme.text },
    card: { padding: 12, borderWidth: 1, borderColor: theme.border, borderRadius: 6, marginVertical: 6, backgroundColor: theme.card },
    summary: { fontWeight: 'bold', marginBottom: 4 },
  });

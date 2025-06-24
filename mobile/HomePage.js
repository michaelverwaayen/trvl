// HomePage.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { OPENAI_API_KEY } from './config';
import { supabase } from './supabase';


export default function HomePage({ onStartNewRequest, onSelectJob }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const registerForPush = async () => {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Push permissions denied');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      await supabase.from('expo_tokens').upsert({ token });

      Notifications.addNotificationReceivedListener(notification => {
        console.log('🔔 Notification received', notification);
      });
    };

    registerForPush();
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_logs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Supabase error:', error.message);
          setError(error.message);
        } else {
          setJobs(data || []);
        }
      } catch (err) {
        console.error('❌ Unexpected error fetching jobs:', err);
        setError('Something went wrong while fetching your requests.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => onSelectJob && onSelectJob(item.id)}>
      <View style={styles.jobCard}>
        <Text style={styles.summary}>
          Summary: {item.assistant_reply || 'No summary'}
        </Text>
        <Text>Category: {item.category || 'N/A'}</Text>
        <Text>Created: {item.created_at ? new Date(item.created_at).toLocaleString() : 'Unknown'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🧾 Your Requests</Text>
      <Button title="➕ Start New Request" onPress={onStartNewRequest} />
      
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : error ? (
        <Text style={styles.error}>Error: {error}</Text>
      ) : jobs.length === 0 ? (
        <Text style={styles.empty}>No requests found. Start one above!</Text>
      ) : (
        <FlatList
          data={jobs}
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
  jobCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    marginVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F9F9F9'
  },
  summary: { fontWeight: 'bold', marginBottom: 4 },
  error: { color: 'red', marginTop: 20 },
  empty: { marginTop: 20, fontStyle: 'italic', color: '#666' }
});

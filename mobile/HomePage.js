// HomePage.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function HomePage({ onStartNewRequest }) {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('chat_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setJobs(data || []);
    };

    fetchJobs();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🧾 Your Requests</Text>
      <Button title="➕ Start New Request" onPress={onStartNewRequest} />
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => (
          <View style={styles.jobCard}>
            <Text style={styles.summary}>Summary: {item.assistant_reply}</Text>
            <Text>Category: {item.category || 'N/A'}</Text>
            <Text>Created: {new Date(item.created_at).toLocaleString()}</Text>
          </View>
        )}
      />
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
    borderRadius: 6
  },
  summary: { fontWeight: 'bold', marginBottom: 4 }
});

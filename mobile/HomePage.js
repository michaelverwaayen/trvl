import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';

export default function HomePage({ onStartNewRequest }) {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get('http://localhost:3000/user-jobs'); // Backend route needed
        setJobs(res.data || []);
      } catch (err) {
        console.error('Error fetching jobs:', err);
      }
    };
    fetchJobs();
  }, []);

  const now = new Date();

  const openJobs = jobs.filter(j => !j.expires_at || new Date(j.expires_at) > now);
  const pastJobs = jobs.filter(j => j.expires_at && new Date(j.expires_at) <= now);

  const renderJob = ({ item }) => (
    <View style={styles.jobCard}>
      <Text style={styles.summary}>🔧 {item.assistant_reply}</Text>
      <Text>Category: {item.category}</Text>
      <Text>Severity: {item.severity}</Text>
      <Text>Expires: {item.expires_at ? new Date(item.expires_at).toLocaleString() : 'N/A'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Button title="➕ Create New Request" onPress={onStartNewRequest} />
      <Text style={styles.header}>🟢 Open Jobs</Text>
      <FlatList data={openJobs} renderItem={renderJob} keyExtractor={(_, idx) => `open-${idx}`} />

      <Text style={styles.header}>📁 Past Jobs</Text>
      <FlatList data={pastJobs} renderItem={renderJob} keyExtractor={(_, idx) => `past-${idx}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  jobCard: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 6 },
  summary: { fontWeight: 'bold', marginBottom: 5 },
  header: { fontSize: 18, marginTop: 20, marginBottom: 10 },
});

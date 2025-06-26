import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SERVER_URL } from './config';
import { useTheme } from './ThemeContext';

export default function VendorJobsScreen() {
  const [vendorId, setVendorId] = useState('');
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
      setJobs(data || []);
    } catch (err) {
      console.error('Vendor jobs fetch error', err);
      setJobs([]);
    } finally {
      setLoading(false);
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
            vendorId,
          })
        }
      />
      {item.id && (
        <Button
          title="Open Chat"
          onPress={() =>
            navigation.navigate('VendorChatRoom', {
              chatRoomId: item.id,
              vendorEmail: vendorId,
            })
          }
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Vendor Jobs</Text>
      <TextInput
        style={styles.input}
        placeholder="Vendor ID"
        value={vendorId}
        onChangeText={setVendorId}
      />
      <Button title="Fetch Jobs" onPress={fetchJobs} />
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
    input: { borderWidth: 1, borderColor: theme.border, padding: 10, borderRadius: 6, marginBottom: 10, color: theme.text },
    card: { padding: 12, borderWidth: 1, borderColor: theme.border, borderRadius: 6, marginVertical: 6, backgroundColor: theme.card },
    summary: { fontWeight: 'bold', marginBottom: 4 },
  });

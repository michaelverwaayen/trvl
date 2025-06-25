// HomePage.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  ScrollView
} from 'react-native';
import { useTheme } from './ThemeContext';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { OPENAI_API_KEY } from './config';
import { supabase } from './supabase';
import { Picker } from 'react-native';
import { SERVER_URL } from './config';

export default function HomePage({ onStartNewRequest, onSelectJob, onOpenSettings }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [showDropdown, setShowDropdown] = useState(false);


  const statusColors = {
    open: '#FFA500',
    quoted: '#007AFF',
    completed: '#28A745'
  };

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

  const categories = ['All', ...Array.from(new Set(jobs.map(j => j.category).filter(Boolean)))];
  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.assistant_reply?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || j.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => onSelectJob && onSelectJob(item.id)}>
      <View style={styles.jobCard}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[item.status] || '#999' }
          ]}
        >
          <Text style={styles.badgeText}>{item.status || 'open'}</Text>
        </View>
        <Text style={styles.summary}>
          Summary: {item.assistant_reply || 'No summary'}
        </Text>
        <Text>Category: {item.category || 'N/A'}</Text>
        <Text>
          Created:{' '}
          {item.created_at
            ? new Date(item.created_at).toLocaleString()
            : 'Unknown'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={styles.header}>🧾 Your Requests</Text>
      <Button title="➕ Start New Request" onPress={onStartNewRequest} />
      <Button title="⚙️ Settings" onPress={onOpenSettings} />
      
      <TextInput
        placeholder="Search requests..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
        placeholderTextColor={theme.text}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.chip,
              selectedCategory === cat && styles.selectedChip
            ]}
          >
            <Text style={{ color: selectedCategory === cat ? '#fff' : theme.text }}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
      ) : error ? (
        <Text style={styles.error}>Error: {error}</Text>
      ) : jobs.length === 0 ? (
        <Text style={styles.empty}>No requests found. Start one above!</Text>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <Button title="Get Urgent Help" onPress={() => setShowDropdown(true)} />

{showDropdown && (
  <>
    <Text>Select Category:</Text>
    <Picker
      selectedValue={selectedCategory}
      onValueChange={(itemValue) => setSelectedCategory(itemValue)}
    >
      <Picker.Item label="Plumbing" value="plumbing" />
      <Picker.Item label="Electrical" value="electrical" />
      <Picker.Item label="General" value="general" />
      {/* Add other categories here */}
    </Picker>

    <Button
      title="Dispatch Vendor"
      onPress={async () => {
        const res = await fetch(`${SERVER_URL}/dispatch_urgent_vendor`, {
          method: 'POST',
          body: JSON.stringify({
            chat_history: "Urgent help requested",
            category: selectedCategory,
          }),
          headers: { 'Content-Type': 'application/json' }
        });
        const json = await res.json();
        if (json.success) {
          // navigate to chat room if needed
          alert("Vendor dispatched!");
        } else {
          alert("No vendor available.");
        }
      }}
    />
  </>
)}

    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: theme.text },
    jobCard: {
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginVertical: 6,
      borderRadius: 6,
      backgroundColor: theme.card,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginBottom: 4,
    },
    badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    summary: { fontWeight: 'bold', marginBottom: 4 },
    error: { color: 'red', marginTop: 20 },
    empty: { marginTop: 20, fontStyle: 'italic', color: theme.text },
    searchInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      padding: 8,
      marginTop: 10,
      color: theme.text
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 8,
      backgroundColor: theme.card
    },
    selectedChip: {
      backgroundColor: theme.primary,
      borderColor: theme.primary
    }
  });

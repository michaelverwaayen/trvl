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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from './ThemeContext';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';
import { Picker } from 'react-native';
import { SERVER_URL } from './config';
import * as Location from 'expo-location';

export default function HomePage({ onStartNewRequest, onSelectJob, onOpenSettings, onGetEstimate }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const { user } = useAuth();

  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      let locParams = '';
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        locParams = `&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`;
      }
      const res = await fetch(
        `${SERVER_URL}/available_vendors?category=${selectedCategory}${locParams}`
      );
      const data = await res.json();
      setVendors(data || []);
    } catch (err) {
      console.error('Vendor fetch error', err);
      setVendors([]);
    } finally {
      setLoadingVendors(false);
    }
  };

  const dispatchVendor = async vendorId => {
    const res = await fetch(`${SERVER_URL}/dispatch_urgent_vendor`, {
      method: 'POST',
      body: JSON.stringify({
        chat_history: 'Urgent help requested',
        category: selectedCategory,
        vendor_id: vendorId
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (json.success) {
      alert('Vendor dispatched!');
      setVendors([]);
    } else {
      alert('No vendor available.');
    }
  };

  const fetchChats = async () => {
    if (!user?.email) {
      setLoadingChats(false);
      return;
    }
    setLoadingChats(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_email', user.email)
        .not('chat_room_id', 'is', null)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Chat fetch error', error);
      } else {
        setChats(data || []);
      }
    } catch (err) {
      console.error('Chat fetch exception', err);
    } finally {
      setLoadingChats(false);
    }
  };


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
    fetchChats();
  }, []);

  const categories = ['All', ...Array.from(new Set(jobs.map(j => j.category).filter(Boolean)))];
  const vendorCategories = ['All', 'plumbing', 'electrical', 'general'];
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

  const renderChatItem = ({ item }) => (
    <View style={styles.jobCard}>
      <Text style={styles.summary}>Chat: {item.assistant_reply?.slice(0, 60) || 'No summary'}</Text>
      <Text>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>🧾 Your Requests</Text>
        <TouchableOpacity onPress={onOpenSettings} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      
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

      <Button title="Get Estimate" onPress={onGetEstimate} />

      <View style={{ marginTop: 20 }}>
        <Text style={styles.sectionHeader}>Nearby Vendors</Text>
        <Picker
          selectedValue={selectedCategory}
          onValueChange={itemValue => setSelectedCategory(itemValue)}
        >
          {vendorCategories.map(cat => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
        <Button title="Search" onPress={fetchVendors} />
        {loadingVendors && <ActivityIndicator style={{ marginTop: 10 }} />}
        {vendors.map(v => (
          <TouchableOpacity
            key={v.id}
            style={styles.vendorItem}
            onPress={() => dispatchVendor(v.id)}
          >
            <Text>{v.name || v.email}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loadingChats ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : chats.length > 0 ? (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionHeader}>Active Chats</Text>
          <FlatList
            data={chats}
            keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
            renderItem={renderChatItem}
          />
        </View>
      ) : null}

      <TouchableOpacity style={styles.fab} onPress={onStartNewRequest}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, padding: 20, paddingBottom: 80 },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10
    },
    header: { fontSize: 24, fontWeight: 'bold', color: theme.text },
    settingsButton: {
      padding: 8
    },
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
    },
    vendorItem: {
      padding: 10,
      borderWidth: 1,
      borderColor: theme.border,
      marginTop: 8,
      borderRadius: 6,
      backgroundColor: theme.card
    },
    sectionHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 6,
      color: theme.text
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4
    }
  });

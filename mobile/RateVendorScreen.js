import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { supabase } from './supabase';

export default function RateVendorScreen({ vendorId, userId, onDone, onSkip }) {
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    const value = parseInt(rating, 10);
    if (!value || value < 1 || value > 5) {
      alert('Rating must be between 1 and 5');
      return;
    }
    await supabase.from('reviews').insert({
      vendor_id: vendorId,
      user_id: userId,
      rating: value,
      comment
    });
    onDone && onDone();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rate Vendor</Text>
      <Text>Rating (1-5)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={rating}
        onChangeText={setRating}
        placeholder="5"
      />
      <Text>Comment</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        multiline
        value={comment}
        onChangeText={setComment}
        placeholder="Optional feedback"
      />
      <View style={styles.row}>
        <Button title="Skip" onPress={onSkip} />
        <Button title="Submit" onPress={handleSubmit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }
});

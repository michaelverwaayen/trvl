import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function SkeletonList({ itemHeight = 20, itemCount = 3 }) {
  return (
    <View>
      {Array.from({ length: itemCount }).map((_, idx) => (
        <View key={idx} style={[styles.item, { height: itemHeight }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: '#ddd',
    borderRadius: 8,
    marginVertical: 6,
  },
});

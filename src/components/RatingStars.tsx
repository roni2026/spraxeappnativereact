import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface Props {
  rating: number;
  size?: number;
  max?: number;
  editable?: boolean;
  onChange?: (rating: number) => void;
}

/** Renders a 0..max star rating; tap-to-set when editable. Supports half stars in read mode. */
export default function RatingStars({
  rating,
  size = 16,
  max = 5,
  editable = false,
  onChange,
}: Props) {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    let name: keyof typeof Ionicons.glyphMap = 'star-outline';
    if (rating >= i) name = 'star';
    else if (!editable && rating >= i - 0.5) name = 'star-half';

    const icon = <Ionicons name={name} size={size} color={colors.orange500} />;
    if (editable) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => onChange?.(i)} style={styles.star}>
          {icon}
        </TouchableOpacity>,
      );
    } else {
      stars.push(
        <View key={i} style={styles.star}>
          {icon}
        </View>,
      );
    }
  }
  return <View style={styles.row}>{stars}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  star: { marginRight: 2 },
});

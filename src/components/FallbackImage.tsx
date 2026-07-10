import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface Props {
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  borderRadius?: number;
}

/** Image that shows a placeholder icon when the source is missing or fails to load. */
export default function FallbackImage({
  uri,
  style,
  contentFit = 'cover',
  iconName = 'image-outline',
  iconSize = 32,
  borderRadius = 0,
}: Props) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !uri || failed;

  if (showPlaceholder) {
    return (
      <View style={[styles.placeholder, { borderRadius }, style]}>
        <Ionicons name={iconName} size={iconSize} color={colors.gray600} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[{ borderRadius }, style]}
      contentFit={contentFit}
      transition={150}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ViewStyle, ImageStyle, StyleProp } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { optimizeImageUrl } from '../lib/cloudinary';

interface Props {
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  borderRadius?: number;
  /** Target display width in CSS pixels (Cloudinary w_ transform). */
  widthHint?: number;
}

/** Image that shows a placeholder icon when the source is missing or fails to load. */
export default function FallbackImage({
  uri,
  style,
  contentFit = 'cover',
  iconName = 'image-outline',
  iconSize = 32,
  borderRadius = 0,
  widthHint = 600,
}: Props) {
  const [failed, setFailed] = useState(false);
  const optimized = useMemo(() => optimizeImageUrl(uri, widthHint), [uri, widthHint]);
  const showPlaceholder = !optimized || failed;

  // Reset failed state when URI changes
  useEffect(() => {
    setFailed(false);
  }, [optimized]);

  // Prefetch the optimized URL for smoother scrolling
  useEffect(() => {
    if (optimized) {
      Image.prefetch(optimized).catch(() => {});
    }
  }, [optimized]);

  if (showPlaceholder) {
    return (
      <View style={[styles.placeholder, { borderRadius }, style]}>
        <Ionicons name={iconName} size={iconSize} color={colors.gray600} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: optimized }}
      style={[{ borderRadius }, style] as StyleProp<ImageStyle>}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      recyclingKey={optimized}
      transition={80}
      placeholder={undefined}
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

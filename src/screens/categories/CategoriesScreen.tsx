import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import FallbackImage from '../../components/FallbackImage';
import { getCategories } from '../../data/catalog';
import { Category } from '../../types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CategoriesScreen() {
  const navigation = useNavigation<Nav>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      setCategories(await getCategories());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      categories.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())),
    [categories, query],
  );

  return (
    <View style={styles.flex}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Categories</Text>
      </View>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.gray600} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories"
          placeholderTextColor={colors.gray600}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.navy900} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={load}>
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="grid-outline" size={48} color={colors.gray600} />
          <Text style={styles.empty}>No categories found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('Products', { categoryId: item.id, categoryName: item.name })
              }
            >
              <FallbackImage
                uri={item.image_url}
                style={styles.image}
                borderRadius={12}
                iconName="grid-outline"
              />
              <Text numberOfLines={1} style={styles.name}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  headerRow: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: '800', color: colors.navy900 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, color: colors.gray900 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  error: { color: colors.destructive },
  retry: { color: colors.orange500, fontWeight: '700' },
  empty: { color: colors.textMuted },
  list: { padding: 16 },
  row: { justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  image: { width: '100%', aspectRatio: 1.4, backgroundColor: colors.gray100 },
  name: { marginTop: 8, fontWeight: '600', color: colors.gray900 },
});

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import FallbackImage from '../../components/FallbackImage';
import { getCategoryTree } from '../../data/catalog';
import { Category } from '../../types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Node = Category & { children: Category[] };

export default function CategoriesScreen() {
  const navigation = useNavigation<Nav>();
  const [tree, setTree] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setError(null);
    try {
      setTree(await getCategoryTree());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tree;
    return tree
      .map((root) => {
        const children = root.children.filter((c) => c.name.toLowerCase().includes(q));
        if (root.name.toLowerCase().includes(q) || children.length) {
          return { ...root, children: children.length ? children : root.children };
        }
        return null;
      })
      .filter(Boolean) as Node[];
  }, [tree, query]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navy900} />
      </View>
    );
  }

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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const open = !!expanded[item.id] || !!query.trim();
          const hasKids = item.children?.length > 0;
          return (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  if (hasKids) setExpanded((e) => ({ ...e, [item.id]: !e[item.id] }));
                  else navigation.navigate('Products', { categoryId: item.id, categoryName: item.name });
                }}
                activeOpacity={0.8}
              >
                <FallbackImage uri={item.image_url} style={styles.thumb} widthHint={120} contentFit="contain" />
                <View style={styles.meta}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.count}>
                    {hasKids ? `${item.children.length} subcategories` : 'Browse products'}
                  </Text>
                </View>
                <Ionicons
                  name={hasKids ? (open ? 'chevron-up' : 'chevron-down') : 'chevron-forward'}
                  size={18}
                  color={colors.gray600}
                />
              </TouchableOpacity>
              {open && hasKids ? (
                <View style={styles.subs}>
                  <TouchableOpacity
                    style={styles.subRow}
                    onPress={() => navigation.navigate('Products', { categoryId: item.id, categoryName: item.name })}
                  >
                    <Text style={styles.subAll}>View all in {item.name}</Text>
                  </TouchableOpacity>
                  {item.children.map((child) => (
                    <TouchableOpacity
                      key={child.id}
                      style={styles.subRow}
                      onPress={() =>
                        navigation.navigate('Products', { categoryId: child.id, categoryName: child.name })
                      }
                    >
                      <FallbackImage uri={child.image_url} style={styles.subThumb} widthHint={80} contentFit="contain" />
                      <Text style={styles.subName}>{child.name}</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.gray600} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.navy900 },
  searchBar: {
    margin: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, height: 44,
  },
  searchInput: { flex: 1, color: colors.navy900 },
  error: { color: colors.destructive, paddingHorizontal: 16 },
  card: {
    marginBottom: 10, borderRadius: 16, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.gray100 },
  meta: { flex: 1 },
  name: { fontWeight: '700', color: colors.navy900 },
  count: { marginTop: 2, fontSize: 12, color: colors.gray600 },
  subs: { borderTopWidth: 1, borderTopColor: colors.gray100, paddingBottom: 6 },
  subRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14,
  },
  subThumb: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.gray100 },
  subName: { flex: 1, color: colors.navy900, fontWeight: '600' },
  subAll: { flex: 1, color: colors.navy900, fontWeight: '700' },
});

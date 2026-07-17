import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * A fixed (non-scrolling) navy header bar with the white Spraxe logo.
 * Shown on all platforms — on web it also includes inline nav links.
 * Using a fixed header eliminates the flicker that happens when the
 * header scrolls with the content.
 */
export default function ScreenHeader({
  title,
  showBack = false,
  showSearch = false,
  right,
}: {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  right?: React.ReactNode;
}) {
  const navigation = useNavigation<Nav>();
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <Image
            source={require('../../assets/header_logo_white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        {title && <Text style={styles.title}>{title}</Text>}
      </View>

      <View style={styles.right}>
        {isWeb && (
          <View style={styles.webNav}>
            <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}>
              <Text style={styles.webLink}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Search' })}>
              <Text style={styles.webLink}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Categories' })}>
              <Text style={styles.webLink}>Categories</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Cart' })}>
              <Text style={styles.webLink}>Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Profile' })}>
              <Text style={styles.webLink}>Account</Text>
            </TouchableOpacity>
          </View>
        )}
        {showSearch && (
          <TouchableOpacity onPress={() => navigation.navigate('Products')} hitSlop={8}>
            <Ionicons name="search-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        )}
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.navy900,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 4 },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 120,
    height: 32,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  webNav: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  webLink: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

import React from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TabParamList } from './types';
import { colors } from '../theme/colors';
import BottomTabBar from './BottomTabBar';
import HomeScreen from '../screens/home/HomeScreen';
import ProductsScreen from '../screens/products/ProductsScreen';
import CategoriesScreen from '../screens/categories/CategoriesScreen';
import CartScreen from '../screens/cart/CartScreen';
import AccountScreen from '../screens/profile/AccountScreen';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator<TabParamList>();

const isWeb = Platform.OS === 'web';

/** Top navigation bar for web/desktop — replaces the mobile bottom tab bar. */
function WebTopNav() {
  const navigation = useNavigation<any>();
  const { count } = useCart();

  const items: Array<{ name: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { name: 'Home', label: 'Home', icon: 'home-outline' },
    { name: 'Search', label: 'Search', icon: 'search-outline' },
    { name: 'Categories', label: 'Categories', icon: 'grid-outline' },
    { name: 'Cart', label: `Cart${count > 0 ? ` (${count})` : ''}`, icon: 'cart-outline' },
    { name: 'Profile', label: 'Account', icon: 'person-outline' },
  ];

  return (
    <View style={webNavStyles.bar}>
      <Image
        source={require('../../assets/header_logo_white.png')}
        style={webNavStyles.logo}
        resizeMode="contain"
      />
      <View style={webNavStyles.navItems}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={webNavStyles.navItem}
            onPress={() => navigation.navigate('Tabs', { screen: item.name })}
          >
            <Ionicons name={item.icon} size={18} color={colors.white} />
            <Text style={webNavStyles.navText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const webNavStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.navy900,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  logo: { width: 100, height: 32 },
  navItems: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navText: { color: colors.white, fontSize: 14, fontWeight: '600' },
});

/**
 * Primary bottom-tab navigation:
 *   Home · Search · Categories (center) · Cart · Profile
 * Rendered with a custom, buttery-smooth animated tab bar (see BottomTabBar).
 *
 * The tab screens hide the native header, so we wrap the navigator in a
 * top-edge SafeAreaView. This pushes screen content (e.g. the Home logo and
 * EN/BN toggle) below the device status bar / notch, instead of rendering
 * underneath it where it can't be seen or tapped.
 */
export default function TabNavigator() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy900 }} edges={['top']}>
      {isWeb && <WebTopNav />}
      <Tab.Navigator
        initialRouteName="Home"
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          lazy: true,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Search" component={ProductsScreen} />
        <Tab.Screen name="Categories" component={CategoriesScreen} />
        <Tab.Screen name="Cart" component={CartScreen} />
        <Tab.Screen name="Profile" component={AccountScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

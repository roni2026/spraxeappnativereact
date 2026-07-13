import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from './types';
import { colors } from '../theme/colors';
import BottomTabBar from './BottomTabBar';
import HomeScreen from '../screens/home/HomeScreen';
import WishlistScreen from '../screens/wishlist/WishlistScreen';
import CategoriesScreen from '../screens/categories/CategoriesScreen';
import CartScreen from '../screens/cart/CartScreen';
import AccountScreen from '../screens/profile/AccountScreen';

const Tab = createBottomTabNavigator<TabParamList>();

/**
 * Primary bottom-tab navigation:
 *   Home · Saved (favorites) · Categories (center) · Cart · Profile
 * Rendered with a custom, buttery-smooth animated tab bar (see BottomTabBar).
 *
 * The tab screens hide the native header, so we wrap the navigator in a
 * top-edge SafeAreaView. This pushes screen content (e.g. the Home logo and
 * EN/BN toggle) below the device status bar / notch, instead of rendering
 * underneath it where it can't be seen or tapped.
 */
export default function TabNavigator() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Tab.Navigator
        initialRouteName="Home"
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          lazy: true,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Saved" component={WishlistScreen} />
        <Tab.Screen name="Categories" component={CategoriesScreen} />
        <Tab.Screen name="Cart" component={CartScreen} />
        <Tab.Screen name="Profile" component={AccountScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

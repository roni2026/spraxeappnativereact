import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { useCart } from '../context/CartContext';

type IconName = keyof typeof Ionicons.glyphMap;

// Facebook / Instagram–style icon set: clean line icons that switch to their
// solid (filled) variant when the tab is active.
const ICONS: Record<string, { active: IconName; inactive: IconName; label: string }> = {
  Home: { active: 'home', inactive: 'home-outline', label: 'Home' },
  Saved: { active: 'heart', inactive: 'heart-outline', label: 'Saved' },
  Categories: { active: 'grid', inactive: 'grid-outline', label: 'Categories' },
  Cart: { active: 'cart', inactive: 'cart-outline', label: 'Cart' },
  Profile: { active: 'person', inactive: 'person-outline', label: 'Profile' },
};

/**
 * A single tab item with a spring-driven "pop" animation on focus so switching
 * tabs feels smooth like butter. The center item (Categories) renders as a
 * prominent elevated circular button, à la the Facebook/Instagram compose tab.
 */
function TabItem({
  routeName,
  isFocused,
  isCenter,
  badge,
  onPress,
  onLongPress,
}: {
  routeName: string;
  isFocused: boolean;
  isCenter: boolean;
  badge?: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const cfg = ICONS[routeName] ?? ICONS.Home;
  const scale = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  }, [isFocused, scale]);

  const animateTo = (v: number) =>
    Animated.spring(press, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 0 }).start();

  const iconColor = isFocused ? colors.navy900 : colors.gray600;

  if (isCenter) {
    // Elevated middle button
    const lift = scale.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
    return (
      <Pressable
        style={styles.item}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => animateTo(0.9)}
        onPressOut={() => animateTo(1)}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
      >
        <Animated.View
          style={[
            styles.centerButton,
            { backgroundColor: isFocused ? colors.navy900 : colors.navy800 },
            { transform: [{ scale: press }, { translateY: lift }] },
          ]}
        >
          <Ionicons name={isFocused ? cfg.active : cfg.inactive} size={26} color={colors.white} />
        </Animated.View>
        <Text style={[styles.label, { color: iconColor, fontWeight: isFocused ? '700' : '500' }]}>
          {cfg.label}
        </Text>
      </Pressable>
    );
  }

  const iconScale = scale.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const dotOpacity = scale;

  return (
    <Pressable
      style={styles.item}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => animateTo(0.85)}
      onPressOut={() => animateTo(1)}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
    >
      <Animated.View style={{ transform: [{ scale: Animated.multiply(iconScale, press) }] }}>
        <View>
          <Ionicons name={isFocused ? cfg.active : cfg.inactive} size={24} color={iconColor} />
          {badge !== undefined && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          )}
        </View>
      </Animated.View>
      <Text style={[styles.label, { color: iconColor, fontWeight: isFocused ? '700' : '500' }]}>
        {cfg.label}
      </Text>
      <Animated.View style={[styles.activeDot, { opacity: dotOpacity }]} />
    </Pressable>
  );
}

export default function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { count } = useCart();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const isCenter = index === Math.floor(state.routes.length / 2);
        const badge = route.name === 'Cart' ? count : undefined;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        const onLongPress = () =>
          navigation.emit({ type: 'tabLongPress', target: route.key });

        return (
          <TabItem
            key={route.key}
            routeName={route.name}
            isFocused={isFocused}
            isCenter={isCenter}
            badge={badge}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 12 },
    }),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.orange500,
    marginTop: 1,
  },
  badge: {
    position: 'absolute',
    right: -9,
    top: -5,
    backgroundColor: colors.orange500,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 4,
    borderColor: colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: colors.navy900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: { elevation: 8 },
    }),
  },
});

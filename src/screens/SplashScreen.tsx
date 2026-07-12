import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { syncFcmToken } from '../data/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { initializing } = useAuth();

  useEffect(() => {
    if (initializing) return;
    // Login is optional: always go straight into the app (Home). A guest
    // session is created automatically in AuthContext, so the cart and
    // checkout work without the user ever seeing a login screen.
    const t = setTimeout(async () => {
      // Best-effort keep push token fresh (no-op in Expo Go).
      try {
        await syncFcmToken();
      } catch {
        /* ignore */
      }
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    }, 400);
    return () => clearTimeout(t);
  }, [initializing, navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Spraxe</Text>
      <ActivityIndicator style={styles.spinner} color={colors.navy900} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  logo: { width: 120, height: 120 },
  title: { fontSize: 32, fontWeight: '800', color: colors.navy900, marginTop: 16 },
  spinner: { marginTop: 24 },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { syncFcmToken } from '../data/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { session, initializing } = useAuth();

  useEffect(() => {
    if (initializing) return;
    const t = setTimeout(async () => {
      if (session?.user) {
        // Best-effort keep push token fresh (no-op in Expo Go).
        try {
          await syncFcmToken();
        } catch {
          /* ignore */
        }
        navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [initializing, session, navigation]);

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

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

// Show alert + play sound when a notification arrives while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Ask for permission and return this device's Expo push token (or null).
 * Remote push requires a physical device and a dev/production build
 * (it does not work in Expo Go on SDK 51+). Fails softly so the app never crashes.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F97316',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? (Constants as any)?.easConfig?.projectId;
  if (!projectId) {
    // eslint-disable-next-line no-console
    console.warn('[push] No EAS projectId. Run `eas init` and rebuild to enable push tokens.');
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[push] Could not get Expo push token:', e);
    return null;
  }
}

/**
 * Register for push and persist the Expo token on the signed-in user's profile
 * (stored in profiles.fcm_token). No-op if signed out or push is unavailable.
 */
export async function syncPushToken(): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const token = await registerForPushNotificationsAsync();
    if (!token) return;
    await supabase.from('profiles').update({ fcm_token: token }).eq('id', user.id);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[push] syncPushToken failed:', e);
  }
}

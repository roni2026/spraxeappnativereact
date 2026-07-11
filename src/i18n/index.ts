import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import en from './en.json';
import bn from './bn.json';

const STORAGE_KEY = 'app_language';

function getDeviceLocale(): string {
  let locale = 'en';
  try {
    if (Platform.OS === 'ios') {
      locale =
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        'en';
    } else {
      locale = NativeModules.I18nManager?.localeIdentifier || 'en';
    }
  } catch {
    locale = 'en';
  }
  return locale.toLowerCase().startsWith('bn') ? 'bn' : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bn: { translation: bn },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Load persisted language or fall back to device locale
(async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'en' || saved === 'bn')) {
      await i18n.changeLanguage(saved);
    } else {
      const deviceLang = getDeviceLocale();
      await i18n.changeLanguage(deviceLang);
    }
  } catch {
    // Keep default 'en'
  }
})();

export async function changeLanguage(lang: string): Promise<void> {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(STORAGE_KEY, lang);
}

export function getCurrentLanguage(): string {
  return i18n.language?.startsWith('bn') ? 'bn' : 'en';
}

export default i18n;
